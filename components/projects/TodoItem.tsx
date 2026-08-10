// components/projects/TodoItem.tsx
"use client";

import { useState } from "react";
import { Check, Trash2, Calendar } from "lucide-react";
import type { Todo } from "@/db/schema/projects";
import { STATUS_LABELS, STATUS_STYLE } from "@/utils/projects-helpers";
import { useTodoActions } from "./useTodoActions";
import TodoEditForm from "./TodoEditForm";

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-truffle text-palladian",
  medium: "bg-blue-fantastic text-palladian",
  low: "bg-muted text-foreground",
};

export default function TodoItem({ todo }: { todo: Todo }) {
  const { patch, remove, busy, confirmDialog } = useTodoActions(todo.id);
  const [editing, setEditing] = useState(false);

  const isDone = todo.status === "done";

  if (editing) {
    return <TodoEditForm todo={todo} onDone={() => setEditing(false)} />;
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-0 ${isDone ? "opacity-60" : ""}`}>
      <button
        onClick={() => patch({ status: isDone ? "open" : "done" })}
        disabled={busy}
        aria-label={isDone ? "mark as open" : "mark as done"}
        className={`shrink-0 w-6 h-6 pixel-box-sm flex items-center justify-center transition-colors ${
          isDone ? "bg-burning-flame text-abyssal" : "bg-background hover:bg-muted"
        }`}
      >
        {isDone && <Check size={13} strokeWidth={3} />}
      </button>

      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex-1 min-w-0 text-left"
      >
        <p className={`font-mono text-sm truncate ${isDone ? "line-through text-muted-foreground" : ""}`}>
          {todo.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {todo.status !== "open" && (
            <span className={`pixel-tag border-abyssal ${STATUS_STYLE[todo.status]}`} style={{ fontSize: "6px" }}>
              {STATUS_LABELS[todo.status]}
            </span>
          )}
          <span className={`pixel-tag border-abyssal ${PRIORITY_STYLE[todo.priority]}`} style={{ fontSize: "6px" }}>
            {todo.priority.toUpperCase()}
          </span>
          {todo.dueDate && (
            <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <Calendar size={9} /> {todo.dueDate}
            </span>
          )}
        </div>
      </button>

      <button
        onClick={() => remove(todo.title)}
        disabled={busy}
        aria-label="delete task"
        className="shrink-0 p-1.5 text-muted-foreground hover:text-truffle transition-colors"
      >
        <Trash2 size={13} />
      </button>

      {confirmDialog}
    </div>
  );
}
