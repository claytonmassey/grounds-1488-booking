"use client";

import { useState, useTransition } from "react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  createdAt: string;
  bookingCount: number;
};

export function AdminUsersTable({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserRow[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleAdmin(user: UserRow) {
    const nextRole = user.role === "ADMIN" ? "CUSTOMER" : "ADMIN";
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to update user");
        return;
      }

      setUsers((current) =>
        current.map((row) =>
          row.id === user.id ? { ...row, role: data.user.role } : row,
        ),
      );
      setMessage(
        nextRole === "ADMIN"
          ? `${user.email} is now an admin.`
          : `${user.email} is now a customer.`,
      );
    });
  }

  return (
    <div className="admin-users">
      {message ? <p className="notice">{message}</p> : null}
      {error ? <p className="notice notice-error">{error}</p> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Bookings</th>
              <th>Joined</th>
              <th>Admin</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    {isSelf ? (
                      <span className="admin-table-sub">you</span>
                    ) : null}
                  </td>
                  <td>{user.email}</td>
                  <td>{user.bookingCount}</td>
                  <td>{user.createdAt}</td>
                  <td>
                    <label className="admin-flag">
                      <input
                        type="checkbox"
                        checked={user.role === "ADMIN"}
                        disabled={pending || (isSelf && user.role === "ADMIN")}
                        onChange={() => toggleAdmin(user)}
                      />
                      <span>{user.role === "ADMIN" ? "Admin" : "Customer"}</span>
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="hint">
        You can’t remove your own admin access here. Promote another admin
        first if you need to step down.
      </p>
    </div>
  );
}
