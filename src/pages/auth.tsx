import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type AuthMode = "signin" | "signup" | "reset";

export default function Auth() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const redirectTo = (router.query.redirectTo as string) || "/dashboard";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(redirectTo);
    });
  }, [redirectTo, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "reset") {
        const { error } = await authService.resetPassword(email);
        if (error) {
          setError(error.message);
          toast({ title: "Reset failed", description: error.message, variant: "destructive" });
        } else {
          setSuccess("Password reset link sent. Check your email.");
          toast({ title: "Check your email", description: "A password reset link has been sent." });
        }
        return;
      }

      if (mode === "signup") {
        const { error } = await authService.signUp(email, password);
        if (error) {
          setError(error.message);
          toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Account created!", description: "Let's set up your first project." });
          router.replace("/onboarding");
        }
        return;
      }

      const { error } = await authService.signIn(email, password);
      if (error) {
        setError(error.message);
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Welcome back!" });
        router.replace(redirectTo);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Sign In — vibecheck.dev"
        description="Sign in to vibecheck.dev to access your security audits."
      />

      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30">
              <Shield className="w-6 h-6 text-accent-cyan" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">
                vibecheck<span className="text-accent-cyan">.dev</span>
              </h1>
              <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase mt-1">
                {mode === "signin" ? "Sign in to your account" : mode === "signup" ? "Create an account" : "Reset your password"}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-surface-1 border border-border rounded-xl p-6 space-y-5">
            {error && (
              <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="px-4 py-3 bg-accent-green/10 border border-accent-green/20 rounded-lg">
                <p className="text-sm text-accent-green">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
                />
              </div>

              {mode !== "reset" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      minLength={6}
                      className="w-full px-4 py-2.5 pr-11 bg-surface-2 border border-border rounded-lg text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-accent-cyan text-background font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
              </button>
            </form>

            <div className="space-y-2 pt-1">
              {mode === "signin" && (
                <>
                  <button
                    onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
                    className="w-full text-center text-xs text-text-muted hover:text-foreground transition-colors"
                  >
                    No account? <span className="text-accent-cyan">Sign up</span>
                  </button>
                  <button
                    onClick={() => { setMode("reset"); setError(null); setSuccess(null); }}
                    className="w-full text-center text-xs text-text-dim hover:text-text-muted transition-colors"
                  >
                    Forgot password?
                  </button>
                </>
              )}

              {(mode === "signup" || mode === "reset") && (
                <button
                  onClick={() => { setMode("signin"); setError(null); setSuccess(null); }}
                  className="w-full text-center text-xs text-text-muted hover:text-foreground transition-colors"
                >
                  Already have an account? <span className="text-accent-cyan">Sign in</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
