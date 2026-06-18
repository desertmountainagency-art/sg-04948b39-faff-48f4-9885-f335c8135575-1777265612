import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getAuthUser, createAdminClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Stripe not configured" });
  }

  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { subscriptionId } = req.body as { subscriptionId?: string };
  if (!subscriptionId) {
    return res.status(400).json({ error: "Missing subscriptionId" });
  }

  // Verify the subscription belongs to this user before canceling
  const db = createAdminClient();
  const { data: customer } = await db
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!customer) {
    return res.status(404).json({ error: "No billing account found" });
  }

  const { data: sub } = await db
    .from("subscriptions")
    .select("id")
    .eq("customer_id", customer.id)
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (!sub) {
    return res.status(403).json({ error: "Subscription not found or access denied" });
  }

  try {
    const updated = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Optimistically update the DB so UI reflects the change immediately
    await db
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId);

    return res.status(200).json({
      success: true,
      cancel_at_period_end: updated.cancel_at_period_end,
      current_period_end: new Date(updated.current_period_end * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}
