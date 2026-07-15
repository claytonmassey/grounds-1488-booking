import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { SessionUser } from "@/lib/session";

export async function requireAdminPage(
  nextPath: string,
): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (session.role !== "ADMIN") redirect("/account");
  return session;
}
