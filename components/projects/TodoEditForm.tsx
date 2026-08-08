// components/projects/TodoEditForm.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Todo } from "@/db/schema/projects";
import { STATUS_ORDER, STATUS_LABELS } from "@/utils/projects-helpers";
import { useTodoActions } from "./useTodoActions";

// Shared inline edit form (title/status/priority/due date) used by the list rows,
// kanban cards, and calendar day panel — the STATUS select is how a kanban card
// "moves" between columns since there's no drag-and-drop.
export default function TodoEditForm({ todo, onDone }: { todo: Todo; onDone: () => void }) {
  const { patch, busy } = useTodoActions(todo.id);
  const [title, setTitle] = useState(todo.title);
  const [priority, setPriority] = useState(todo.priority);
  const [status, setStatus] = useState(todo.status);
  const [dueDate, setDueDate] = useState(todo.dueDate ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("title required"); return; }
    await patch({ title: title.trim(), priority, status, dueDate: dueDate || null });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-muted/40 space-y-2" onClick={(e) => e.stopPropagation()}>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full pixel-inset bg-background px-2 py-1.5 font-mono text-sm focus:outline-none focus:border-burning-flame"
      />
      <div className="flex gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Todo["status"])}
          className="pixel-inset bg-background px-2 py-1.5 font-mono text-xs flex-1 focus:outline-none"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Todo["priority"])}
          className="pixel-inset bg-background px-2 py-1.5 font-mono text-xs flex-1 focus:outline-none"
        >
          <option value="low">low priority</option>
          <option value="medium">medium priority</option>
          <option value="high">high priority</option>
        </select>
      </div>
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full pixel-inset bg-background px-2 py-1.5 font-mono text-xs focus:outline-none"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="flex-1 pixel-btn bg-burning-flame text-abyssal font-pixel py-1.5 disabled:opacity-60" style={{ fontSize: "8px" }}>
          SAVE
        </button>
        <button type="button" onClick={onDone} className="pixel-btn bg-muted text-foreground px-3 py-1.5 font-pixel" style={{ fontSize: "8px" }}>
          CANCEL
        </button>
      </div>
    </form>
  );
}
