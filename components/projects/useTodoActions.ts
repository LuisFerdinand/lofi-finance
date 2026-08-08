// components/projects/useTodoActions.ts
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Todo } from "@/db/schema/projects";

type TodoPatch = Partial<{
  title: string;
  notes: string | null;
  status: Todo["status"];
  priority: Todo["priority"];
  dueDate: string | null;
}>;

// Shared PATCH/DELETE logic for a single todo — used by TodoItem, the Kanban
// cards, and the Calendar day panel so they all hit /api/todos/[id] the same way.
export function useTodoActions(todoId: string) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function patch(data: TodoPatch) {
    setBusy(true);
    try {
      const res = await fetch(`/api/todos/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? "failed to update");
    } finally {
      setBusy(false);
    }
  }

  async function remove(title: string) {
    if (!confirm(`delete "${title}"?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/todos/${todoId}`, { method: "DELETE" });
      toast.success("todo deleted");
      router.refresh();
    } catch {
      toast.error("failed to delete");
    } finally {
      setBusy(false);
    }
  }

  return { patch, remove, busy };
}
