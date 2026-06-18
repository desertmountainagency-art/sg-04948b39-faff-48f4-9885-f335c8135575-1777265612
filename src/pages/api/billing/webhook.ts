import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import { createAdminClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_SERVICE_ROLE_KEY not configured — billing webhook disabled");
    return res.status(500).json({ error: "Billing webhook not configured" });
  }

  const sig = req.headers["stripe-signature"];
  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig!, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`);
  }

  const db = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(db, session);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(db, invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(db, invoice);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(db, sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(db, sub);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(db, charge);
        break;
      }
      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

type AdminClient = ReturnType<typeof createAdminClient>;
type Plan = "starter" | "pro" | "enterprise";

async function getOrUpsertCustomer(
  db: AdminClient,
  stripeCustomerId: string,
  userId: string,
  email: string
) {
  const { data, error } = await db
    .from("customers")
    .upsert(
      { user_id: userId, stripe_customer_id: stripeCustomerId, email },
      { onConflict: "stripe_customer_id" }
    )
    .select("id, user_id")
    .single();
  if (error) throw new Error(`upsert customer failed: ${error.message}`);
  return data;
}

async function getCustomerByStripeId(db: AdminClient, stripeCustomerId: string) {
  const { data } = await db
    .from("customers")
    .select("id, user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();
  return data;
}

async function syncProfilePlan(db: AdminClient, userId: string, plan: Plan) {
  await db
    .from("profiles")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", userId);
}

async function resetScanCount(db: AdminClient, userId: string) {
  await db
    .from("profiles")
    .update({ scan_count: 0, updated_at: new Date().toISOString() })
    .eq("id", userId);
}

// ─── event handlers ─────────────────────────────────────────────────────────

async function handleCheckoutCompleted(db: AdminClient, session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id || session.metadata?.userId;
  if (!userId || userId === "anonymous") {
    console.warn("checkout.session.completed: no valid userId in client_reference_id");
    return;
  }

  const customer = await getOrUpsertCustomer(
    db,
    session.customer as string,
    userId,
    session.customer_email || ""
  );

  const plan = (session.metadata?.plan as Plan) || "pro";

  if (session.subscription) {
    // Fetch full subscription to get period data
    const stripeSub = await new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    }).subscriptions.retrieve(session.subscription as string);

    await db.from("subscriptions").upsert(
      {
        customer_id: customer.id,
        stripe_subscription_id: session.subscription as string,
        plan,
        status: "active",
        current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: stripeSub.cancel_at_period_end,
      },
      { onConflict: "stripe_subscription_id" }
    );
  }

  await syncProfilePlan(db, userId, plan);
}

async function handleInvoicePaid(db: AdminClient, invoice: Stripe.Invoice) {
  const customer = await getCustomerByStripeId(db, invoice.customer as string);
  if (!customer) return;

  // Record payment (idempotent via ON CONFLICT)
  if (invoice.payment_intent) {
    await db.from("payments").upsert(
      {
        customer_id: customer.id,
        stripe_payment_id: invoice.payment_intent as string,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: "succeeded",
        description: invoice.description || null,
        receipt_url: invoice.hosted_invoice_url || null,
      },
      { onConflict: "stripe_payment_id" }
    );
  }

  // Record invoice
  await db.from("invoices").upsert(
    {
      customer_id: customer.id,
      stripe_invoice_id: invoice.id,
      subscription_id: invoice.subscription as string | null,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: "paid",
      invoice_pdf: invoice.invoice_pdf || null,
      hosted_invoice_url: invoice.hosted_invoice_url || null,
    },
    { onConflict: "stripe_invoice_id" }
  );

  // Renewal: reset monthly scan counter so user gets a fresh 10 scans
  if (customer.user_id) {
    await resetScanCount(db, customer.user_id);
  }
}

async function handlePaymentFailed(db: AdminClient, invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  await db
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", invoice.subscription as string);

  // Downgrade profile plan so gate kicks in immediately
  const customer = await getCustomerByStripeId(db, invoice.customer as string);
  if (customer?.user_id) {
    await syncProfilePlan(db, customer.user_id, "starter");
  }
}

async function handleSubscriptionUpdated(db: AdminClient, sub: Stripe.Subscription) {
  const plan = derivePlan(sub);
  const isActive = sub.status === "active" || sub.status === "trialing";

  await db
    .from("subscriptions")
    .update({
      status: sub.status as "active" | "canceled" | "past_due" | "unpaid" | "trialing",
      plan,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", sub.id);

  // Sync profile plan: active/trialing = paid plan, anything else = starter
  const customer = await getCustomerByStripeId(db, sub.customer as string);
  if (customer?.user_id) {
    await syncProfilePlan(db, customer.user_id, isActive ? plan : "starter");
  }
}

async function handleSubscriptionDeleted(db: AdminClient, sub: Stripe.Subscription) {
  await db
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", sub.id);

  const customer = await getCustomerByStripeId(db, sub.customer as string);
  if (customer?.user_id) {
    await syncProfilePlan(db, customer.user_id, "starter");
  }
}

async function handleRefund(db: AdminClient, charge: Stripe.Charge) {
  if (!charge.refunds?.data?.length) return;

  const { data: payment } = await db
    .from("payments")
    .select("id")
    .eq("stripe_payment_id", charge.payment_intent as string)
    .maybeSingle();

  if (!payment) return;

  const refund = charge.refunds.data[0];
  await db.from("refunds").upsert(
    {
      payment_id: payment.id,
      stripe_refund_id: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status as "pending" | "succeeded" | "failed" | "canceled",
      reason: refund.reason || null,
    },
    { onConflict: "stripe_refund_id" }
  );

  const totalRefunded = charge.refunds.data.reduce((sum, r) => sum + r.amount, 0);
  const newStatus = totalRefunded >= charge.amount ? "refunded" : "partially_refunded";
  await db
    .from("payments")
    .update({ status: newStatus as "refunded" | "partially_refunded" })
    .eq("id", payment.id);
}

// Derive our plan tier from the Stripe subscription's price metadata or product name.
// Falls back to "pro" since that's our only paid tier besides enterprise.
function derivePlan(sub: Stripe.Subscription): Plan {
  const priceId = sub.items.data[0]?.price?.id || "";
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return "enterprise";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  // Check metadata as fallback
  const meta = (sub as Stripe.Subscription & { metadata?: Record<string, string> }).metadata;
  if (meta?.plan === "enterprise") return "enterprise";
  return "pro";
}

export const config = {
  api: { bodyParser: false },
};
