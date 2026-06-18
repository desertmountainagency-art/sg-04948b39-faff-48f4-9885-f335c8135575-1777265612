import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/database.types";
import type { NextApiRequest } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Service-role client — bypasses RLS. Only for billing webhooks. */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return createClient<Database>(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * User-scoped client authenticated with the caller's JWT.
 * Satisfies auth.uid() = user_id RLS policies — no service role key needed.
 */
export function createUserClient(token: string) {
  return createClient<Database>(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Extract the raw Bearer token from an API request. */
export function getTokenFromRequest(req: NextApiRequest): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.substring(7);
}

export async function getAuthUser(req: NextApiRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const supabase = createClient<Database>(SUPABASE_URL, ANON_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}
