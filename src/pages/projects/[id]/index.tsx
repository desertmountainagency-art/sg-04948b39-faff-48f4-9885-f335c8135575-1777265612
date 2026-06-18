import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  AlertTriangle, CheckCircle2, Clock, ExternalLink, Play, Loader2,
  Github, Globe, MoreHorizontal, XCircle
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import { getScanStatus } from "@/lib/vibecheck";
import { toast } from "@/hooks/use-toast";
import { ProjectDetailSkeleton, ErrorBanner } from "@/components/Skeletons";
import { cn } from "@/lib/utils";
import type { ScanRecord } from "@/lib/vibecheck";

interface Project {
  id: string;
  name: string;
  repository_url: string;
  platform: string | null;
  description: string | null;
  created_at: string;
}

type ScanRow = Pick<ScanRecord, "id" | "audit_id" | "status" | "target_url" | "critical_count" | "warning_count" | "passed_count" | "created_at" | "completed_at">;

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const { user, session, loading: authLoading } = useAuth();
  const { scanLimitReached, incrementScanCount } = useSubscription();

  const [project, setProject] = useState<Project | null>(null);
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !id) return;
    if (!user) { router.push(`/auth?redirectTo=/projects/${id}`); return; }
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, id]);

  // Poll for in-progress scan
  useEffect(() => {
    if (!activeScanId || !session?.access_token) return;
    const iv = setInterval(async () => {
      try {
        const { scan } = await getScanStatus(activeScanId, session.access_token);
        if (scan.status === "completed") {
          setActiveScanId(null);
          setScanning(false);
          refreshScans();
          if (scan.critical_count > 0) {
            toast({
              title: `Scan complete — ${scan.critical_count} critical ${scan.critical_count === 1 ? "issue" : "issues"} found`,
              description: "Review the findings and apply suggested patches.",
              variant: "destructive",
            });
          } else {
            toast({ title: "Scan complete — all clear!", description: "No critical vulnerabilities detected." });
          }
        } else if (scan.status === "failed") {
          setActiveScanId(null);
          setScanning(false);
          refreshScans();
          toast({
            title: "Scan failed",
            description: scan.error_message ?? "The scan encountered an error. Please try again.",
            variant: "destructive",
          });
        }
      } catch { /* ignore transient */ }
    }, 2500);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScanId, session]);

  async function fetchProject() {
    if (!session?.access_token || !id) return;
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/projects/${id}/get`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        if (res.status === 404) { router.push("/projects"); return; }
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `Failed to load project (${res.status})`);
      }
      const { project: p, scans: s } = await res.json();
      setProject(p);
      setScans(s);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load project";
      setFetchError(message);
      toast({ title: "Failed to load project", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function refreshScans() {
    if (!user || !id) return;
    const { data } = await supabase
      .from("scans")
      .select("id, audit_id, status, target_url, critical_count, warning_count, passed_count, created_at, completed_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(20);
    setScans((data ?? []) as ScanRow[]);
  }

  async function handleScan() {
    if (!session?.access_token || !id || scanning || scanLimitReached) return;
    setScanning(true);
    setScanError(null);
    await incrementScanCount();

    const res = await fetch(`/api/projects/${id}/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    const json = await res.json();
    if (!res.ok) {
      const errMsg = json.error ?? "Failed to start scan";
      setScanError(errMsg);
      toast({ title: "Scan failed to start", description: errMsg, variant: "destructive" });
      setScanning(false);
      return;
    }

    toast({ title: "Scan started", description: "Analyzing your project for vulnerabilities…" });
    setActiveScanId(json.scanId);
    refreshScans();
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const statusConfig = (status: string) => {
    if (status === "completed") return { color: "text-accent-green", dot: "bg-accent-green", label: "Completed" };
    if (status === "failed") return { color: "text-destructive", dot: "bg-destructive", label: "Failed" };
    if (status === "running") return { color: "text-accent-cyan", dot: "bg-accent-cyan animate-pulse", label: "Running" };
    return { color: "text-text-dim", dot: "bg-text-dim", label: "Pending" };
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Projects", href: "/projects" }, { label: "..." }]}>
        <ProjectDetailSkeleton />
      </DashboardLayout>
    );
  }

  if (fetchError && !project) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Projects", href: "/projects" }, { label: "Error" }]}>
        <ErrorBanner message={fetchError} onRetry={fetchProject} />
      </DashboardLayout>
    );
  }

  if (!project) return null;

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Projects", href: "/projects" },
        { label: project.name },
      ]}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-1 border border-border flex items-center justify-center">
                {project.platform === "github"
                  ? <Github className="w-5 h-5 text-text-muted" />
                  : <Globe className="w-5 h-5 text-text-muted" />}
              </div>
              <div>
                <h1 className="text-xl font-semibold">{project.name}</h1>
                {project.platform && (
                  <span className="text-[9px] font-bold tracking-widest uppercase text-text-dim bg-surface-2 px-1.5 py-0.5 rounded">
                    {project.platform}
                  </span>
                )}
              </div>
            </div>
            <a
              href={project.repository_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-cyan transition-colors font-mono"
            >
              {project.repository_url}
              <ExternalLink className="w-3 h-3" />
            </a>
            {project.description && (
              <p className="text-sm text-text-muted">{project.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {scanLimitReached ? (
              <Link
                href="/#pricing"
                className="flex items-center gap-2 px-4 py-2 border border-accent-cyan/30 text-accent-cyan text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-accent-cyan/10 transition-all"
              >
                Upgrade to Scan
              </Link>
            ) : (
              <button
                onClick={handleScan}
                disabled={scanning}
                className="flex items-center gap-2 px-4 py-2 bg-accent-cyan text-background text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all disabled:opacity-60"
              >
                {scanning
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning…</>
                  : <><Play className="w-3.5 h-3.5" /> Run Scan</>}
              </button>
            )}
          </div>
        </div>

        {scanError && (
          <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {scanError}
          </div>
        )}

        {/* Summary cards from latest completed scan */}
        {(() => {
          const latest = scans.find((s) => s.status === "completed");
          if (!latest) return null;
          return (
            <div className="space-y-3">
              <p className="text-[10px] font-bold tracking-widest uppercase text-text-muted">
                Latest Scan — {formatDate(latest.completed_at)}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-1 border-2 border-destructive/30 rounded-lg p-4 text-center space-y-1">
                  <AlertTriangle className="w-4 h-4 text-destructive mx-auto" />
                  <p className="text-2xl font-bold font-mono text-destructive">{latest.critical_count}</p>
                  <p className="text-[9px] font-bold tracking-widest uppercase text-text-muted">Critical</p>
                </div>
                <div className="bg-surface-1 border-2 border-warning/30 rounded-lg p-4 text-center space-y-1">
                  <AlertTriangle className="w-4 h-4 text-warning mx-auto" />
                  <p className="text-2xl font-bold font-mono text-warning">{latest.warning_count}</p>
                  <p className="text-[9px] font-bold tracking-widest uppercase text-text-muted">Warnings</p>
                </div>
                <div className="bg-surface-1 border-2 border-border-subtle rounded-lg p-4 text-center space-y-1">
                  <CheckCircle2 className="w-4 h-4 text-accent-green mx-auto" />
                  <p className="text-2xl font-bold font-mono text-foreground">{latest.passed_count}</p>
                  <p className="text-[9px] font-bold tracking-widest uppercase text-text-muted">Passed</p>
                </div>
              </div>
              <Link
                href={`/projects/${id}/scans/${latest.id}`}
                className="block w-full px-4 py-2.5 bg-accent-cyan text-background text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all text-center"
              >
                View Full Report →
              </Link>
            </div>
          );
        })()}

        {/* Scan history table */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">Scan History</h2>

          {scans.length === 0 ? (
            <div className="bg-surface-1 border border-border rounded-xl p-10 text-center space-y-2">
              <Clock className="w-8 h-8 text-text-dim mx-auto" />
              <p className="text-sm text-text-muted">No scans yet</p>
              <p className="text-xs text-text-dim">Run your first scan to see results here.</p>
            </div>
          ) : (
            <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-[9px] font-bold tracking-widest uppercase text-text-muted">Audit ID</th>
                    <th className="px-4 py-3 text-left text-[9px] font-bold tracking-widest uppercase text-text-muted hidden sm:table-cell">Started</th>
                    <th className="px-4 py-3 text-center text-[9px] font-bold tracking-widest uppercase text-text-muted">Critical</th>
                    <th className="px-4 py-3 text-center text-[9px] font-bold tracking-widest uppercase text-text-muted hidden sm:table-cell">Warnings</th>
                    <th className="px-4 py-3 text-left text-[9px] font-bold tracking-widest uppercase text-text-muted">Status</th>
                    <th className="px-4 py-3 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {scans.map((scan) => {
                    const sc = statusConfig(scan.status);
                    const isRunning = scan.id === activeScanId;
                    return (
                      <tr
                        key={scan.id}
                        className={cn(
                          "hover:bg-surface-2 transition-colors",
                          isRunning && "bg-accent-cyan/5"
                        )}
                      >
                        <td className="px-4 py-3 font-mono text-text-muted">{scan.audit_id ?? "—"}</td>
                        <td className="px-4 py-3 text-text-dim hidden sm:table-cell">{formatDate(scan.created_at)}</td>
                        <td className="px-4 py-3 text-center font-mono">
                          {scan.status === "completed" ? (
                            <span className={scan.critical_count > 0 ? "text-destructive font-bold" : "text-text-dim"}>
                              {scan.critical_count}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center font-mono hidden sm:table-cell">
                          {scan.status === "completed" ? (
                            <span className={scan.warning_count > 0 ? "text-warning" : "text-text-dim"}>
                              {scan.warning_count}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("flex items-center gap-1.5", sc.color)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", sc.dot)} />
                            <span className="text-[10px] font-bold tracking-widest uppercase">{sc.label}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {scan.status === "completed" && (
                            <Link
                              href={`/projects/${id}/scans/${scan.id}`}
                              className="p-1 text-text-dim hover:text-accent-cyan transition-colors inline-block"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

