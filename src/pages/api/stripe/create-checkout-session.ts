import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { plan, userId, email } = req.body;

    // Validate Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Stripe not configured - missing STRIPE_SECRET_KEY");
      return res.status(500).json({ error: "Payment system not configured. Please add Stripe API keys to .env.local" });
    }

    // Validate required fields
    if (!plan) {
      return res.status(400).json({ error: "Missing plan" });
    }

    // Price mapping
    const priceMap: Record<string, string> = {
      pro: process.env.STRIPE_PRO_PRICE_ID || "",
      enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || "",
    };

    const priceId = priceMap[plan];
    if (!priceId) {
      return res.status(400).json({ error: "Invalid plan or price not configured" });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?checkout=canceled`,
      client_reference_id: userId,
      customer_email: email,
      metadata: {
        plan,
        userId: userId || "anonymous",
      },
    });

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Checkout session error:", error);
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}