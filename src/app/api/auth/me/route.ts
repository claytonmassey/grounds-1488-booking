import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getSession,
  readSessionToken,
  setSessionCookie,
  sessionCookieName,
} from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  // Keep the JWT cookie in sync when the DB role/name diverges.
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  const cookieSession = token ? await readSessionToken(token) : null;
  if (
    !cookieSession ||
    cookieSession.role !== session.role ||
    cookieSession.name !== session.name ||
    cookieSession.email !== session.email
  ) {
    await setSessionCookie(session);
  }

  return NextResponse.json({ user: session });
}
