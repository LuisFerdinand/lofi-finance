"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Todo } from "@/db/schema/projects";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

import type { ChecklistItem } from "@/db/schema/projects";

type TodoPatch = Partial<{
  title: string;
  notes: string | null;
  imageUrl: string | null;
  link: string | null;
  checklist: ChecklistItem[];
  status: Todo["status"];
  priority: Todo["priority"];
  dueDate: string | null;
}>;

// Shared PATCH/DELETE logic for a single todo — used by TodoItem, the Kanban
// cards, the Calendar day panel, and the task detail modal so they all hit
// /api/todos/[id] the same way. `remove()` opens a confirm dialog rather than
// deleting immediately; render the returned `confirmDialog` element somewhere in
// the caller's JSX tree. Pass `onDeleted` to run after a successful delete
// (e.g. to close a modal).
export function useTodoActions(todoId: string, onDeleted?: () => void) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);

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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "failed to update");
    } finally {
      setBusy(false);
    }
  }

  function remove(title: string) {
    setPendingTitle(title);
  }

  async function confirmRemove() {
    setBusy(true);
    try {
      await fetch(`/api/todos/${todoId}`, { method: "DELETE" });
      toast.success("todo deleted");
      onDeleted?.();
      router.refresh();
    } catch {
      toast.error("failed to delete");
    } finally {
      setBusy(false);
      setPendingTitle(null);
    }
  }

  const confirmDialog = (
    <ConfirmDialog
      open={pendingTitle !== null}
      title="DELETE TASK"
      message={`Delete "${pendingTitle}"? This cannot be undone.`}
      loading={busy}
      onConfirm={confirmRemove}
      onCancel={() => setPendingTitle(null)}
    />
  );

  return { patch, remove, busy, confirmDialog };
}
