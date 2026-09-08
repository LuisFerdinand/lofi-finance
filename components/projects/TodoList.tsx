// components/projects/TodoList.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, List, Columns3, CalendarDays } from "lucide-react";
import type { Todo } from "@/db/schema/projects";
import { sortTodos } from "@/utils/projects-helpers";
import TodoListView from "./TodoListView";
import TodoKanbanView from "./TodoKanbanView";
import TodoCalendarView from "./TodoCalendarView";

type Priority = "low" | "medium" | "high";
type View = "list" | "kanban" | "calendar";

const VIEWS: { key: View; label: string; icon: typeof List }[] = [
  { key: "list", label: "LIST", icon: List },
  { key: "kanban", label: "KANBAN", icon: Columns3 },
  { key: "calendar", label: "CALENDAR", icon: CalendarDays },
];

export default function TodoList({ projectId, todos }: { projectId: string; todos: Todo[] }) {
  const router = useRouter();
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [quickTitle, setQuickTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return todos.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [todos, query, priorityFilter]);

  const sorted = useMemo(() => sortTodos(filtered), [filtered]);

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      setQuickTitle("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "failed to add task");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="pixel-box bg-card overflow-hidden">
      {/* Quick add — single line, Enter to add, always visible for fast daily use */}
      <form onSubmit={handleQuickAdd} className="flex items-center gap-2 p-3 border-b border-border bg-background/40">
        <input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Add a task and hit enter..."
          className="flex-1 pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:border-burning-flame placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={adding || !quickTitle.trim()}
          aria-label="Add task"
          className="pixel-btn bg-burning-flame text-abyssal p-2.5 disabled:opacity-50 shrink-0"
        >
          <Plus size={14} strokeWidth={3} />
        </button>
      </form>

      {/* View switcher */}
      <div className="flex border-b border-border">
        {VIEWS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-pixel transition-colors ${
              view === key ? "bg-burning-flame text-abyssal" : "bg-background text-muted-foreground hover:bg-muted"
            }`}
            style={{ fontSize: "8px" }}
          >
            <Icon size={11} /> {label}
          </button>
        ))}
      </div>

      {/* Search + priority filter — applies across all views */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
        <div className="flex items-center gap-2 flex-1 min-w-[140px] pixel-inset bg-background px-2 py-1.5">
          <Search size={12} className="text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search tasks..."
            className="w-full bg-transparent font-mono text-xs focus:outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className={`pixel-tag border-abyssal transition-colors ${
                priorityFilter === p ? "bg-burning-flame text-abyssal" : "bg-muted text-foreground hover:bg-oatmeal"
              }`}
              style={{ fontSize: "7px" }}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {view === "list" && <TodoListView todos={sorted} hasAnyTodos={todos.length > 0} />}
      {view === "kanban" && <TodoKanbanView todos={sorted} />}
      {view === "calendar" && <TodoCalendarView todos={sorted} />}
    </div>
  );
}
