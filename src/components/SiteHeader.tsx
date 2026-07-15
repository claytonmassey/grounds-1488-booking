"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "ADMIN";
};

export function SiteHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <header className="site-header">
      <Link href="/" className="brand-mark" prefetch={!onHome}>
        <Logo size={1.75} withWordmark={!onHome} />
      </Link>
      <nav className="site-nav">
        <Link
          href="/spaces/grounds"
          className={pathname.startsWith("/spaces/grounds") ? "is-active" : undefined}
        >
          The Grounds
        </Link>
        <Link
          href="/spaces/glass-house"
          className={
            pathname.startsWith("/spaces/glass-house") ? "is-active" : undefined
          }
        >
          Glass House
        </Link>
        {user ? (
          <>
            {user.role === "ADMIN" ? (
              <Link href="/admin/bookings">Admin</Link>
            ) : null}
            <Link href="/account">Account</Link>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}
