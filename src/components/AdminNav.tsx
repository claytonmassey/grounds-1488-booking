import Link from "next/link";

const LINKS = [
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin", label: "Content" },
  { href: "/admin/users", label: "Users" },
] as const;

export function AdminNav({ current }: { current: "bookings" | "content" | "users" }) {
  return (
    <nav className="admin-nav" aria-label="Admin">
      {LINKS.map((link) => {
        const active =
          (current === "content" && link.href === "/admin") ||
          (current === "bookings" && link.href === "/admin/bookings") ||
          (current === "users" && link.href === "/admin/users");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? "is-active" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
      <Link href="/">View site</Link>
      <Link href="/account">My bookings</Link>
    </nav>
  );
}
