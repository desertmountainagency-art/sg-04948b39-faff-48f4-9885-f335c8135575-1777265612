import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser, createAdminClient } from "@/lib/supabase-server";
import { validateTargetUrl, generateAuditId, runAnalysis } from "@/lib/vibecheck";
import { sendScanCompleted, sendCriticalVuln } from "@/lib/email";

// Maximum time the background analysis is allowed to run (ms).
const ANALYSIS_TIMEOUT_MS = 55_000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth
  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Validate input
  const { targetUrl } = req.body as { targetUrl?: unknown };
  const urlError = validateTargetUrl(targetUrl);
  if (urlError) {
    return res.status(400).json({ error: urlError });
  }
  const url = (targetUrl as string).trim();

  const db = createAdminClient();

  // Check scan rate: no more than 5 concurrent running/pending scans
  const { count } = await db
    .from("scans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["pending", "running"]);

  if ((count ?? 0) >= 5) {
    return res.status(429).json({ error: "Too many concurrent scans. Wait for current scans to finish." });
  }

  // Create scan record
  const auditId = generateAuditId();
  const { data: scan, error: insertError } = await db
    .from("scans")
    .insert({
      user_id: user.id,
      target_url: url,
      audit_id: auditId,
      status: "pending",
      critical_count: 0,
      warning_count: 0,
      passed_count: 0,
      findings: [],
    })
    .select("id")
    .single();

  if (insertError || !scan) {
    console.error("Failed to create scan record:", insertError);
    return res.status(500).json({ error: "Failed to initialize scan" });
  }

  const scanId = scan.id;

  // Return immediately — client polls /api/scans/status
  res.status(202).json({ scanId, auditId });

  // Background analysis (fire-and-forget after response is sent)
  const analysisTimeout = setTimeout(async () => {
    await db
      .from("scans")
      .update({
        status: "failed",
        error_message: "Analysis timed out",
        completed_at: new Date().toISOString(),
      })
      .eq("id", scanId);
  }, ANALYSIS_TIMEOUT_MS);

  // Mark as running
  await db
    .from("scans")
    .update({ status: "running" })
    .eq("id", scanId);

  try {
    // Simulate analysis latency (5–11 s) then write results
    await sleep(5000 + Math.random() * 6000);

    const { findings, passed_count } = runAnalysis(url);
    const critical_count = findings.filter((f) => f.severity === "critical").length;
    const warning_count = findings.filter((f) => f.severity === "warning").length;

    await db
      .from("scans")
      .update({
        status: "completed",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findings: findings as any,
        critical_count,
        warning_count,
        passed_count,
        completed_at: new Date().toISOString(),
      })
      .eq("id", scanId);

    // Transactional emails — fire-and-forget, never block scan completion
    const userEmail = user.email;
    if (userEmail) {
      const auditId = (await db.from("scans").select("audit_id").eq("id", scanId).single()).data?.audit_id ?? scanId;

      sendScanCompleted({
        userEmail,
        targetUrl: url,
        auditId,
        criticalCount: critical_count,
        warningCount: warning_count,
        passedCount: passed_count,
        projectId: null,
        scanId,
      }).catch((e) => console.error("[email] sendScanCompleted failed:", e));

      if (critical_count > 0) {
        const topFindings = (findings as { title: string; severity: string; cwe?: string }[])
          .filter((f) => f.severity === "critical")
          .slice(0, 3)
          .map((f) => ({ title: f.title, cwe: f.cwe }));

        sendCriticalVuln({
          userEmail,
          targetUrl: url,
          auditId,
          criticalCount: critical_count,
          topFindings,
          projectId: null,
          scanId,
        }).catch((e) => console.error("[email] sendCriticalVuln failed:", e));
      }
    }
  } catch (err) {
    console.error(`Scan ${scanId} analysis failed:`, err);
    await db
      .from("scans")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Analysis failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", scanId);
  } finally {
    clearTimeout(analysisTimeout);
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
