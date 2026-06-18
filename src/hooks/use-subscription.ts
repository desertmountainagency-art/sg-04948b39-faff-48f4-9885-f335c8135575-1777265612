import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Plan = "starter" | "pro" | "enterprise";

export const FREE_SCAN_LIMIT = 10;

export interface SubscriptionState {
  plan: Plan;
  scanCount: number;
  loading: boolean;
  /** True when plan is pro or enterprise with active status */
  isPro: boolean;
  /** Scans remaining this period (null = unlimited) */
  scansRemaining: number | null;
  /** True when starter plan has hit the monthly limit */
  scanLimitReached: boolean;
  /** Increment the local scan counter (call before starting a scan) */
  incrementScanCount: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>("starter");
  const [scanCount, setScanCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("plan, scan_count")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setPlan((data.plan as Plan) || "starter");
      setScanCount(data.scan_count ?? 0);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Subscribe to realtime changes so plan updates pushed by the webhook
  // are reflected without a page reload.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { plan?: string; scan_count?: number };
          if (row.plan) setPlan(row.plan as Plan);
          if (typeof row.scan_count === "number") setScanCount(row.scan_count);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isPro = plan === "pro" || plan === "enterprise";
  const scansRemaining = isPro ? null : Math.max(0, FREE_SCAN_LIMIT - scanCount);
  const scanLimitReached = !isPro && scanCount >= FREE_SCAN_LIMIT;

  const incrementScanCount = useCallback(async () => {
    if (!user) return;
    const next = scanCount + 1;
    setScanCount(next);
    await supabase
      .from("profiles")
      .update({ scan_count: next, updated_at: new Date().toISOString() })
      .eq("id", user.id);
  }, [user, scanCount]);

  return {
    plan,
    scanCount,
    loading,
    isPro,
    scansRemaining,
    scanLimitReached,
    incrementScanCount,
    refetch: fetchProfile,
  };
}
