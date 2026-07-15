import type { Metadata } from "next";
import { RegisterPageClient } from "@/components/AuthForms";

export const metadata: Metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return <RegisterPageClient />;
}
