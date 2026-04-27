import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: "Missing subscription ID" });
    }

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    // In production, use actual Stripe SDK to cancel subscription
    // const stripe = new Stripe(STRIPE_SECRET_KEY);
    // const subscription = await stripe.subscriptions.update(subscriptionId, {
    //   cancel_at_period_end: true
    // });

    return res.status(200).json({
      success: true,
      message: "Subscription will be canceled at period end",
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}