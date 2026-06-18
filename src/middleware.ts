import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/app", "/dashboard", "/projects", "/billing", "/scans"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) return NextResponse.next();

  // Supabase v2 stores auth tokens in cookies named sb-<ref>-auth-token
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.includes("-auth-token") && c.value.length > 0);

  if (!hasAuthCookie) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/app/:path*",
    "/dashboard/:path*",
    "/projects/:path*",
    "/billing/:path*",
    "/scans/:path*",
  ],
};
