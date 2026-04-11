"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate, getInitials } from "@/utils";
import type { User } from "@/db/schema";
import { Shield, ShieldOff, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface Props {
  users: User[];
  currentUserId: string;
}

export default function AdminUserTable({ users, currentUserId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleToggleActive(id: string) {
    setLoading(id + "-active");
    try {
      const res = await fetch(`/api/users/${id}/toggle`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      toast.success("status updated");
      router.refresh();
    } catch {
      toast.error("failed to update");
    } finally {
      setLoading(null);
    }
  }

  async function handleChangeRole(id: string, newRole: "admin" | "user") {
    setLoading(id + "-role");
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error();
      toast.success("role updated");
      router.refresh();
    } catch {
      toast.error("failed to update role");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`delete user "${name}"? this also deletes all their transactions.`)) return;
    setLoading(id + "-delete");
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("user deleted");
      router.refresh();
    } catch {
      toast.error("failed to delete user");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="pixel-box bg-card overflow-hidden">
      {/* Header */}
      <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-2 bg-abyssal text-palladian">
        {["", "USER", "ROLE", "STATUS", "JOINED", "ACTIONS"].map((h) => (
          <p key={h} className="font-pixel text-palladian" style={{ fontSize: "7px" }}>{h}</p>
        ))}
      </div>

      {users.map((user, i) => {
        const isSelf = user.id === currentUserId;
        return (
          <div
            key={user.id}
            className={`flex flex-col md:grid md:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 md:gap-4 p-4 border-b border-border last:border-0 items-start md:items-center ${i % 2 === 0 ? "" : "bg-background/50"} ${!user.isActive ? "opacity-60" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 flex items-center justify-center border-2 border-abyssal shrink-0 ${user.role === "admin" ? "bg-burning-flame" : "bg-oatmeal"}`}
            >
              <span className="font-pixel text-abyssal" style={{ fontSize: "7px" }}>
                {getInitials(user.name)}
              </span>
            </div>

            {/* User info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs font-bold truncate">{user.name}</p>
                {isSelf && (
                  <span className="pixel-tag bg-burning-flame text-abyssal border-abyssal" style={{ fontSize: "6px" }}>
                    YOU
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            {/* Role */}
            <div>
              <select
                value={user.role}
                onChange={(e) => handleChangeRole(user.id, e.target.value as "admin" | "user")}
                disabled={isSelf || loading === user.id + "-role"}
                className="pixel-inset bg-background font-mono text-xs px-2 py-1 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <span
                className={`pixel-tag ${user.isActive ? "bg-burning-flame text-abyssal border-abyssal" : "bg-muted text-muted-foreground border-border"}`}
                style={{ fontSize: "7px" }}
              >
                {user.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>

            {/* Joined */}
            <p className="font-mono text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(user.createdAt)}
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleToggleActive(user.id)}
                disabled={isSelf || loading === user.id + "-active"}
                title={user.isActive ? "deactivate" : "activate"}
                className="pixel-btn p-1.5 bg-muted hover:bg-blue-fantastic hover:text-palladian disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {user.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              </button>
              <button
                onClick={() => handleDelete(user.id, user.name)}
                disabled={isSelf || loading === user.id + "-delete"}
                title="delete user"
                className="pixel-btn p-1.5 bg-muted text-truffle hover:bg-truffle hover:text-palladian disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
