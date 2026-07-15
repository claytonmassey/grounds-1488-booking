"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";

  return (
    <header className="site-header">
      <Link href="/" className="brand-mark">
        <span className={onHome ? "sr-only" : "brand-name"}>Grounds 1488</span>
      </Link>
      <nav className="site-nav">
        <Link href="/book/grounds">The Grounds</Link>
        <Link href="/book/glass-house">Glass House</Link>
      </nav>
    </header>
  );
}
