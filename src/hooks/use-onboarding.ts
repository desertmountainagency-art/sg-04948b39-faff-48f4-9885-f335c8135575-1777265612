import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingState {
  /** null = still loading, true = done, false = incomplete */
  completed: boolean | null;
  loading: boolean;
  markComplete: () => Promise<void>;
}

export function useOnboarding(): OnboardingState {
  const { user } = useAuth();
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCompleted(null);
      setLoading(false);
      return;
    }

    supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setCompleted(data?.onboarding_completed_at != null);
        setLoading(false);
      });
  }, [user]);

  const markComplete = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", user.id);
    setCompleted(true);
  }, [user]);

  return { completed, loading, markComplete };
}
