import Link from "next/link";

const LINKS = [
  { href: "/admin/bookings", label: "Bookings", key: "bookings" },
  { href: "/admin/seasonal-sets", label: "Seasonal Sets", key: "seasonal" },
  {
    href: "/admin/cancellation",
    label: "Cancellation",
    key: "cancellation",
  },
  { href: "/admin", label: "Content", key: "content" },
  { href: "/admin/users", label: "Users", key: "users" },
] as const;

export function AdminNav({
  current,
}: {
  current: "bookings" | "content" | "users" | "seasonal" | "cancellation";
}) {
  return (
    <nav className="admin-nav" aria-label="Admin">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={current === link.key ? "is-active" : undefined}
        >
          {link.label}
        </Link>
      ))}
      <Link href="/">View site</Link>
      <Link href="/account">My bookings</Link>
    </nav>
  );
}
