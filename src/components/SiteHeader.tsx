"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Logo } from "@/components/Logo";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "ADMIN";
};

const SPACE_LINKS = [
  { href: "/spaces/grounds", label: "The Grounds", match: "/spaces/grounds" },
  {
    href: "/spaces/glass-house",
    label: "Glass House",
    match: "/spaces/glass-house",
  },
  {
    href: "/seasonal-sets",
    label: "Seasonal Sets",
    match: "/seasonal-sets",
    alsoMatch: "/book/seasonal",
  },
] as const;

function linkActive(pathname: string, match: string, alsoMatch?: string) {
  if (pathname === match || pathname.startsWith(`${match}/`)) return true;
  if (alsoMatch && (pathname === alsoMatch || pathname.startsWith(`${alsoMatch}/`))) {
    return true;
  }
  return false;
}

export function SiteHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const menuId = useId();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={[
        "site-header",
        scrolled ? "is-scrolled" : "",
        open ? "is-menu-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="site-header-inner">
        <Link href="/" className="brand-mark" prefetch={!onHome}>
          <Logo size={2.15} withWordmark={!onHome} />
        </Link>

        <nav className="site-nav-desktop" aria-label="Primary">
          <div className="site-nav-links">
            {SPACE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  linkActive(
                    pathname,
                    link.match,
                    "alsoMatch" in link ? link.alsoMatch : undefined,
                  )
                    ? "is-active"
                    : undefined
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="site-nav-actions">
            {user ? (
              <>
                {user.role === "ADMIN" ? (
                  <Link
                    href="/admin/bookings"
                    className={
                      pathname.startsWith("/admin") ? "is-active" : undefined
                    }
                  >
                    Admin
                  </Link>
                ) : null}
                <Link
                  href="/account"
                  className={pathname === "/account" ? "is-active" : undefined}
                >
                  Account
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={pathname === "/login" ? "is-active" : undefined}
                >
                  Log in
                </Link>
                <Link href="/register" className="site-nav-cta">
                  Register
                </Link>
              </>
            )}
            <Link href="/" className="site-nav-cta site-nav-cta--solid">
              Book
            </Link>
          </div>
        </nav>

        <button
          type="button"
          className="site-menu-toggle"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="site-menu-toggle-lines" aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
      </div>

      <div
        id={menuId}
        className={["site-menu-panel", open ? "is-open" : ""].join(" ")}
        hidden={!open}
      >
        <nav className="site-menu-nav" aria-label="Mobile">
          <p className="site-menu-label">Spaces</p>
          {SPACE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                linkActive(
                  pathname,
                  link.match,
                  "alsoMatch" in link ? link.alsoMatch : undefined,
                )
                  ? "is-active"
                  : undefined
              }
            >
              {link.label}
            </Link>
          ))}

          <p className="site-menu-label">Account</p>
          {user ? (
            <>
              {user.role === "ADMIN" ? (
                <Link href="/admin/bookings">Admin</Link>
              ) : null}
              <Link href="/account">My bookings</Link>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/register">Register</Link>
            </>
          )}

          <Link href="/" className="site-menu-book">
            Book a space
          </Link>
        </nav>
      </div>

      {open ? (
        <button
          type="button"
          className="site-menu-backdrop"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </header>
  );
}
