import { useState } from "react";
import Link from "next/link";
import { Zap, ArrowRight, Lock } from "lucide-react";
import { SEO } from "@/components/SEO";
import { BottomNav } from "@/components/BottomNav";
import { ScanProgress } from "@/components/ScanProgress";
import { ReportDashboard } from "@/components/ReportDashboard";
import { FindingsList } from "@/components/FindingsList";
import { Settings } from "@/components/Settings";
import { useSubscription, FREE_SCAN_LIMIT } from "@/hooks/use-subscription";
import type { ScanRecord } from "@/lib/vibecheck";

type AppScreen = "home" | "scanning" | "report" | "findings";

export default function App() {
  const [activeTab, setActiveTab] = useState<"scan" | "reports" | "settings">("scan");
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("home");
  const [scanUrl, setScanUrl] = useState("");
  const [currentScan, setCurrentScan] = useState<ScanRecord | null>(null);
  const subscription = useSubscription();

  const handleTabChange = (tab: "scan" | "reports" | "settings") => {
    setActiveTab(tab);
    if (tab === "scan") setCurrentScreen("home");
    else if (tab === "reports") setCurrentScreen(currentScan ? "report" : "home");
  };

  const handleStartScan = async () => {
    if (!scanUrl.trim() || subscription.scanLimitReached) return;
    await subscription.incrementScanCount();
    setCurrentScreen("scanning");
  };

  const handleScanComplete = (scan: ScanRecord) => {
    setCurrentScan(scan);
    setCurrentScreen("report");
    setActiveTab("reports");
  };

  const renderScanHome = () => {
    if (subscription.scanLimitReached) {
      return (
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold">
              vibecheck<span className="text-accent-cyan">.dev</span>
            </h1>
            <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
              AI Security Audits
            </p>
          </div>

          <div className="bg-surface-1 border-2 border-accent-cyan/30 rounded-xl p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7 text-accent-cyan" strokeWidth={2} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold text-foreground">Free plan limit reached</p>
              <p className="text-xs text-text-muted leading-relaxed">
                You&apos;ve used all {FREE_SCAN_LIMIT} free scans this month. Upgrade to Pro for
                unlimited scans and advanced AI analysis.
              </p>
            </div>
            <div className="space-y-3">
              <Link
                href="/#pricing"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-accent-cyan text-background font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 active:scale-[0.98] transition-all"
              >
                <Zap className="w-4 h-4" />
                Upgrade to Pro
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[10px] text-text-dim uppercase tracking-widest">
                Limit resets each billing cycle
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">
            vibecheck<span className="text-accent-cyan">.dev</span>
          </h1>
          <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
            AI Security Audits
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">
            Connect your project
          </h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Paste your repository URL or live site to scan for vulnerabilities in AI-generated code.
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="url"
            placeholder="https://github.com/you/repo or https://yoursite.com"
            value={scanUrl}
            onChange={(e) => setScanUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStartScan()}
            className="w-full px-4 py-3 bg-surface-1 border border-border rounded-lg text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
          />
          <button
            onClick={handleStartScan}
            disabled={!scanUrl.trim() || subscription.loading}
            className="w-full px-6 py-3 bg-accent-cyan text-background font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SCAN
          </button>
        </div>

        {/* Plan status */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-surface-1 border border-border-subtle rounded-lg">
          {subscription.isPro ? (
            <>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-accent-cyan" />
                <span className="text-xs font-bold tracking-widest uppercase text-accent-cyan">
                  {subscription.plan} Plan
                </span>
              </div>
              <span className="text-[10px] text-text-dim uppercase tracking-widest">Unlimited scans</span>
            </>
          ) : (
            <>
              <span className="text-xs text-text-muted">
                <span className="font-bold text-foreground">{subscription.scansRemaining}</span> of{" "}
                {FREE_SCAN_LIMIT} free scans remaining
              </span>
              <Link
                href="/#pricing"
                className="text-[10px] font-bold tracking-widest uppercase text-accent-cyan hover:text-accent-cyan/80 transition-colors"
              >
                Upgrade
              </Link>
            </>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
            Supported Platforms
          </p>
          <div className="grid grid-cols-3 gap-2">
            {["GitHub", "Lovable", "Replit", "Bolt", "Cursor", "v0"].map((platform) => (
              <div
                key={platform}
                className="px-3 py-2 bg-surface-1 border border-border-subtle rounded text-center text-xs font-mono text-text-muted"
              >
                {platform}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderScreen = () => {
    if (activeTab === "scan" && currentScreen === "home") return renderScanHome();

    if (currentScreen === "scanning") {
      return (
        <ScanProgress
          targetUrl={scanUrl}
          onComplete={handleScanComplete}
        />
      );
    }

    if (currentScreen === "report" && currentScan) {
      return (
        <ReportDashboard
          scan={currentScan}
          onViewFindings={() => setCurrentScreen("findings")}
        />
      );
    }

    if (currentScreen === "findings" && currentScan) {
      return (
        <div className="space-y-4">
          <button
            onClick={() => setCurrentScreen("report")}
            className="text-sm text-accent-cyan hover:text-accent-cyan/80 transition-colors"
          >
            ← Back to Report
          </button>
          <FindingsList findings={currentScan.findings} />
        </div>
      );
    }

    if (activeTab === "reports") {
      return (
        <div className="text-center py-16 space-y-2">
          <p className="text-sm text-text-muted">No scans yet</p>
          <p className="text-[10px] text-text-dim uppercase tracking-widest">Start your first audit</p>
        </div>
      );
    }

    if (activeTab === "settings") return <Settings />;

    return null;
  };

  return (
    <>
      <SEO
        title="vibecheck.dev - AI Security Audits"
        description="Mobile companion for AI-powered security audits. Scan your Cursor, Lovable, or v0 projects for vulnerabilities."
      />

      <div className="min-h-screen bg-background pb-16">
        <main className="container py-8">{renderScreen()}</main>
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </>
  );
}
