import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

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

  try {
    const event = req.body;

    // In production, verify webhook signature
    // const sig = req.headers["stripe-signature"];
    // const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    console.log("Stripe webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        // Create customer and subscription records
        await handleCheckoutCompleted(session);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        // Record payment
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        // Update subscription status
        await handlePaymentFailed(invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        // Update subscription
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        // Cancel subscription
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        // Record refund
        await handleRefund(charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}

async function handleCheckoutCompleted(session: any) {
  // Create or update customer
  const { data: customer } = await supabaseAdmin
    .from("customers")
    .upsert({
      user_id: session.client_reference_id,
      stripe_customer_id: session.customer,
      email: session.customer_email,
    })
    .select()
    .single();

  if (customer && session.subscription) {
    // Create subscription record
    await supabaseAdmin.from("subscriptions").insert({
      customer_id: customer.id,
      stripe_subscription_id: session.subscription,
      plan: session.metadata?.plan || "pro",
      status: "active",
    });
  }
}

async function handleInvoicePaid(invoice: any) {
  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", invoice.customer)
    .single();

  if (customer) {
    // Record payment
    await supabaseAdmin.from("payments").insert({
      customer_id: customer.id,
      stripe_payment_id: invoice.payment_intent,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: "succeeded",
      description: invoice.description,
      receipt_url: invoice.receipt_url,
    });

    // Record invoice
    await supabaseAdmin.from("invoices").insert({
      customer_id: customer.id,
      stripe_invoice_id: invoice.id,
      subscription_id: invoice.subscription,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: "paid",
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
    });
  }
}

async function handlePaymentFailed(invoice: any) {
  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", invoice.customer)
    .single();

  if (customer && invoice.subscription) {
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "past_due" })
      .eq("stripe_subscription_id", invoice.subscription);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleSubscriptionDeleted(subscription: any) {
  await supabaseAdmin
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleRefund(charge: any) {
  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id")
    .eq("stripe_payment_id", charge.payment_intent)
    .single();

  if (payment && charge.refunds?.data?.length > 0) {
    const refund = charge.refunds.data[0];
    await supabaseAdmin.from("refunds").insert({
      payment_id: payment.id,
      stripe_refund_id: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
    });

    // Update payment status
    const totalRefunded = charge.refunds.data.reduce(
      (sum: number, r: any) => sum + r.amount,
      0
    );
    const newStatus =
      totalRefunded >= charge.amount ? "refunded" : "partially_refunded";

    await supabaseAdmin
      .from("payments")
      .update({ status: newStatus })
      .eq("id", payment.id);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};