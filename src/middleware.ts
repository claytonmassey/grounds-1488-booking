import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { sessionCookieName } from "@/lib/session";

const PROTECTED_PREFIXES = ["/account", "/admin"];

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!needsAuth) {
    return NextResponse.next();
  }

  const token = request.cookies.get(sessionCookieName())?.value;
  const secret = getSecret();

  if (!token || !secret) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  try {
    await jwtVerify(token, secret);
    // Role checks happen in requireAdminPage / getSession (DB-backed) so
    // promotions apply without waiting for cookie re-issue.
    return NextResponse.next();
  } catch {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    const response = NextResponse.redirect(login);
    response.cookies.delete(sessionCookieName());
    return response;
  }
}

export const config = {
  matcher: ["/account", "/account/:path*", "/admin", "/admin/:path*"],
};
