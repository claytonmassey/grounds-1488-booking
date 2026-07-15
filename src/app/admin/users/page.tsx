import type { Metadata } from "next";
import { AdminNav } from "@/components/AdminNav";
import { AdminUsersTable } from "@/app/admin/users/AdminUsersTable";
import { requireAdminPage } from "@/lib/admin";
import { logoutAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Users · Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requireAdminPage("/admin/users");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { bookings: true } },
    },
  });

  const initialUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as "CUSTOMER" | "ADMIN",
    createdAt: user.createdAt.toISOString().slice(0, 10),
    bookingCount: user._count.bookings,
  }));

  return (
    <div className="page-shell">
      <div className="page-shell-inner page-shell-inner--wide">
        <p className="section-kicker">Admin</p>
        <h1 className="page-title">Users</h1>
        <p className="page-lede">
          Flag accounts as admin so they can manage bookings and site content.
        </p>
        <AdminNav current="users" />

        <AdminUsersTable
          initialUsers={initialUsers}
          currentUserId={session.id}
        />

        <form action={logoutAction} className="logout-form">
          <button className="text-btn" type="submit">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
