// components/projects/TodoKanbanView.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Calendar, Check, RotateCcw } from "lucide-react";
import type { Todo } from "@/db/schema/projects";
import { STATUS_ORDER, STATUS_LABELS } from "@/utils/projects-helpers";
import { cn } from "@/utils";
import { useTodoActions } from "./useTodoActions";
import TodoEditForm from "./TodoEditForm";

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-truffle text-palladian",
  medium: "bg-blue-fantastic text-palladian",
  low: "bg-muted text-foreground",
};

const COLUMN_ACCENT: Record<string, string> = {
  open: "border-t-4 border-t-abyssal",
  in_progress: "border-t-4 border-t-blue-fantastic",
  on_hold: "border-t-4 border-t-oatmeal",
  done: "border-t-4 border-t-burning-flame",
  cancelled: "border-t-4 border-t-truffle",
};

// Cards are draggable between columns (desktop/mouse). Touch devices can't
// fire HTML5 drag events, so a card's STATUS select inside its edit form
// remains the fallback way to move it — tap the card to open that form.
export default function TodoKanbanView({ todos }: { todos: Todo[] }) {
  const router = useRouter();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<string | null>(null);

  async function moveTodo(id: string, status: string) {
    const todo = todos.find((t) => t.id === id);
    if (!todo || todo.status === status) return;
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("failed to move task");
    }
  }

  return (
    <div className="flex gap-3 p-3 overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory lg:snap-none">
      {STATUS_ORDER.map((status) => {
        const items = todos.filter((t) => t.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => { e.preventDefault(); setOverStatus(status); }}
            onDragLeave={() => setOverStatus((s) => (s === status ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              if (id) moveTodo(id, status);
              setOverStatus(null);
              setDragId(null);
            }}
            className={cn(
              "shrink-0 w-[78vw] max-w-[280px] sm:w-[240px] sm:max-w-none snap-center",
              "lg:w-0 lg:flex-1 lg:min-w-[200px]",
              "pixel-box-sm bg-background transition-colors",
              COLUMN_ACCENT[status],
              overStatus === status && "ring-2 ring-burning-flame ring-inset"
            )}
          >
            <div className="px-3 py-2 bg-muted flex items-center justify-between">
              <span className="font-pixel" style={{ fontSize: "8px" }}>{STATUS_LABELS[status]}</span>
              <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="p-2 space-y-2 min-h-[80px] max-h-[60vh] overflow-y-auto">
              {items.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground text-center py-4">empty</p>
              ) : (
                items.map((todo) => (
                  <KanbanCard
                    key={todo.id}
                    todo={todo}
                    dragging={dragId === todo.id}
                    onDragStart={() => setDragId(todo.id)}
                    onDragEnd={() => setDragId(null)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({
  todo,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  todo: Todo;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const { patch, remove, busy, confirmDialog } = useTodoActions(todo.id);
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="pixel-box-sm bg-card">
        <TodoEditForm todo={todo} onDone={() => setEditing(false)} />
      </div>
    );
  }

  const isDone = todo.status === "done";

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", todo.id); e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragEnd={onDragEnd}
      className={cn(
        "pixel-box-sm bg-card p-2.5 space-y-1.5 cursor-grab active:cursor-grabbing transition-opacity",
        dragging && "opacity-40"
      )}
    >
      <button type="button" onClick={() => setEditing(true)} className="w-full text-left">
        <p className={`font-mono text-xs ${isDone ? "line-through text-muted-foreground" : ""}`}>{todo.title}</p>
      </button>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`pixel-tag border-abyssal ${PRIORITY_STYLE[todo.priority]}`} style={{ fontSize: "6px" }}>
          {todo.priority.toUpperCase()}
        </span>
        {todo.dueDate && (
          <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <Calendar size={9} /> {todo.dueDate}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 pt-1">
        <button
          onClick={() => patch({ status: isDone ? "open" : "done" })}
          disabled={busy}
          className="flex-1 pixel-btn bg-muted p-1.5 flex items-center justify-center gap-1 hover:bg-burning-flame hover:text-abyssal transition-colors"
          title={isDone ? "reopen" : "mark done"}
        >
          {isDone ? <RotateCcw size={11} /> : <Check size={11} />}
        </button>
        <button
          onClick={() => remove(todo.title)}
          disabled={busy}
          className="pixel-btn bg-muted text-muted-foreground p-1.5 hover:bg-truffle hover:text-palladian transition-colors"
          title="delete"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {confirmDialog}
    </div>
  );
}
