import { redirect } from "next/navigation";
import { getSession, type SessionUser } from "@/lib/auth";

export async function requireAdminPage(
  nextPath: string,
): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (session.role !== "ADMIN") redirect("/account");
  return session;
}
