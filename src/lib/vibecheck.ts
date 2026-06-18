/**
 * vibecheck scan engine
 *
 * startScan()     — creates a scan record in Supabase and kicks off the analysis pipeline
 * getScanStatus() — fetches current status + findings for a scan
 *
 * The "analysis pipeline" runs server-side inside /api/scans/start via a background
 * setTimeout chain so the initial POST returns quickly with a scanId the client
 * can poll. In a production environment this would be replaced by a queue / edge
 * function / external AI service.
 */

export type ScanStatus = "pending" | "running" | "completed" | "failed";
export type FindingSeverity = "critical" | "warning" | "info";

export interface ScanFinding {
  id: string;
  severity: FindingSeverity;
  title: string;
  description: string;
  vulnerableCode: string;
  secureCode: string;
  cwe?: string;
}

export interface ScanRecord {
  id: string;
  user_id: string;
  target_url: string;
  status: ScanStatus;
  audit_id: string | null;
  critical_count: number;
  warning_count: number;
  passed_count: number;
  findings: ScanFinding[];
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface StartScanResponse {
  scanId: string;
  auditId: string;
}

export interface ScanStatusResponse {
  scan: ScanRecord;
}

// ─── client-side helpers ────────────────────────────────────────────────────

/**
 * POST /api/scans/start
 * Returns immediately with a scanId. Poll getScanStatus() to track progress.
 */
export async function startScan(
  targetUrl: string,
  accessToken: string
): Promise<StartScanResponse> {
  const res = await fetch("/api/scans/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ targetUrl }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<StartScanResponse>;
}

/**
 * GET /api/scans/status?scanId=<id>
 * Polls Supabase for the current scan record.
 */
export async function getScanStatus(
  scanId: string,
  accessToken: string
): Promise<ScanStatusResponse> {
  const res = await fetch(`/api/scans/status?scanId=${encodeURIComponent(scanId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<ScanStatusResponse>;
}

// ─── server-side helpers (imported in API routes only) ──────────────────────

/**
 * Generate a unique audit ID like VC-1234-X
 */
export function generateAuditId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  const suffix = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `VC-${num}-${suffix}`;
}

/**
 * Validate that a URL is scannable.
 * Returns an error string or null if valid.
 */
export function validateTargetUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return "targetUrl is required";
  }

  const trimmed = raw.trim();
  if (trimmed.length > 2048) {
    return "targetUrl is too long (max 2048 characters)";
  }

  // Allow GitHub URLs and http(s) live site URLs
  const githubPattern = /^https?:\/\/(www\.)?github\.com\/.+\/.+/i;
  const httpPattern = /^https?:\/\/.+\..+/i;
  if (!githubPattern.test(trimmed) && !httpPattern.test(trimmed)) {
    return "targetUrl must be a valid http(s) URL or GitHub repository URL";
  }

  // Reject localhost / private IPs
  const blocklist = [/localhost/i, /127\.0\.0\.1/, /0\.0\.0\.0/, /::1/, /10\.\d+\.\d+\.\d+/, /192\.168\./];
  if (blocklist.some((re) => re.test(trimmed))) {
    return "targetUrl must be a public URL";
  }

  return null;
}

/**
 * Simulate AI analysis and return findings.
 * Replace this with a real AI call in production.
 */
export function runAnalysis(targetUrl: string): {
  findings: ScanFinding[];
  passed_count: number;
} {
  const isGitHub = /github\.com/i.test(targetUrl);

  const allFindings: ScanFinding[] = [
    {
      id: "VC-001",
      severity: "critical",
      title: "SQL Injection via Unsanitized User Input",
      description:
        "User input is directly concatenated into SQL queries without parameterization, enabling attackers to read, modify, or delete arbitrary database data.",
      vulnerableCode: `const id = req.query.id;\nconst row = await db.query("SELECT * FROM users WHERE id = " + id);`,
      secureCode: `const id = req.query.id;\nconst row = await db.query("SELECT * FROM users WHERE id = ?", [id]);`,
      cwe: "CWE-89",
    },
    {
      id: "VC-002",
      severity: "critical",
      title: "Hardcoded Secret Key in Source",
      description:
        "A production API key or secret is committed directly to source code, exposing it to anyone with repository access.",
      vulnerableCode: `const STRIPE_KEY = "sk_live_51AbCdEf...";\nfetch(API_URL, { headers: { Authorization: STRIPE_KEY } });`,
      secureCode: `// Server-side only — never expose in client code\nconst STRIPE_KEY = process.env.STRIPE_SECRET_KEY;\nfetch("/api/payment", { method: "POST" });`,
      cwe: "CWE-798",
    },
    {
      id: "VC-003",
      severity: "warning",
      title: "Missing Rate Limiting on Authentication Endpoint",
      description:
        "The login route accepts unlimited requests, making it vulnerable to brute-force and credential-stuffing attacks.",
      vulnerableCode: `app.post("/api/login", async (req, res) => {\n  const user = await authenticate(req.body);\n  res.json(user);\n});`,
      secureCode: `import rateLimit from "express-rate-limit";\nconst limiter = rateLimit({ windowMs: 15*60*1000, max: 5 });\napp.post("/api/login", limiter, async (req, res) => {\n  const user = await authenticate(req.body);\n  res.json(user);\n});`,
      cwe: "CWE-307",
    },
    {
      id: "VC-004",
      severity: "warning",
      title: "Reflected XSS via Unescaped User Content",
      description:
        "User-supplied data is rendered directly into the DOM without sanitization, allowing script injection.",
      vulnerableCode: `<div dangerouslySetInnerHTML={{ __html: userComment }} />`,
      secureCode: `import DOMPurify from "dompurify";\nconst clean = DOMPurify.sanitize(userComment);\n<div dangerouslySetInnerHTML={{ __html: clean }} />`,
      cwe: "CWE-79",
    },
    ...(isGitHub
      ? [
          {
            id: "VC-005",
            severity: "warning" as FindingSeverity,
            title: "Exposed .env File in Repository History",
            description:
              "A .env file containing secrets was committed and is recoverable from git history even after deletion.",
            vulnerableCode: `# .env (accidentally committed)\nDATABASE_URL=postgres://user:pass@host/db\nSTRIPE_SECRET_KEY=sk_live_...`,
            secureCode: `# Add to .gitignore BEFORE first commit\n.env\n.env.local\n.env.*.local\n# Use: git filter-branch or BFG Repo Cleaner to purge history`,
            cwe: "CWE-312",
          },
        ]
      : []),
  ];

  const criticalCount = allFindings.filter((f) => f.severity === "critical").length;
  const warningCount = allFindings.filter((f) => f.severity === "warning").length;
  const TOTAL_CHECKS = 25;
  const passed = TOTAL_CHECKS - criticalCount - warningCount;

  return { findings: allFindings, passed_count: Math.max(0, passed) };
}
