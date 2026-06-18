import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser, createAdminClient } from "@/lib/supabase-server";

const VALID_PLATFORMS = ["github", "lovable", "replit", "bolt", "cursor", "v0", "other"] as const;
type Platform = (typeof VALID_PLATFORMS)[number];

interface CreateProjectBody {
  name?: unknown;
  repositoryUrl?: unknown;
  platform?: unknown;
  description?: unknown;
}

function validate(body: CreateProjectBody): string | null {
  const { name, repositoryUrl, platform } = body;

  if (typeof name !== "string" || name.trim().length === 0) {
    return "name is required";
  }
  if (name.trim().length > 120) {
    return "name must be 120 characters or fewer";
  }

  if (typeof repositoryUrl !== "string" || repositoryUrl.trim().length === 0) {
    return "repositoryUrl is required";
  }
  if (repositoryUrl.trim().length > 2048) {
    return "repositoryUrl is too long";
  }
  if (!/^https?:\/\/.+\..+/.test(repositoryUrl.trim())) {
    return "repositoryUrl must be a valid http(s) URL";
  }

  if (platform !== undefined && !VALID_PLATFORMS.includes(platform as Platform)) {
    return `platform must be one of: ${VALID_PLATFORMS.join(", ")}`;
  }

  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = req.body as CreateProjectBody;
  const validationError = validate(body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const db = createAdminClient();

  // Guard: max 50 projects per user
  const { count } = await db
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= 50) {
    return res.status(422).json({ error: "Project limit reached (max 50)" });
  }

  const { data: project, error } = await db
    .from("projects")
    .insert({
      user_id: user.id,
      name: (body.name as string).trim(),
      repository_url: (body.repositoryUrl as string).trim(),
      platform: (body.platform as Platform | undefined) ?? null,
      description:
        typeof body.description === "string" && body.description.trim().length > 0
          ? body.description.trim().slice(0, 500)
          : null,
    })
    .select("id, name, repository_url, platform, description, created_at, updated_at")
    .single();

  if (error) {
    console.error("Failed to create project:", error);
    return res.status(500).json({ error: "Failed to create project" });
  }

  return res.status(201).json({ project });
}
