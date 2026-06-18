import { Shield, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { ScanRecord } from "@/lib/vibecheck";

interface ReportDashboardProps {
  scan: ScanRecord;
  onViewFindings: () => void;
}

export function ReportDashboard({ scan, onViewFindings }: ReportDashboardProps) {
  const { critical_count, warning_count, passed_count, audit_id, target_url, completed_at } = scan;
  const hasCritical = critical_count > 0;

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
          Audit Report
        </p>
        <p className="text-lg font-mono font-bold text-foreground tracking-wider">
          {audit_id ?? "—"}
        </p>
        <p className="text-xs text-text-dim font-mono truncate">{target_url}</p>
        {completed_at && (
          <p className="text-[10px] text-text-dim flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(completed_at)}
          </p>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-1 border-2 border-destructive/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-[9px] font-bold tracking-widest text-text-muted uppercase">
              Critical
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-destructive">{critical_count}</p>
        </div>

        <div className="bg-surface-1 border-2 border-warning/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            <span className="text-[9px] font-bold tracking-widest text-text-muted uppercase">
              Warnings
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-warning">{warning_count}</p>
        </div>

        <div className="bg-surface-1 border-2 border-border-subtle rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
            <span className="text-[9px] font-bold tracking-widest text-text-muted uppercase">
              Passed
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{passed_count}</p>
        </div>
      </div>

      {/* Security Badge */}
      <div
        className={`relative overflow-hidden rounded-lg p-6 border-2 ${
          hasCritical
            ? "bg-surface-1 border-border"
            : "bg-gradient-to-br from-accent-cyan/5 to-accent-green/5 border-accent-cyan/50"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              hasCritical
                ? "bg-surface-2 border-2 border-border-subtle"
                : "bg-accent-cyan/10 border-2 border-accent-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)]"
            }`}
          >
            <Shield
              className={`w-8 h-8 ${hasCritical ? "text-text-dim" : "text-accent-cyan"}`}
              strokeWidth={2}
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase mb-1">
              Security Badge
            </p>
            <p className={`text-sm font-bold ${hasCritical ? "text-foreground" : "text-accent-cyan"}`}>
              {hasCritical ? "Action Required" : "Vibe Checked ✓"}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {hasCritical
                ? `${critical_count} critical ${critical_count === 1 ? "vulnerability" : "vulnerabilities"} detected`
                : "All critical checks passed"}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      {(critical_count > 0 || warning_count > 0) && (
        <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-2">
          <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
            AI Analysis Summary
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            {hasCritical
              ? `Found ${critical_count} critical ${critical_count === 1 ? "issue" : "issues"} and ${warning_count} ${warning_count === 1 ? "warning" : "warnings"} that require attention before deploying to production.`
              : `Found ${warning_count} ${warning_count === 1 ? "warning" : "warnings"} — no critical vulnerabilities detected. Review the findings to further harden your application.`}
          </p>
        </div>
      )}

      {/* View Findings */}
      <button
        onClick={onViewFindings}
        disabled={scan.findings.length === 0}
        className="w-full px-6 py-3 bg-accent-cyan text-background font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        View All Findings ({scan.findings.length})
      </button>
    </div>
  );
}
