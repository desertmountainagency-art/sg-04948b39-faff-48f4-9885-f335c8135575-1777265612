import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser, getTokenFromRequest, createUserClient } from "@/lib/supabase-server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = getTokenFromRequest(req);
  const user = await getAuthUser(req);
  if (!user || !token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    return res.status(400).json({ error: "Missing project id" });
  }

  const db = createUserClient(token);

  const { data: project, error } = await db
    .from("projects")
    .select("id, user_id, name, repository_url, platform, description, created_at, updated_at")
    .eq("id", id.trim())
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch project:", error);
    return res.status(500).json({ error: "Failed to fetch project" });
  }

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const { data: scans } = await db
    .from("scans")
    .select(
      "id, audit_id, status, target_url, critical_count, warning_count, passed_count, created_at, completed_at"
    )
    .eq("project_id", id.trim())
    .order("created_at", { ascending: false })
    .limit(10);

  return res.status(200).json({ project, scans: scans ?? [] });
}
