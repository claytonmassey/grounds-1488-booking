"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { InstantBookLink } from "@/components/InstantBookLink";

export function SiteHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const onBookPage = pathname.startsWith("/book/");

  return (
    <header className="site-header">
      <Link href="/" className="brand-mark" prefetch={!onHome}>
        <span className={onHome ? "sr-only" : "brand-name"}>Grounds 1488</span>
      </Link>
      <nav className="site-nav">
        {onBookPage ? (
          <>
            <Link href="/book/grounds" prefetch={false}>
              The Grounds
            </Link>
            <Link href="/book/glass-house" prefetch={false}>
              Glass House
            </Link>
          </>
        ) : (
          <>
            <InstantBookLink
              href="/book/grounds"
              slug="GROUNDS"
              className="nav-book-link"
            >
              The Grounds
            </InstantBookLink>
            <InstantBookLink
              href="/book/glass-house"
              slug="GLASS_HOUSE"
              className="nav-book-link"
            >
              Glass House
            </InstantBookLink>
          </>
        )}
      </nav>
    </header>
  );
}
