import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterPageClient } from "@/components/AuthForms";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Register",
};

export default async function RegisterPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin/bookings" : "/account");
  }
  return <RegisterPageClient />;
}
