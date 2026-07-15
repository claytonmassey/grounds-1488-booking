import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginPageClient } from "@/components/AuthForms";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin/bookings" : "/account");
  }
  return <LoginPageClient />;
}
