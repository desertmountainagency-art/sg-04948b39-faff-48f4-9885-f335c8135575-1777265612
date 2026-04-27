import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { plan, userId, email } = req.body;

    if (!plan || !userId || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    // Price mapping
    const priceMap: Record<string, { priceId: string; amount: number }> = {
      pro: {
        priceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro_monthly",
        amount: 4900, // $49.00
      },
      enterprise: {
        priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise_monthly",
        amount: 0, // Contact sales
      },
    };

    const selectedPlan = priceMap[plan];
    if (!selectedPlan) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    // In production, use actual Stripe SDK
    // For now, return mock checkout URL
    const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app?checkout=success&plan=${plan}`;

    return res.status(200).json({
      url: checkoutUrl,
      sessionId: `cs_mock_${Date.now()}`,
    });
  } catch (error) {
    console.error("Checkout session error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}