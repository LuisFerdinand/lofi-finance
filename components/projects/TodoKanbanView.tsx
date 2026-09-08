// components/projects/TodoKanbanView.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Trash2,
  Calendar,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  StickyNote,
  GripVertical,
  Link2,
  Paperclip,
  ListChecks,
} from "lucide-react";
import type { Todo } from "@/db/schema/projects";
import { STATUS_ORDER, STATUS_LABELS, todoProgress, type TodoStatusKey } from "@/utils/projects-helpers";
import { cn } from "@/utils";
import { useTodoActions } from "./useTodoActions";
import TodoDetailModal from "./TodoDetailModal";

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-truffle text-palladian",
  medium: "bg-blue-fantastic text-palladian",
  low: "bg-muted text-foreground",
};

const COLUMN_ACCENT: Record<string, string> = {
  open: "border-t-abyssal",
  in_progress: "border-t-blue-fantastic",
  on_hold: "border-t-oatmeal",
  done: "border-t-burning-flame",
  cancelled: "border-t-truffle",
};

// Cards move between columns three ways so it works on every device:
//   • drag and drop (mouse / trackpad)
//   • the ◀ ▶ buttons on each card (touch + keyboard)
//   • the STATUS select in the task detail modal (tap the title)
// Moves are optimistic — the card jumps immediately and rolls back if the
// request fails, so the board never feels like it's waiting on the network.
export default function TodoKanbanView({ todos }: { todos: Todo[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Todo[]>(todos);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<string | null>(null);
  const pending = useRef(0);

  // Adopt fresh server data (add / edit / refresh) — but not while a move
  // request is still in flight, or we'd snap back to the pre-move state.
  useEffect(() => {
    if (pending.current === 0) setItems(todos);
  }, [todos]);

  async function moveTodo(id: string, status: TodoStatusKey) {
    const current = items.find((t) => t.id === id);
    if (!current || current.status === status) return;

    const snapshot = items;
    setItems((list) => list.map((t) => (t.id === id ? { ...t, status } : t)));
    pending.current += 1;

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setItems(snapshot);
      toast.error("failed to move task");
    } finally {
      pending.current -= 1;
    }
  }

  function shift(todo: Todo, dir: 1 | -1) {
    const next = STATUS_ORDER[STATUS_ORDER.indexOf(todo.status as TodoStatusKey) + dir];
    if (next) moveTodo(todo.id, next);
  }

  return (
    <div className="p-3">
      <p className="font-mono text-xs text-muted-foreground mb-2">
        drag a card, or use <ChevronLeft size={11} className="inline -mt-0.5" />
        <ChevronRight size={11} className="inline -mt-0.5" /> to move it between stages
      </p>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
        {STATUS_ORDER.map((status) => {
          const columnItems = items.filter((t) => t.status === status);
          return (
            <div
              key={status}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOverStatus(status);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                setOverStatus((s) => (s === status ? null : s));
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id) moveTodo(id, status);
                setOverStatus(null);
                setDragId(null);
              }}
              className={cn(
                "shrink-0 w-[76vw] max-w-[300px] sm:w-[260px] sm:max-w-none snap-start",
                "lg:flex-1 lg:min-w-[190px]",
                "pixel-box-sm bg-background border-t-4 flex flex-col max-h-[70vh] transition-colors",
                COLUMN_ACCENT[status],
                overStatus === status && "ring-2 ring-burning-flame ring-inset"
              )}
            >
              <div className="px-3 py-2 bg-muted flex items-center justify-between shrink-0">
                <span className="font-pixel" style={{ fontSize: "8px" }}>
                  {STATUS_LABELS[status]}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{columnItems.length}</span>
              </div>

              <div className="p-2 space-y-2 overflow-y-auto flex-1 min-h-[64px]">
                {columnItems.length === 0 ? (
                  <p className="font-mono text-xs text-muted-foreground text-center py-6 border-2 border-dashed border-border">
                    {overStatus === status ? "release to drop" : "empty"}
                  </p>
                ) : (
                  columnItems.map((todo) => (
                    <KanbanCard
                      key={todo.id}
                      todo={todo}
                      dragging={dragId === todo.id}
                      onDragStart={() => setDragId(todo.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverStatus(null);
                      }}
                      onShift={(dir) => shift(todo, dir)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({
  todo,
  dragging,
  onDragStart,
  onDragEnd,
  onShift,
}: {
  todo: Todo;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onShift: (dir: 1 | -1) => void;
}) {
  const { patch, remove, busy, confirmDialog } = useTodoActions(todo.id);
  const [editing, setEditing] = useState(false);

  const idx = STATUS_ORDER.indexOf(todo.status as TodoStatusKey);
  const canPrev = idx > 0;
  const canNext = idx >= 0 && idx < STATUS_ORDER.length - 1;
  const isDone = todo.status === "done";
  const checklist = todo.checklist ?? [];
  const progress = todoProgress(todo);

  return (
    <>
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", todo.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "pixel-box-sm bg-card p-2.5 space-y-2 transition-opacity cursor-grab active:cursor-grabbing",
        dragging && "opacity-40"
      )}
    >
      <div className="flex items-start gap-1.5">
        <GripVertical size={12} className="text-muted-foreground shrink-0 mt-0.5" />
        <button type="button" onClick={() => setEditing(true)} className="flex-1 text-left min-w-0">
          <p className={cn("font-mono text-xs leading-snug", isDone && "line-through text-muted-foreground")}>
            {todo.title}
          </p>
        </button>
      </div>

      {checklist.length > 0 && (
        <div className="pl-[18px]">
          <div className="h-1 bg-muted border border-border overflow-hidden">
            <div
              className={cn("h-full", progress >= 100 ? "bg-burning-flame" : "bg-blue-fantastic")}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap pl-[18px]">
        <span
          className={cn("pixel-tag border-abyssal", PRIORITY_STYLE[todo.priority])}
          style={{ fontSize: "6px" }}
        >
          {todo.priority.toUpperCase()}
        </span>
        {todo.dueDate && (
          <span className="flex items-center gap-1 font-mono text-muted-foreground" style={{ fontSize: "10px" }}>
            <Calendar size={9} /> {todo.dueDate}
          </span>
        )}
        {checklist.length > 0 && (
          <span className="flex items-center gap-1 font-mono text-muted-foreground" style={{ fontSize: "10px" }}>
            <ListChecks size={9} /> {checklist.filter((c) => c.done).length}/{checklist.length}
          </span>
        )}
        {todo.link && <Link2 size={10} className="text-muted-foreground" aria-label="has link" />}
        {todo.imageUrl && <Paperclip size={10} className="text-muted-foreground" aria-label="has image" />}
        {todo.notes && <StickyNote size={10} className="text-muted-foreground" aria-label="has notes" />}
      </div>

      <div className="flex items-center gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={() => onShift(-1)}
          disabled={busy || !canPrev}
          aria-label="move to previous stage"
          title="previous stage"
          className="pixel-btn bg-muted p-1.5 disabled:opacity-25 hover:bg-blue-fantastic hover:text-palladian transition-colors"
        >
          <ChevronLeft size={11} />
        </button>
        <button
          type="button"
          onClick={() => onShift(1)}
          disabled={busy || !canNext}
          aria-label="move to next stage"
          title="next stage"
          className="pixel-btn bg-muted p-1.5 disabled:opacity-25 hover:bg-blue-fantastic hover:text-palladian transition-colors"
        >
          <ChevronRight size={11} />
        </button>

        <span className="flex-1" />

        <button
          type="button"
          onClick={() => patch({ status: isDone ? "open" : "done" })}
          disabled={busy}
          aria-label={isDone ? "reopen task" : "mark task done"}
          title={isDone ? "reopen" : "mark done"}
          className="pixel-btn bg-muted p-1.5 hover:bg-burning-flame hover:text-abyssal transition-colors"
        >
          {isDone ? <RotateCcw size={11} /> : <Check size={11} />}
        </button>
        <button
          type="button"
          onClick={() => remove(todo.title)}
          disabled={busy}
          aria-label="delete task"
          title="delete"
          className="pixel-btn bg-muted text-muted-foreground p-1.5 hover:bg-truffle hover:text-palladian transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {confirmDialog}
    </div>

    {editing && <TodoDetailModal todo={todo} onClose={() => setEditing(false)} />}
    </>
  );
}
