import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: "Missing customer ID" });
    }

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    // In production, use actual Stripe SDK to create portal session
    // const stripe = new Stripe(STRIPE_SECRET_KEY);
    // const session = await stripe.billingPortal.sessions.create({
    //   customer: customerId,
    //   return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?tab=settings`,
    // });

    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app?tab=settings&portal=mock`;

    return res.status(200).json({
      url: portalUrl,
    });
  } catch (error) {
    console.error("Portal session error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}