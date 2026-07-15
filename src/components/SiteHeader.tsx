"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const onHero = pathname === "/";

  return (
    <header className={onHero ? "site-header site-header-hero" : "site-header"}>
      <Link href="/" className="brand-mark">
        <span className="brand-name">Grounds 1488</span>
      </Link>
      <nav className="site-nav">
        <Link href="/book/grounds">The Grounds</Link>
        <Link href="/book/glass-house">Glass House</Link>
      </nav>
    </header>
  );
}
