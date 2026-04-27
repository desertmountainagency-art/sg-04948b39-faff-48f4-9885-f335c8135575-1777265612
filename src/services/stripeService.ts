import { supabase } from "@/integrations/supabase/client";

export interface StripeCustomer {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface StripeSubscription {
  id: string;
  customer_id: string;
  stripe_subscription_id: string;
  plan: "starter" | "pro" | "enterprise";
  status: "active" | "canceled" | "past_due" | "unpaid" | "trialing";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface StripePayment {
  id: string;
  customer_id: string;
  stripe_payment_id: string;
  amount: number;
  currency: string;
  status: "succeeded" | "pending" | "failed" | "refunded" | "partially_refunded";
  description: string | null;
  receipt_url: string | null;
  created_at: string;
}

export interface StripeInvoice {
  id: string;
  customer_id: string;
  stripe_invoice_id: string;
  subscription_id: string | null;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  created_at: string;
}

export interface StripeRefund {
  id: string;
  payment_id: string;
  stripe_refund_id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "canceled";
  reason: string | null;
  created_at: string;
}

export const stripeService = {
  // Customer operations
  async getCustomer(userId: string): Promise<StripeCustomer | null> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching customer:", error);
      return null;
    }

    return data as StripeCustomer;
  },

  async createCustomer(userId: string, email: string, stripeCustomerId: string, name?: string): Promise<StripeCustomer | null> {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        email,
        name,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating customer:", error);
      return null;
    }

    return data as StripeCustomer;
  },

  // Subscription operations
  async getActiveSubscription(userId: string): Promise<StripeSubscription | null> {
    const customer = await this.getCustomer(userId);
    if (!customer) return null;

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("customer_id", customer.id)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("Error fetching subscription:", error);
      return null;
    }

    return data as unknown as StripeSubscription;
  },

  async getAllSubscriptions(userId: string): Promise<StripeSubscription[]> {
    const customer = await this.getCustomer(userId);
    if (!customer) return [];

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return [];
    }

    return (data || []) as unknown as StripeSubscription[];
  },

  // Payment operations
  async getPaymentHistory(userId: string): Promise<StripePayment[]> {
    const customer = await this.getCustomer(userId);
    if (!customer) return [];

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payment history:", error);
      return [];
    }

    return (data || []) as unknown as StripePayment[];
  },

  // Invoice operations
  async getInvoices(userId: string): Promise<StripeInvoice[]> {
    const customer = await this.getCustomer(userId);
    if (!customer) return [];

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invoices:", error);
      return [];
    }

    return (data || []) as unknown as StripeInvoice[];
  },

  // Refund operations
  async getRefunds(userId: string): Promise<StripeRefund[]> {
    const customer = await this.getCustomer(userId);
    if (!customer) return [];

    const { data: payments } = await supabase
      .from("payments")
      .select("id")
      .eq("customer_id", customer.id);

    if (!payments || payments.length === 0) return [];

    const paymentIds = payments.map((p) => p.id);

    const { data, error } = await supabase
      .from("refunds")
      .select(`
        *,
        payment:payments(*)
      `)
      .in("payment_id", paymentIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching refunds:", error);
      return [];
    }

    return (data || []) as unknown as StripeRefund[];
  }
};