import { Shield, AlertTriangle, CheckCircle2, User } from "lucide-react";

interface ReportDashboardProps {
  auditId: string;
  onViewFindings: () => void;
}

export function ReportDashboard({ auditId, onViewFindings }: ReportDashboardProps) {
  const metrics = {
    critical: 2,
    warnings: 5,
    passed: 18,
  };

  const hasCriticalIssues = metrics.critical > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
          Audit Report
        </p>
        <p className="text-lg font-mono font-bold text-foreground tracking-wider">{auditId}</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-1 border-2 border-destructive/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-[9px] font-bold tracking-widest text-text-muted uppercase">
              Critical
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-destructive">{metrics.critical}</p>
        </div>

        <div className="bg-surface-1 border-2 border-warning/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-[9px] font-bold tracking-widest text-text-muted uppercase">
              Warnings
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-warning">{metrics.warnings}</p>
        </div>

        <div className="bg-surface-1 border-2 border-border-subtle rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent-green" />
            <span className="text-[9px] font-bold tracking-widest text-text-muted uppercase">
              Passed
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{metrics.passed}</p>
        </div>
      </div>

      {/* Vibe Badge */}
      <div
        className={`relative overflow-hidden rounded-lg p-6 border-2 ${
          hasCriticalIssues
            ? "bg-surface-1 border-border"
            : "bg-gradient-to-br from-accent-cyan/5 to-accent-green/5 border-accent-cyan/50"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              hasCriticalIssues
                ? "bg-surface-2 border-2 border-border-subtle"
                : "bg-accent-cyan/10 border-2 border-accent-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)]"
            }`}
          >
            <Shield
              className={`w-8 h-8 ${hasCriticalIssues ? "text-text-dim" : "text-accent-cyan"}`}
              strokeWidth={2}
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase mb-1">
              Security Badge
            </p>
            <p
              className={`text-sm font-bold ${
                hasCriticalIssues ? "text-foreground" : "text-accent-cyan"
              }`}
            >
              {hasCriticalIssues ? "Action Required" : "Vibe Checked ✓"}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {hasCriticalIssues
                ? "Critical vulnerabilities detected"
                : "All critical checks passed"}
            </p>
          </div>
        </div>
      </div>

      {/* Expert Review */}
      <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
          <div className="w-8 h-8 rounded-full bg-accent-cyan/10 flex items-center justify-center">
            <User className="w-4 h-4 text-accent-cyan" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Sarah Chen</p>
            <p className="text-[9px] font-mono text-text-muted uppercase tracking-wider">
              Security Engineer
            </p>
          </div>
        </div>
        <blockquote className="text-sm text-text-muted italic leading-relaxed">
          "Found SQL injection vulnerabilities in your API routes. The user input isn't being
          sanitized before database queries. I've flagged the exact lines — fix these before
          deploying to production."
        </blockquote>
      </div>

      {/* Action Button */}
      <button
        onClick={onViewFindings}
        className="w-full px-6 py-3 bg-accent-cyan text-background font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 active:scale-[0.98] transition-all"
      >
        View All Findings
      </button>
    </div>
  );
}