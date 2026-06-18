import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  // Auth is enforced client-side via useAuth() in each protected page.
  // @supabase/supabase-js v2 stores sessions in localStorage (not cookies),
  // so cookie-based checks here would always fail and cause redirect loops.
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
