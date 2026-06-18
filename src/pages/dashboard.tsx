import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Shield, AlertTriangle, CheckCircle2, FolderOpen, Zap, ArrowRight,
  TrendingUp, Clock, ExternalLink
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, FREE_SCAN_LIMIT } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { ScanRecord } from "@/lib/vibecheck";

interface DashboardStats {
  totalProjects: number;
  totalScans: number;
  criticalOpen: number;
  lastScanDate: string | null;
}

type RecentScan = Pick<ScanRecord, "id" | "audit_id" | "status" | "target_url" | "critical_count" | "warning_count" | "passed_count" | "created_at" | "completed_at"> & { project_id?: string | null };

export default function Dashboard() {
  const { user, session, loading: authLoading } = useAuth();
  const { plan, isPro, scansRemaining } = useSubscription();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Show checkout success toast
  const checkoutSuccess = router.query.checkout === "success";

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth?redirectTo=/dashboard"); return; }
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function fetchDashboard() {
    if (!user) return;
    setLoadingData(true);

    const [projectsRes, scansRes, recentRes] = await Promise.all([
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("scans").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase
        .from("scans")
        .select("id, audit_id, status, target_url, critical_count, warning_count, passed_count, created_at, completed_at, project_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    // Count open criticals (scans completed with critical_count > 0)
    const { count: criticalOpen } = await supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gt("critical_count", 0);

    setStats({
      totalProjects: projectsRes.count ?? 0,
      totalScans: scansRes.count ?? 0,
      criticalOpen: criticalOpen ?? 0,
      lastScanDate: recentRes.data?.[0]?.created_at ?? null,
    });
    setRecentScans((recentRes.data ?? []) as RecentScan[]);
    setLoadingData(false);
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3_600_000);
    if (diffH < 1) return "Just now";
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const statusColor = (status: string) => {
    if (status === "completed") return "text-accent-green";
    if (status === "failed") return "text-destructive";
    if (status === "running") return "text-accent-cyan";
    return "text-text-dim";
  };

  const statusDot = (status: string) => {
    if (status === "completed") return "bg-accent-green";
    if (status === "failed") return "bg-destructive";
    if (status === "running") return "bg-accent-cyan animate-pulse";
    return "bg-text-dim";
  };

  if (authLoading || loadingData) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Dashboard" }]}>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard" }]}>
      {checkoutSuccess && (
        <div className="mb-6 px-4 py-3 bg-accent-green/10 border border-accent-green/30 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0" />
          <p className="text-sm text-accent-green font-medium">
            Upgrade successful — welcome to {plan}!
          </p>
        </div>
      )}

      <div className="space-y-8">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-text-muted mt-1">
              {user?.email}
            </p>
          </div>
          <Link
            href="/projects"
            className="flex items-center gap-2 px-4 py-2 bg-accent-cyan text-background text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Projects
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Projects"
            value={stats?.totalProjects ?? 0}
            icon={FolderOpen}
            iconColor="text-accent-cyan"
            href="/projects"
          />
          <StatCard
            label="Total Scans"
            value={stats?.totalScans ?? 0}
            icon={TrendingUp}
            iconColor="text-accent-green"
          />
          <StatCard
            label="Critical Issues"
            value={stats?.criticalOpen ?? 0}
            icon={AlertTriangle}
            iconColor="text-destructive"
            highlight={!!stats?.criticalOpen}
          />
          <StatCard
            label="Last Scan"
            value={stats?.lastScanDate ? formatDate(stats.lastScanDate) : "None"}
            icon={Clock}
            iconColor="text-text-muted"
            textValue
          />
        </div>

        {/* Plan status */}
        {!isPro && (
          <div className="bg-surface-1 border border-border rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-text-muted mb-1">Free Plan</p>
              <p className="text-sm text-foreground">
                <span className="font-bold">{scansRemaining}</span> of {FREE_SCAN_LIMIT} scans remaining this month
              </p>
            </div>
            <Link
              href="/#pricing"
              className="flex items-center gap-2 px-4 py-2 bg-accent-cyan text-background text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all shrink-0"
            >
              <Zap className="w-3.5 h-3.5" />
              Upgrade to Pro
            </Link>
          </div>
        )}

        {/* Recent scans */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">Recent Scans</h2>
            <Link
              href="/projects"
              className="text-xs text-accent-cyan hover:text-accent-cyan/80 transition-colors"
            >
              View all →
            </Link>
          </div>

          {recentScans.length === 0 ? (
            <EmptyScans />
          ) : (
            <div className="space-y-2">
              {recentScans.map((scan) => (
                <ScanRow
                  key={scan.id}
                  scan={scan}
                  formatDate={formatDate}
                  statusColor={statusColor}
                  statusDot={statusDot}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, iconColor, href, highlight, textValue,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  href?: string;
  highlight?: boolean;
  textValue?: boolean;
}) {
  const inner = (
    <div className={cn(
      "bg-surface-1 border rounded-xl p-4 space-y-3 transition-colors",
      highlight ? "border-destructive/40 bg-destructive/5" : "border-border hover:border-border-subtle",
      href && "cursor-pointer"
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold tracking-widest uppercase text-text-muted">{label}</span>
        <Icon className={cn("w-3.5 h-3.5", iconColor)} />
      </div>
      <p className={cn(
        "font-bold font-mono",
        textValue ? "text-lg" : "text-2xl",
        highlight ? "text-destructive" : "text-foreground"
      )}>
        {value}
      </p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function ScanRow({
  scan,
  formatDate,
  statusColor,
  statusDot,
}: {
  scan: RecentScan;
  formatDate: (d: string | null) => string;
  statusColor: (s: string) => string;
  statusDot: (s: string) => string;
}) {
  const href = scan.project_id
    ? `/projects/${scan.project_id}/scans/${scan.id}`
    : null;

  const inner = (
    <div className="bg-surface-1 border border-border rounded-lg px-4 py-3 flex items-center gap-4 hover:border-border-subtle transition-colors group">
      {/* Status dot */}
      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", statusDot(scan.status))} />

      {/* URL */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-foreground truncate">{scan.target_url}</p>
        <p className="text-[10px] text-text-dim font-mono mt-0.5">
          {scan.audit_id} · {formatDate(scan.created_at)}
        </p>
      </div>

      {/* Severity counts */}
      {scan.status === "completed" && (
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {scan.critical_count > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-destructive">
              <AlertTriangle className="w-3 h-3" />
              {scan.critical_count}
            </span>
          )}
          {scan.warning_count > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-warning">
              <AlertTriangle className="w-3 h-3" />
              {scan.warning_count}
            </span>
          )}
          {scan.critical_count === 0 && scan.warning_count === 0 && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-accent-green">
              <CheckCircle2 className="w-3 h-3" />
              Clean
            </span>
          )}
        </div>
      )}

      <span className={cn("text-[10px] font-bold tracking-widest uppercase shrink-0", statusColor(scan.status))}>
        {scan.status}
      </span>

      {href && <ExternalLink className="w-3.5 h-3.5 text-text-dim group-hover:text-accent-cyan transition-colors shrink-0" />}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

function EmptyScans() {
  return (
    <div className="bg-surface-1 border border-border rounded-xl p-10 text-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mx-auto">
        <Shield className="w-6 h-6 text-text-dim" />
      </div>
      <p className="text-sm text-text-muted">No scans yet</p>
      <p className="text-xs text-text-dim">Create a project to start your first security audit.</p>
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-accent-cyan text-background text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all"
      >
        Create Project
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-40 bg-surface-2 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-surface-1 border border-border rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 bg-surface-1 border border-border rounded-lg" />
        ))}
      </div>
    </div>
  );
}
