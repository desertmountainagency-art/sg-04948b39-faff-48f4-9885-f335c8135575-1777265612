import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser, createAdminClient } from "@/lib/supabase-server";
import { generateAuditId, runAnalysis, validateTargetUrl } from "@/lib/vibecheck";
import { sendScanCompleted, sendCriticalVuln } from "@/lib/email";

const ANALYSIS_TIMEOUT_MS = 55_000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    return res.status(400).json({ error: "Missing project id" });
  }

  const db = createAdminClient();

  // Verify ownership before doing anything else
  const { data: project, error: projectError } = await db
    .from("projects")
    .select("id, user_id, repository_url")
    .eq("id", id.trim())
    .maybeSingle();

  if (projectError) {
    console.error("Failed to fetch project:", projectError);
    return res.status(500).json({ error: "Failed to look up project" });
  }

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  if (project.user_id !== user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Allow caller to override the scan URL; fall back to the project's repository URL
  const rawUrl =
    (req.body as { targetUrl?: unknown })?.targetUrl ?? project.repository_url;

  const urlError = validateTargetUrl(rawUrl);
  if (urlError) {
    return res.status(400).json({ error: urlError });
  }
  const targetUrl = (rawUrl as string).trim();

  // Rate-limit: max 5 concurrent pending/running scans per user
  const { count } = await db
    .from("scans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["pending", "running"]);

  if ((count ?? 0) >= 5) {
    return res.status(429).json({
      error: "Too many concurrent scans. Wait for current scans to finish.",
    });
  }

  const auditId = generateAuditId();

  const { data: scan, error: insertError } = await db
    .from("scans")
    .insert({
      user_id: user.id,
      project_id: project.id,
      target_url: targetUrl,
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
    console.error("Failed to create scan:", insertError);
    return res.status(500).json({ error: "Failed to initialize scan" });
  }

  const scanId = scan.id;

  // Respond immediately — client polls /api/scans/status?scanId=<id>
  res.status(202).json({ scanId, auditId, projectId: project.id });

  // ─── background analysis ──────────────────────────────────────────────────
  const hardDeadline = setTimeout(async () => {
    await db
      .from("scans")
      .update({
        status: "failed",
        error_message: "Analysis timed out",
        completed_at: new Date().toISOString(),
      })
      .eq("id", scanId);
  }, ANALYSIS_TIMEOUT_MS);

  await db
    .from("scans")
    .update({ status: "running" })
    .eq("id", scanId);

  try {
    await sleep(5000 + Math.random() * 6000);

    const { findings, passed_count } = runAnalysis(targetUrl);
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

    // Transactional emails — fire-and-forget
    const userEmail = user.email;
    if (userEmail) {
      const { data: scanRow } = await db.from("scans").select("audit_id").eq("id", scanId).single();
      const auditId = scanRow?.audit_id ?? scanId;

      sendScanCompleted({
        userEmail,
        targetUrl,
        auditId,
        criticalCount: critical_count,
        warningCount: warning_count,
        passedCount: passed_count,
        projectId: project.id,
        scanId,
      }).catch((e) => console.error("[email] sendScanCompleted failed:", e));

      if (critical_count > 0) {
        const topFindings = (findings as { title: string; severity: string; cwe?: string }[])
          .filter((f) => f.severity === "critical")
          .slice(0, 3)
          .map((f) => ({ title: f.title, cwe: f.cwe }));

        sendCriticalVuln({
          userEmail,
          targetUrl,
          auditId,
          criticalCount: critical_count,
          topFindings,
          projectId: project.id,
          scanId,
        }).catch((e) => console.error("[email] sendCriticalVuln failed:", e));
      }
    }
  } catch (err) {
    console.error(`Project scan ${scanId} failed:`, err);
    await db
      .from("scans")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Analysis failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", scanId);
  } finally {
    clearTimeout(hardDeadline);
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
