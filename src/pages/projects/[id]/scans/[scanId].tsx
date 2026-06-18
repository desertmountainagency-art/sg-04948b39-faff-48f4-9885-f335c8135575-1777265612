import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Shield, AlertTriangle, CheckCircle2, Copy, Check, ChevronDown, ChevronUp,
  Clock, ExternalLink
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getScanStatus } from "@/lib/vibecheck";
import { toast } from "@/hooks/use-toast";
import { ScanDetailSkeleton, ErrorBanner } from "@/components/Skeletons";
import { cn } from "@/lib/utils";
import type { ScanRecord, ScanFinding, FindingSeverity } from "@/lib/vibecheck";

export default function ScanDetail() {
  const router = useRouter();
  const { id, scanId } = router.query as { id?: string; scanId?: string };
  const { session, loading: authLoading } = useAuth();

  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<FindingSeverity | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !scanId || !session?.access_token) return;
    fetchScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId, session, authLoading]);

  useEffect(() => {
    if (authLoading || !id || !session?.access_token) return;
    fetchProjectName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, session, authLoading]);

  async function fetchScan() {
    if (!scanId || !session?.access_token) return;
    setLoading(true);
    setFetchError(null);
    try {
      const { scan: s } = await getScanStatus(scanId, session.access_token);
      setScan(s);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load scan report";
      setFetchError(message);
      toast({ title: "Failed to load scan", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchProjectName() {
    if (!id || !session?.access_token) return;
    const res = await fetch(`/api/projects/${id}/get`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const { project } = await res.json();
      setProjectName(project?.name ?? null);
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-US", {
      month: "long", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const filteredFindings = scan?.findings.filter(
    (f) => filterSeverity === "all" || f.severity === filterSeverity
  ) ?? [];

  const criticalCount = scan?.findings.filter((f) => f.severity === "critical").length ?? 0;
  const warningCount = scan?.findings.filter((f) => f.severity === "warning").length ?? 0;
  const hasCritical = criticalCount > 0;

  if (authLoading || loading) {
    return (
      <DashboardLayout
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: projectName ?? "Project", href: `/projects/${id}` },
          { label: "Scan" },
        ]}
      >
        <ScanDetailSkeleton />
      </DashboardLayout>
    );
  }

  if (fetchError && !scan) {
    return (
      <DashboardLayout
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: projectName ?? "Project", href: `/projects/${id}` },
          { label: "Error" },
        ]}
      >
        <ErrorBanner message={fetchError} onRetry={fetchScan} />
      </DashboardLayout>
    );
  }

  if (!scan) return null;

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Projects", href: "/projects" },
        { label: projectName ?? "Project", href: `/projects/${id}` },
        { label: scan.audit_id ?? "Scan" },
      ]}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-text-muted mb-1">Audit Report</p>
              <h1 className="text-2xl font-mono font-bold text-foreground tracking-wider">
                {scan.audit_id ?? scanId}
              </h1>
            </div>
            <Link
              href={scan.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-cyan transition-colors font-mono"
            >
              {scan.target_url}
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex items-center gap-4 text-xs text-text-dim flex-wrap">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Started {formatDate(scan.created_at)}
            </span>
            {scan.completed_at && (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-accent-green" />
                Completed {formatDate(scan.completed_at)}
              </span>
            )}
          </div>
        </div>

        {/* Severity summary */}
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard
            label="Critical"
            count={scan.critical_count}
            icon={AlertTriangle}
            color="text-destructive"
            border="border-destructive/30"
            bg={hasCritical ? "bg-destructive/5" : ""}
            onClick={() => setFilterSeverity(filterSeverity === "critical" ? "all" : "critical")}
            active={filterSeverity === "critical"}
          />
          <SummaryCard
            label="Warnings"
            count={scan.warning_count}
            icon={AlertTriangle}
            color="text-warning"
            border="border-warning/30"
            onClick={() => setFilterSeverity(filterSeverity === "warning" ? "all" : "warning")}
            active={filterSeverity === "warning"}
          />
          <SummaryCard
            label="Passed"
            count={scan.passed_count}
            icon={CheckCircle2}
            color="text-accent-green"
            border="border-border-subtle"
            onClick={() => setFilterSeverity("all")}
            active={false}
          />
        </div>

        {/* Security badge */}
        <div className={cn(
          "rounded-xl p-5 border-2 flex items-center gap-4",
          hasCritical
            ? "bg-surface-1 border-border"
            : "bg-gradient-to-br from-accent-cyan/5 to-accent-green/5 border-accent-cyan/50"
        )}>
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0",
            hasCritical
              ? "bg-surface-2 border-2 border-border-subtle"
              : "bg-accent-cyan/10 border-2 border-accent-cyan shadow-[0_0_20px_rgba(0,240,255,0.2)]"
          )}>
            <Shield className={cn("w-7 h-7", hasCritical ? "text-text-dim" : "text-accent-cyan")} />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-text-muted mb-1">Security Status</p>
            <p className={cn("text-base font-bold", hasCritical ? "text-foreground" : "text-accent-cyan")}>
              {hasCritical ? "Action Required" : "Vibe Checked ✓"}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {hasCritical
                ? `${criticalCount} critical ${criticalCount === 1 ? "vulnerability" : "vulnerabilities"} require immediate attention`
                : "No critical vulnerabilities — all major checks passed"}
            </p>
          </div>
        </div>

        {/* Findings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">
              Security Findings
              {filterSeverity !== "all" && (
                <span className="ml-2 text-accent-cyan normal-case font-normal text-xs">
                  (filtered: {filterSeverity})
                </span>
              )}
            </h2>

            {/* Filter pills */}
            <div className="flex items-center gap-2">
              {(["all", "critical", "warning"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterSeverity(s)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all border",
                    filterSeverity === s
                      ? "bg-accent-cyan text-background border-accent-cyan"
                      : "border-border text-text-muted hover:border-border-subtle hover:text-foreground"
                  )}
                >
                  {s === "all" ? `All (${scan.findings.length})` :
                    s === "critical" ? `Critical (${criticalCount})` :
                    `Warnings (${warningCount})`}
                </button>
              ))}
            </div>
          </div>

          {filteredFindings.length === 0 ? (
            <div className="bg-surface-1 border border-border rounded-xl p-10 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-accent-green mx-auto" />
              <p className="text-sm text-text-muted">
                {filterSeverity === "all" ? "No findings — all checks passed" : `No ${filterSeverity} findings`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFindings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  expanded={expandedId === finding.id}
                  onToggle={() => setExpandedId(expandedId === finding.id ? null : finding.id)}
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

function SummaryCard({
  label, count, icon: Icon, color, border, bg, onClick, active,
}: {
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  border: string;
  bg?: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-surface-1 border-2 rounded-xl p-4 text-center space-y-2 w-full transition-all",
        border,
        bg,
        active && "ring-2 ring-accent-cyan/50"
      )}
    >
      <Icon className={cn("w-4 h-4 mx-auto", color)} />
      <p className={cn("text-2xl font-bold font-mono", color)}>{count}</p>
      <p className="text-[9px] font-bold tracking-widest uppercase text-text-muted">{label}</p>
    </button>
  );
}

function FindingCard({
  finding, expanded, onToggle,
}: {
  finding: ScanFinding;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isCritical = finding.severity === "critical";

  return (
    <div className={cn(
      "bg-surface-1 border-2 rounded-xl overflow-hidden transition-all",
      isCritical ? "border-destructive/40" : "border-warning/40"
    )}>
      {/* Header — always visible, click to expand */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-surface-2/50 transition-colors"
      >
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          <span className={cn(
            "px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-widest uppercase",
            isCritical ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
          )}>
            {finding.severity}
          </span>
          <span className="text-[10px] font-mono text-text-dim">{finding.id}</span>
          {finding.cwe && (
            <span className="text-[9px] font-mono text-text-dim bg-surface-2 px-1.5 py-0.5 rounded border border-border">
              {finding.cwe}
            </span>
          )}
        </div>
        <h3 className="flex-1 text-sm font-semibold text-foreground">{finding.title}</h3>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-text-dim flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-text-dim flex-shrink-0" />}
      </button>

      {/* Body — collapsible */}
      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-border">
          {/* Description */}
          <p className="text-sm text-text-muted leading-relaxed pt-4">{finding.description}</p>

          {/* Diff viewer */}
          <DiffViewer finding={finding} />
        </div>
      )}
    </div>
  );
}

function DiffViewer({ finding }: { finding: ScanFinding }) {
  const [copied, setCopied] = useState<"vuln" | "fix" | null>(null);

  const handleCopy = (text: string, type: "vuln" | "fix") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast({ title: type === "fix" ? "Secure code copied" : "Code copied" });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold tracking-widest uppercase text-text-muted">Patch Diff</p>

      <div className="grid lg:grid-cols-2 gap-3">
        {/* Vulnerable */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-destructive">Vulnerable</span>
            </div>
            <button
              onClick={() => handleCopy(finding.vulnerableCode, "vuln")}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-text-muted hover:text-foreground transition-colors"
            >
              {copied === "vuln"
                ? <><Check className="w-3 h-3 text-accent-green" /> Copied</>
                : <><Copy className="w-3 h-3" /> Copy</>}
            </button>
          </div>
          <div className="bg-black/30 border border-destructive/20 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/5 border-b border-destructive/10">
              <span className="text-[9px] font-mono text-destructive/70 uppercase tracking-widest">before</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-foreground whitespace-pre leading-relaxed">
                {finding.vulnerableCode.split("\n").map((line, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-destructive/30 w-5 shrink-0 select-none text-right">{i + 1}</span>
                    <span className="text-destructive/80 select-none shrink-0">-</span>
                    <span>{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>

        {/* Secure */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-green" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-accent-green">Secure</span>
            </div>
            <button
              onClick={() => handleCopy(finding.secureCode, "fix")}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-text-muted hover:text-foreground transition-colors"
            >
              {copied === "fix"
                ? <><Check className="w-3 h-3 text-accent-green" /> Copied</>
                : <><Copy className="w-3 h-3" /> Copy</>}
            </button>
          </div>
          <div className="bg-black/30 border border-accent-green/20 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-green/5 border-b border-accent-green/10">
              <span className="text-[9px] font-mono text-accent-green/70 uppercase tracking-widest">after</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-foreground whitespace-pre leading-relaxed">
                {finding.secureCode.split("\n").map((line, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-accent-green/30 w-5 shrink-0 select-none text-right">{i + 1}</span>
                    <span className="text-accent-green/80 select-none shrink-0">+</span>
                    <span>{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

