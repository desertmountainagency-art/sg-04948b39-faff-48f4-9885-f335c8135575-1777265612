import { useState, useEffect, useCallback } from "react";
import { Bell, Zap, Key, User, Eye, EyeOff, Copy, Check, CreditCard, Download, ExternalLink, Loader2, LogOut } from "lucide-react";
import { stripeService, StripePayment, StripeInvoice, StripeSubscription } from "@/services/stripeService";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

interface NotificationSettings {
  pushNotifications: boolean;
  criticalAlerts: boolean;
  weeklyDigest: boolean;
}

interface ScanPreferences {
  autoScanOnPush: boolean;
}

interface LocalSettings {
  notifications: NotificationSettings;
  scanPreferences: ScanPreferences;
  apiKey: string;
  showApiKey: boolean;
  copied: boolean;
  saved: boolean;
}

export function Settings() {
  const { user, session, signOut } = useAuth();
  const router = useRouter();

  const [settings, setSettings] = useState<LocalSettings>({
    notifications: {
      pushNotifications: true,
      criticalAlerts: true,
      weeklyDigest: false,
    },
    scanPreferences: {
      autoScanOnPush: false,
    },
    apiKey: "",
    showApiKey: false,
    copied: false,
    saved: false,
  });

  const [paymentData, setPaymentData] = useState<{
    subscription: StripeSubscription | null;
    payments: StripePayment[];
    invoices: StripeInvoice[];
    loading: boolean;
  }>({
    subscription: null,
    payments: [],
    invoices: [],
    loading: false,
  });

  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  const loadPaymentData = useCallback(
    async (userId: string) => {
      setPaymentData((prev) => ({ ...prev, loading: true }));

      const [subscription, payments, invoices] = await Promise.all([
        stripeService.getActiveSubscription(userId),
        stripeService.getPaymentHistory(userId),
        stripeService.getInvoices(userId),
      ]);

      setPaymentData({ subscription, payments, invoices, loading: false });
    },
    []
  );

  useEffect(() => {
    const savedSettings = localStorage.getItem("vibecheck_settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore malformed stored settings
      }
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadPaymentData(user.id);
    }
  }, [user?.id, loadPaymentData]);

  const persistSettings = (updates: Partial<LocalSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    const { showApiKey, copied, saved, ...storable } = updated;
    localStorage.setItem("vibecheck_settings", JSON.stringify(storable));
    setSettings((prev) => ({ ...prev, saved: true }));
    setTimeout(() => setSettings((prev) => ({ ...prev, saved: false })), 2000);
  };

  const handleToggle = (category: "notifications" | "scanPreferences", key: string) => {
    persistSettings({
      [category]: {
        ...settings[category],
        [key]: !settings[category][key as keyof typeof settings[typeof category]],
      },
    });
  };

  const handleGenerateApiKey = () => {
    const newKey = `vbc_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    persistSettings({ apiKey: newKey });
  };

  const handleCopyApiKey = () => {
    if (!settings.apiKey) return;
    navigator.clipboard.writeText(settings.apiKey);
    setSettings((prev) => ({ ...prev, copied: true }));
    setTimeout(() => setSettings((prev) => ({ ...prev, copied: false })), 2000);
  };

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  });

  const handleCancelSubscription = async () => {
    if (!paymentData.subscription) return;

    setCancelingSubscription(true);
    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          subscriptionId: paymentData.subscription.stripe_subscription_id,
        }),
      });

      if (response.ok && user?.id) {
        await loadPaymentData(user.id);
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
    } finally {
      setCancelingSubscription(false);
    }
  };

  const handleOpenCustomerPortal = async () => {
    setOpeningPortal(true);
    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error opening portal:", error);
    } finally {
      setOpeningPortal(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth");
  };

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-sm text-text-muted">Manage your account and preferences</p>
      </div>

      {/* Saved Indicator */}
      {settings.saved && (
        <div className="px-4 py-2 bg-accent-green/10 border border-accent-green/20 rounded-lg">
          <p className="text-sm text-accent-green flex items-center gap-2">
            <Check className="w-4 h-4" />
            Settings saved
          </p>
        </div>
      )}

      {/* Account Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-accent-cyan" />
          <h2 className="text-sm font-bold tracking-widest uppercase">Account</h2>
        </div>

        <div className="bg-surface-1 border border-border rounded-lg p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-[9px] font-bold tracking-widest text-text-muted uppercase">Email</p>
            <p className="text-sm font-mono text-foreground">{user?.email ?? "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-bold tracking-widest text-text-muted uppercase">User ID</p>
            <p className="text-xs font-mono text-text-dim truncate">{user?.id ?? "—"}</p>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border-subtle text-text-muted font-bold text-xs tracking-widest uppercase rounded-lg hover:border-destructive hover:text-destructive transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Subscription Section */}
      {paymentData.loading ? (
        <div className="bg-surface-1 border border-border rounded-lg p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent-cyan" />
        </div>
      ) : paymentData.subscription ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent-cyan" />
            <h2 className="text-sm font-bold tracking-widest uppercase">Subscription</h2>
          </div>

          <div className="bg-surface-1 border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-bold tracking-widest text-text-muted uppercase mb-1">
                  Current Plan
                </p>
                <p className="text-lg font-bold capitalize">{paymentData.subscription.plan}</p>
                <p className="text-sm text-text-muted mt-1">
                  {paymentData.subscription.status === "active" ? (
                    <span className="text-accent-green">Active</span>
                  ) : (
                    <span className="text-warning">
                      {paymentData.subscription.status.replace("_", " ")}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold tracking-widest text-text-muted uppercase mb-1">
                  Next Billing
                </p>
                <p className="text-sm">
                  {formatDate(paymentData.subscription.current_period_end)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleOpenCustomerPortal}
                disabled={openingPortal}
                className="flex-1 px-4 py-2 bg-accent-cyan text-background font-bold text-xs tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all disabled:opacity-50"
              >
                {openingPortal ? "Loading..." : "Manage Billing"}
              </button>
              {!paymentData.subscription.cancel_at_period_end && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelingSubscription}
                  className="px-4 py-2 bg-surface-2 border border-border-subtle text-text-muted font-bold text-xs tracking-widest uppercase rounded-lg hover:border-destructive hover:text-destructive transition-all disabled:opacity-50"
                >
                  {cancelingSubscription ? "Canceling..." : "Cancel"}
                </button>
              )}
            </div>

            {paymentData.subscription.cancel_at_period_end && (
              <div className="px-3 py-2 bg-warning/10 border border-warning/20 rounded text-sm text-warning">
                Subscription will cancel on {formatDate(paymentData.subscription.current_period_end)}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Payment History */}
      {paymentData.payments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent-cyan" />
            <h2 className="text-sm font-bold tracking-widest uppercase">Payment History</h2>
          </div>

          <div className="bg-surface-1 border border-border rounded-lg divide-y divide-border">
            {paymentData.payments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono">{formatCurrency(payment.amount, payment.currency)}</p>
                  <p className="text-xs text-text-muted mt-1">{formatDate(payment.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold tracking-widest uppercase ${
                      payment.status === "succeeded"
                        ? "text-accent-green"
                        : payment.status === "failed"
                        ? "text-destructive"
                        : "text-text-muted"
                    }`}
                  >
                    {payment.status}
                  </span>
                  {payment.receipt_url && (
                    <a
                      href={payment.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-cyan hover:text-accent-cyan/80"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices */}
      {paymentData.invoices.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-accent-cyan" />
            <h2 className="text-sm font-bold tracking-widest uppercase">Invoices</h2>
          </div>

          <div className="bg-surface-1 border border-border rounded-lg divide-y divide-border">
            {paymentData.invoices.slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono">{formatCurrency(invoice.amount_paid, invoice.currency)}</p>
                  <p className="text-xs text-text-muted mt-1">{formatDate(invoice.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold tracking-widest uppercase ${
                      invoice.status === "paid"
                        ? "text-accent-green"
                        : invoice.status === "open"
                        ? "text-warning"
                        : "text-text-muted"
                    }`}
                  >
                    {invoice.status}
                  </span>
                  {invoice.invoice_pdf && (
                    <a
                      href={invoice.invoice_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-cyan hover:text-accent-cyan/80"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Key Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-accent-cyan" />
          <h2 className="text-sm font-bold tracking-widest uppercase">API Key</h2>
        </div>

        <div className="bg-surface-1 border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <input
              type={settings.showApiKey ? "text" : "password"}
              value={settings.apiKey || "No API key generated"}
              readOnly
              className="flex-1 px-4 py-2 bg-surface-2 border border-border-subtle rounded text-sm font-mono"
            />
            <button
              onClick={() => setSettings((prev) => ({ ...prev, showApiKey: !prev.showApiKey }))}
              className="p-2 bg-surface-2 border border-border-subtle rounded hover:border-border transition-all"
            >
              {settings.showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={handleCopyApiKey}
              disabled={!settings.apiKey}
              className="p-2 bg-surface-2 border border-border-subtle rounded hover:border-border transition-all disabled:opacity-50"
            >
              {settings.copied ? <Check className="w-4 h-4 text-accent-green" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleGenerateApiKey}
            className="w-full px-4 py-2 bg-accent-cyan text-background font-bold text-xs tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all"
          >
            {settings.apiKey ? "Rotate Key" : "Generate Key"}
          </button>

          <p className="text-xs text-text-dim">
            Use this API key to integrate vibecheck.dev scans into your CI/CD pipeline
          </p>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent-cyan" />
          <h2 className="text-sm font-bold tracking-widest uppercase">Notifications</h2>
        </div>

        <div className="bg-surface-1 border border-border rounded-lg divide-y divide-border">
          {(
            [
              { key: "pushNotifications", label: "Push Notifications", desc: "Receive alerts on your device" },
              { key: "criticalAlerts", label: "Critical Alerts", desc: "High severity vulnerabilities" },
              { key: "weeklyDigest", label: "Weekly Digest", desc: "Summary of scan activity" },
            ] as const
          ).map(({ key, label, desc }) => (
            <div key={key} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-text-muted mt-1">{desc}</p>
              </div>
              <button
                onClick={() => handleToggle("notifications", key)}
                className={`relative w-11 h-6 rounded-full transition-all ${
                  settings.notifications[key] ? "bg-accent-cyan" : "bg-surface-2 border border-border-subtle"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform ${
                    settings.notifications[key] ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Scan Preferences */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent-cyan" />
          <h2 className="text-sm font-bold tracking-widest uppercase">Scan Preferences</h2>
        </div>

        <div className="bg-surface-1 border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-Scan on Git Push</p>
              <p className="text-xs text-text-muted mt-1">Automatically scan when you push code</p>
            </div>
            <button
              onClick={() => handleToggle("scanPreferences", "autoScanOnPush")}
              className={`relative w-11 h-6 rounded-full transition-all ${
                settings.scanPreferences.autoScanOnPush ? "bg-accent-cyan" : "bg-surface-2 border border-border-subtle"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform ${
                  settings.scanPreferences.autoScanOnPush ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="pt-6 border-t border-border">
        <p className="text-xs text-text-dim text-center font-mono">vibecheck.dev v1.0.0</p>
        <p className="text-[9px] text-text-dim text-center mt-1 uppercase tracking-widest">
          © 2026 vibecheck.dev
        </p>
      </div>
    </div>
  );
}
