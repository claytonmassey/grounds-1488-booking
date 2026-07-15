import type { Metadata } from "next";
import { LoginPageClient } from "@/components/AuthForms";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return <LoginPageClient />;
}
