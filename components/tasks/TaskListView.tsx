// components/tasks/TaskListView.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Calendar, ListChecks, Link2, Paperclip, ExternalLink } from "lucide-react";
import type { TodoWithProject } from "@/utils/projects";
import {
  ProjectIconDisplay,
  STATUS_LABELS,
  STATUS_STYLE,
  todoProgress,
  type TodoStatusKey,
} from "@/utils/projects-helpers";
import { cn } from "@/utils";
import TodoDetailModal from "@/components/projects/TodoDetailModal";

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-truffle text-palladian",
  medium: "bg-blue-fantastic text-palladian",
  low: "bg-muted text-foreground",
};

const ACTIVE: TodoStatusKey[] = ["open", "in_progress", "on_hold"];
type StatusScope = "active" | "all" | "done";
type PriorityScope = "all" | "high" | "medium" | "low";

const TODAY = new Date().toISOString().slice(0, 10);

export default function TaskListView({ todos }: { todos: TodoWithProject[] }) {
  const [query, setQuery] = useState("");
  const [statusScope, setStatusScope] = useState<StatusScope>("active");
  const [priorityScope, setPriorityScope] = useState<PriorityScope>("all");
  const [projectId, setProjectId] = useState<string | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const projects = useMemo(() => {
    const map = new Map<string, { id: string; name: string; icon: string }>();
    for (const t of todos) {
      if (!map.has(t.projectId)) {
        map.set(t.projectId, { id: t.projectId, name: t.projectName, icon: t.projectIcon });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [todos]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return todos.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q) && !t.projectName.toLowerCase().includes(q)) return false;
      if (projectId !== "all" && t.projectId !== projectId) return false;
      if (priorityScope !== "all" && t.priority !== priorityScope) return false;
      if (statusScope === "active" && !ACTIVE.includes(t.status as TodoStatusKey)) return false;
      if (statusScope === "done" && t.status !== "done") return false;
      return true;
    });
  }, [todos, query, projectId, priorityScope, statusScope]);

  const openTodo = openId ? todos.find((t) => t.id === openId) ?? null : null;

  return (
    <div className="pixel-box bg-card overflow-hidden">
      {/* Filters */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2 pixel-inset bg-background px-2 py-1.5">
          <Search size={12} className="text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search tasks or projects..."
            className="w-full bg-transparent font-mono text-xs focus:outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(["active", "all", "done"] as StatusScope[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusScope(s)}
              className={cn(
                "pixel-tag border-abyssal transition-colors",
                statusScope === s ? "bg-burning-flame text-abyssal" : "bg-muted text-foreground hover:bg-oatmeal"
              )}
              style={{ fontSize: "7px" }}
            >
              {s.toUpperCase()}
            </button>
          ))}
          <span className="w-px h-4 bg-border mx-1" />
          {(["all", "high", "medium", "low"] as PriorityScope[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityScope(p)}
              className={cn(
                "pixel-tag border-abyssal transition-colors",
                priorityScope === p ? "bg-burning-flame text-abyssal" : "bg-muted text-foreground hover:bg-oatmeal"
              )}
              style={{ fontSize: "7px" }}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>

        {projects.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setProjectId("all")}
              className={cn(
                "pixel-tag border-abyssal transition-colors",
                projectId === "all" ? "bg-blue-fantastic text-palladian" : "bg-muted text-foreground hover:bg-oatmeal"
              )}
              style={{ fontSize: "7px" }}
            >
              ALL PROJECTS
            </button>
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProjectId(p.id)}
                className={cn(
                  "pixel-tag border-abyssal transition-colors inline-flex items-center gap-1",
                  projectId === p.id ? "bg-blue-fantastic text-palladian" : "bg-muted text-foreground hover:bg-oatmeal"
                )}
                style={{ fontSize: "7px" }}
              >
                <ProjectIconDisplay icon={p.icon} size={9} /> {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rows — a responsive card grid so the page fills the width nicely */}
      {filtered.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground text-center p-8">
          {todos.length === 0 ? "no tasks yet — create one inside a project" : "no tasks match these filters"}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-2 gap-2 p-2">
          {filtered.map((todo) => {
            const isDone = todo.status === "done";
            const checklist = todo.checklist ?? [];
            const overdue = !isDone && todo.status !== "cancelled" && todo.dueDate != null && todo.dueDate < TODAY;
            return (
              <button
                key={todo.id}
                type="button"
                onClick={() => setOpenId(todo.id)}
                className={cn(
                  "text-left border-2 border-abyssal bg-background p-3 flex flex-col gap-1.5 transition-colors hover:bg-muted/40",
                  isDone && "opacity-60"
                )}
              >
                <div className="flex items-center gap-2">
                  <ProjectIconDisplay icon={todo.projectIcon} size={11} className="text-muted-foreground shrink-0" />
                  <span className="font-mono text-xs text-muted-foreground truncate">{todo.projectName}</span>
                </div>
                <p className={cn("font-mono text-sm leading-snug", isDone && "line-through text-muted-foreground")}>{todo.title}</p>
                <div className="flex items-center gap-2 flex-wrap mt-auto pt-1">
                  {todo.status !== "open" && (
                    <span className={cn("pixel-tag border-abyssal", STATUS_STYLE[todo.status])} style={{ fontSize: "6px" }}>
                      {STATUS_LABELS[todo.status]}
                    </span>
                  )}
                  <span className={cn("pixel-tag border-abyssal", PRIORITY_STYLE[todo.priority])} style={{ fontSize: "6px" }}>
                    {todo.priority.toUpperCase()}
                  </span>
                  {todo.dueDate && (
                    <span className={cn("flex items-center gap-1 font-mono text-xs", overdue ? "text-truffle" : "text-muted-foreground")}>
                      <Calendar size={9} /> {todo.dueDate}{overdue ? " · overdue" : ""}
                    </span>
                  )}
                  {checklist.length > 0 && (
                    <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                      <ListChecks size={9} /> {checklist.filter((c) => c.done).length}/{checklist.length}
                    </span>
                  )}
                  {todo.link && <Link2 size={10} className="text-muted-foreground" aria-label="has link" />}
                  {todo.imageUrl && <Paperclip size={10} className="text-muted-foreground" aria-label="has image" />}
                </div>
                {checklist.length > 0 && (
                  <div className="h-1 bg-muted border border-border overflow-hidden">
                    <div
                      className={cn("h-full", todoProgress(todo) >= 100 ? "bg-burning-flame" : "bg-blue-fantastic")}
                      style={{ width: `${todoProgress(todo)}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="px-3 py-2 border-t border-border">
        <Link href="/projects" className="font-pixel text-muted-foreground hover:text-burning-flame transition-colors inline-flex items-center gap-1" style={{ fontSize: "7px" }}>
          MANAGE PROJECTS <ExternalLink size={9} />
        </Link>
      </div>

      {openTodo && <TodoDetailModal todo={openTodo} onClose={() => setOpenId(null)} />}
    </div>
  );
}
