import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getAuthUser } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const PRICE_MAP: Record<string, string> = {
  pro: process.env.STRIPE_PRO_PRICE_ID || "",
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || "",
};

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

  const { plan } = req.body as { plan?: string };
  if (!plan || !PRICE_MAP[plan]) {
    return res.status(400).json({ error: "Invalid or missing plan" });
  }

  const priceId = PRICE_MAP[plan];
  if (!priceId) {
    return res.status(400).json({ error: `Price not configured for plan: ${plan}` });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?checkout=canceled`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: {
        plan,
        userId: user.id,
      },
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Checkout session error:", error);
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}
