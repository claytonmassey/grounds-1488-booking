"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState, useTransition } from "react";

type Mode = "login" | "register";

function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";
  const prefilledEmail = searchParams.get("email") ?? "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (prefilledEmail) setEmail(prefilledEmail);
  }, [prefilledEmail]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login"
            ? { email, password }
            : { name, email, password },
        ),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      const role = data.user?.role;
      if (role === "ADMIN" && (next === "/account" || !next)) {
        router.push("/admin");
      } else {
        router.push(next);
      }
      router.refresh();
    });
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {mode === "register" ? (
        <label className="field">
          <span>Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>
      ) : null}
      <label className="field">
        <span>Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          required
          type="password"
          minLength={mode === "register" ? 8 : 1}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={
            mode === "login" ? "current-password" : "new-password"
          }
        />
      </label>
      {error ? <p className="notice notice-error">{error}</p> : null}
      <button className="submit-btn" type="submit" disabled={pending}>
        {pending
          ? "Please wait…"
          : mode === "login"
            ? "Log in"
            : "Create account"}
      </button>
    </form>
  );
}

export function LoginPageClient() {
  return (
    <div className="page-shell">
      <div className="page-shell-inner auth-shell">
        <p className="section-kicker">Account</p>
        <h1 className="page-title">Log in</h1>
        <p className="page-lede">
          Track your bookings and payments in one place.
        </p>
        <Suspense fallback={<p className="hint">Loading…</p>}>
          <AuthForm mode="login" />
        </Suspense>
        <p className="auth-switch">
          New here? <Link href="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export function RegisterPageClient() {
  return (
    <div className="page-shell">
      <div className="page-shell-inner auth-shell">
        <p className="section-kicker">Account</p>
        <h1 className="page-title">Register</h1>
        <p className="page-lede">
          Save your details and view past purchases anytime.
        </p>
        <Suspense fallback={<p className="hint">Loading…</p>}>
          <AuthForm mode="register" />
        </Suspense>
        <p className="auth-switch">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
