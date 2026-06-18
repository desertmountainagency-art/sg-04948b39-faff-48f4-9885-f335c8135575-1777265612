import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getAuthUser } from "@/lib/supabase-server";

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

  const { subscriptionId } = req.body;
  if (!subscriptionId) {
    return res.status(400).json({ error: "Missing subscription ID" });
  }

  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return res.status(200).json({
      success: true,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}
