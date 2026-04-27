import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { buffer } from "micro";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  let event: Stripe.Event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("Webhook secret not configured");
    }
    event = stripe.webhooks.constructEvent(buf, sig!, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`);
  }

  console.log("Processing Stripe webhook event:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { data: customer } = await supabaseAdmin
    .from("customers")
    .upsert({
      user_id: session.client_reference_id || "anonymous",
      stripe_customer_id: session.customer as string,
      email: session.customer_email || "",
    })
    .select()
    .single();

  if (customer && session.subscription) {
    await supabaseAdmin.from("subscriptions").insert({
      customer_id: customer.id,
      stripe_subscription_id: session.subscription as string,
      plan: (session.metadata?.plan as "pro" | "enterprise") || "pro",
      status: "active",
    });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", invoice.customer as string)
    .single();

  if (customer) {
    await supabaseAdmin.from("payments").insert({
      customer_id: customer.id,
      stripe_payment_id: invoice.payment_intent as string,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: "succeeded",
      description: invoice.description || null,
      receipt_url: invoice.hosted_invoice_url || null,
    });

    await supabaseAdmin.from("invoices").insert({
      customer_id: customer.id,
      stripe_invoice_id: invoice.id,
      subscription_id: invoice.subscription as string,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: "paid",
      invoice_pdf: invoice.invoice_pdf || null,
      hosted_invoice_url: invoice.hosted_invoice_url || null,
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", invoice.customer as string)
    .single();

  if (customer && invoice.subscription) {
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "past_due" })
      .eq("stripe_subscription_id", invoice.subscription as string);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: subscription.status as "active" | "canceled" | "past_due" | "unpaid" | "trialing",
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleRefund(charge: Stripe.Charge) {
  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id")
    .eq("stripe_payment_id", charge.payment_intent as string)
    .single();

  if (payment && charge.refunds?.data?.length) {
    const refund = charge.refunds.data[0];
    await supabaseAdmin.from("refunds").insert({
      payment_id: payment.id,
      stripe_refund_id: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status as "pending" | "succeeded" | "failed" | "canceled",
      reason: refund.reason || null,
    });

    const totalRefunded = charge.refunds.data.reduce((sum, r) => sum + r.amount, 0);
    const newStatus = totalRefunded >= charge.amount ? "refunded" : "partially_refunded";

    await supabaseAdmin
      .from("payments")
      .update({ status: newStatus as "succeeded" | "pending" | "failed" | "refunded" | "partially_refunded" })
      .eq("id", payment.id);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};