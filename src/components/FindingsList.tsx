import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScanFinding } from "@/lib/vibecheck";

interface FindingsListProps {
  findings: ScanFinding[];
}

function FindingCard({ finding }: { finding: ScanFinding }) {
  const [copiedCode, setCopiedCode] = useState<"vulnerable" | "secure" | null>(null);

  const handleCopy = (code: string, type: "vulnerable" | "secure") => {
    navigator.clipboard.writeText(code);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isCritical = finding.severity === "critical";
  const borderColor = isCritical ? "border-destructive/50" : "border-warning/50";
  const badgeBg = isCritical ? "bg-destructive/10" : "bg-warning/10";
  const badgeText = isCritical ? "text-destructive" : "text-warning";

  return (
    <div className={cn("bg-surface-1 border-2 rounded-lg p-4 space-y-4", borderColor)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("px-2 py-1 rounded text-[9px] font-bold font-mono tracking-widest uppercase", badgeBg, badgeText)}>
            {finding.severity}
          </span>
          <span className="text-[10px] font-mono text-text-dim">{finding.id}</span>
          {finding.cwe && (
            <span className="text-[9px] font-mono text-text-dim bg-surface-2 px-1.5 py-0.5 rounded">
              {finding.cwe}
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-foreground">{finding.title}</h3>
      </div>

      <p className="text-sm text-text-muted leading-relaxed">{finding.description}</p>

      <div className="space-y-3">
        {/* Vulnerable */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-destructive uppercase">Vulnerable</span>
            <button
              onClick={() => handleCopy(finding.vulnerableCode, "vulnerable")}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-text-muted hover:text-foreground transition-colors"
            >
              {copiedCode === "vulnerable" ? <><Check className="w-3 h-3" /><span>Copied</span></> : <><Copy className="w-3 h-3" /><span>Copy</span></>}
            </button>
          </div>
          <div className="bg-surface-2 border border-destructive/20 rounded p-3 overflow-x-auto">
            <pre className="text-xs font-mono text-foreground whitespace-pre">{finding.vulnerableCode}</pre>
          </div>
        </div>

        {/* Secure */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-accent-green uppercase">Secure</span>
            <button
              onClick={() => handleCopy(finding.secureCode, "secure")}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-text-muted hover:text-foreground transition-colors"
            >
              {copiedCode === "secure" ? <><Check className="w-3 h-3" /><span>Copied</span></> : <><Copy className="w-3 h-3" /><span>Copy</span></>}
            </button>
          </div>
          <div className="bg-surface-2 border border-accent-green/20 rounded p-3 overflow-x-auto">
            <pre className="text-xs font-mono text-foreground whitespace-pre">{finding.secureCode}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FindingsList({ findings }: FindingsListProps) {
  const critical = findings.filter((f) => f.severity === "critical");
  const warnings = findings.filter((f) => f.severity === "warning");

  if (findings.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <p className="text-sm text-text-muted">No findings</p>
        <p className="text-[10px] text-text-dim uppercase tracking-widest">All checks passed</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">
          Security Findings
        </h2>
        <p className="text-xs text-text-muted">
          {critical.length} critical, {warnings.length} {warnings.length === 1 ? "warning" : "warnings"}
        </p>
      </div>

      <div className="space-y-4">
        {findings.map((finding) => (
          <FindingCard key={finding.id} finding={finding} />
        ))}
      </div>
    </div>
  );
}
