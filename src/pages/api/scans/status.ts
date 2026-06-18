import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser, getTokenFromRequest, createUserClient } from "@/lib/supabase-server";
import type { ScanRecord } from "@/lib/vibecheck";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = getTokenFromRequest(req);
  const user = await getAuthUser(req);
  if (!user || !token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { scanId } = req.query;
  if (!scanId || typeof scanId !== "string" || scanId.trim().length === 0) {
    return res.status(400).json({ error: "Missing or invalid scanId" });
  }

  const db = createUserClient(token);
  const { data, error } = await db
    .from("scans")
    .select(
      "id, user_id, target_url, status, audit_id, critical_count, warning_count, passed_count, findings, error_message, created_at, completed_at"
    )
    .eq("id", scanId.trim())
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Scan status query error:", error);
    return res.status(500).json({ error: "Failed to fetch scan status" });
  }

  if (!data) {
    return res.status(404).json({ error: "Scan not found" });
  }

  const isTerminal = data.status === "completed" || data.status === "failed";
  res.setHeader("Cache-Control", isTerminal ? "public, max-age=60" : "no-store");

  return res.status(200).json({ scan: data as unknown as ScanRecord });
}
