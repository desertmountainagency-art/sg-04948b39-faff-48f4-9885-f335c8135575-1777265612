import { useState } from "react";
import { AlertTriangle, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Finding {
  id: string;
  severity: "critical" | "warning";
  title: string;
  description: string;
  vulnerableCode: string;
  secureCode: string;
}

const mockFindings: Finding[] = [
  {
    id: "VC-001",
    severity: "critical",
    title: "SQL Injection in User Query",
    description:
      "User input is directly concatenated into SQL queries without sanitization, allowing attackers to execute arbitrary database commands and potentially access or modify sensitive data.",
    vulnerableCode: `const userId = req.query.id;
const query = "SELECT * FROM users WHERE id = " + userId;
db.query(query);`,
    secureCode: `const userId = req.query.id;
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);`,
  },
  {
    id: "VC-002",
    severity: "critical",
    title: "Exposed API Keys in Client Code",
    description:
      "Sensitive API keys are hardcoded in client-side JavaScript, making them publicly visible to anyone who inspects the source. Move these to environment variables on the server.",
    vulnerableCode: `const STRIPE_KEY = "sk_live_51AbCdEf...";
fetch(API_URL, { headers: { "X-API-Key": STRIPE_KEY } });`,
    secureCode: `// Server-side only (api/payment.ts)
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
// Client calls your API instead
fetch("/api/payment", { method: "POST" });`,
  },
  {
    id: "VC-003",
    severity: "warning",
    title: "Missing Rate Limiting on Login",
    description:
      "The login endpoint has no rate limiting, making it vulnerable to brute-force attacks. Add rate limiting middleware to prevent credential stuffing.",
    vulnerableCode: `app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await authenticate(email, password);
  res.json({ token: user.token });
});`,
    secureCode: `import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 attempts per window
});

app.post("/api/login", limiter, async (req, res) => {
  const { email, password } = req.body;
  const user = await authenticate(email, password);
  res.json({ token: user.token });
});`,
  },
  {
    id: "VC-004",
    severity: "warning",
    title: "XSS Risk in User Content Display",
    description:
      "User-generated content is rendered without sanitization, allowing script injection. Use DOMPurify or built-in framework escaping to prevent XSS attacks.",
    vulnerableCode: `<div dangerouslySetInnerHTML={{ __html: userComment }} />`,
    secureCode: `import DOMPurify from "dompurify";

const sanitized = DOMPurify.sanitize(userComment);
<div dangerouslySetInnerHTML={{ __html: sanitized }} />`,
  },
  {
    id: "VC-005",
    severity: "warning",
    title: "Weak Password Requirements",
    description:
      "Password validation only checks length, not complexity. Require a mix of uppercase, lowercase, numbers, and special characters to improve security.",
    vulnerableCode: `if (password.length < 8) {
  throw new Error("Password too short");
}`,
    secureCode: `const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/;

if (!strongPasswordRegex.test(password)) {
  throw new Error("Password must contain uppercase, lowercase, number, and special character");
}`,
  },
];

interface FindingCardProps {
  finding: Finding;
}

function FindingCard({ finding }: FindingCardProps) {
  const [copiedCode, setCopiedCode] = useState<"vulnerable" | "secure" | null>(null);

  const handleCopy = (code: string, type: "vulnerable" | "secure") => {
    navigator.clipboard.writeText(code);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const borderColor = finding.severity === "critical" ? "border-destructive/50" : "border-warning/50";
  const badgeBg = finding.severity === "critical" ? "bg-destructive/10" : "bg-warning/10";
  const badgeText = finding.severity === "critical" ? "text-destructive" : "text-warning";

  return (
    <div className={cn("bg-surface-1 border-2 rounded-lg p-4 space-y-4", borderColor)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={cn("px-2 py-1 rounded text-[9px] font-bold font-mono tracking-widest uppercase", badgeBg, badgeText)}>
            {finding.severity}
          </span>
          <span className="text-[10px] font-mono text-text-dim">{finding.id}</span>
        </div>
        <h3 className="text-sm font-semibold text-foreground">{finding.title}</h3>
      </div>

      {/* Description */}
      <p className="text-sm text-text-muted leading-relaxed">{finding.description}</p>

      {/* Code Patches */}
      <div className="space-y-3">
        {/* Vulnerable Code */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-destructive uppercase">
              ❌ Vulnerable
            </span>
            <button
              onClick={() => handleCopy(finding.vulnerableCode, "vulnerable")}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-text-muted hover:text-foreground transition-colors"
            >
              {copiedCode === "vulnerable" ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-surface-2 border border-destructive/20 rounded p-3 overflow-x-auto">
            <pre className="text-xs font-mono text-foreground whitespace-pre">
              {finding.vulnerableCode}
            </pre>
          </div>
        </div>

        {/* Secure Code */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-accent-green uppercase">
              ✓ Secure
            </span>
            <button
              onClick={() => handleCopy(finding.secureCode, "secure")}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-text-muted hover:text-foreground transition-colors"
            >
              {copiedCode === "secure" ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-surface-2 border border-accent-green/20 rounded p-3 overflow-x-auto">
            <pre className="text-xs font-mono text-foreground whitespace-pre">
              {finding.secureCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FindingsList() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">
          Security Findings
        </h2>
        <p className="text-xs text-text-muted">
          {mockFindings.filter(f => f.severity === "critical").length} critical,{" "}
          {mockFindings.filter(f => f.severity === "warning").length} warnings
        </p>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {mockFindings.map((finding) => (
          <FindingCard key={finding.id} finding={finding} />
        ))}
      </div>
    </div>
  );
}