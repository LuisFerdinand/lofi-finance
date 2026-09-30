// components/tasks/TaskWorkspace.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, Columns3, List, Loader2, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { cn } from "@/utils";
import {
  ACTIVE_STATUSES,
  PRIORITY_META,
  PRIORITY_ORDER,
  PriorityIcon,
  type PriorityKey,
  type TaskView,
} from "@/utils/projects-helpers";
import { useTasks } from "./TaskProvider";
import { PrioritySelect } from "./TaskBits";
import TaskListView, { LIST_SORTS, type ListSort } from "./TaskListView";
import TaskBoardView from "./TaskBoardView";
import TaskCalendarView from "./TaskCalendarView";
import { useToday } from "./useToday";

/** sessionStorage key: the list/board URL a task page's "back" returns to. */
export const LAST_LIST_KEY = "lofi:lastTaskList";

function rememberListUrl() {
  try {
    sessionStorage.setItem(LAST_LIST_KEY, window.location.pathname + window.location.search);
  } catch {
    // storage unavailable — back links fall back to the project / tasks page
  }
}

const VIEWS: { key: TaskView; label: string; short: string; icon: typeof List }[] = [
  { key: "list", label: "LIST", short: "LIST", icon: List },
  { key: "board", label: "BOARD", short: "BOARD", icon: Columns3 },
  { key: "calendar", label: "CALENDAR", short: "CAL", icon: CalendarDays },
];

type DueFilter = "overdue" | "week";

export default function TaskWorkspace({
  initialView,
  showProject,
  emptyHint,
}: {
  initialView: TaskView;
  /** Cross-project page: show project chips, a project filter and picker. */
  showProject: boolean;
  emptyHint: string;
}) {
  const { tasks, projects, saving, createTask } = useTasks();
  const today = useToday();
  const [view, setView] = useState<TaskView>(initialView);
  const [query, setQuery] = useState("");
  const [priorities, setPriorities] = useState<PriorityKey[]>([]);
  const [due, setDue] = useState<DueFilter | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>("all"); // "all" | "none" | project id
  const [sort, setSort] = useState<ListSort>("priority");
  const [showFilters, setShowFilters] = useState(false); // phones only

  // Quick-add fields
  const [title, setTitle] = useState("");
  const [newPriority, setNewPriority] = useState<PriorityKey>("medium");
  const [newDue, setNewDue] = useState("");
  const [newProject, setNewProject] = useState<string>("none");
  const addRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  function changeView(v: TaskView) {
    setView(v);
    // Keep the view in the URL so Back from a task page lands on the same view.
    const url = new URL(window.location.href);
    if (v === "list") url.searchParams.delete("view");
    else url.searchParams.set("view", v);
    window.history.replaceState(window.history.state, "", url);
    rememberListUrl();
  }

  useEffect(() => {
    rememberListUrl();
  }, []);

  // Keyboard: "c" focuses quick-add (Jira's create key), "/" focuses search.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === "c") {
        e.preventDefault();
        addRef.current?.focus();
      } else if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q) {
        const hay = `${t.title} ${t.notes ?? ""} ${t.projectName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (priorities.length > 0 && !priorities.includes(t.priority as PriorityKey)) return false;
      if (showProject && projectFilter !== "all") {
        if (projectFilter === "none" ? t.projectId !== null : t.projectId !== projectFilter) return false;
      }
      if (due) {
        const active = (ACTIVE_STATUSES as readonly string[]).includes(t.status);
        if (!active || !t.dueDate) return false;
        const diff = differenceInCalendarDays(parseISO(t.dueDate), parseISO(today));
        if (due === "overdue" && diff >= 0) return false;
        if (due === "week" && (diff < 0 || diff > 7)) return false;
      }
      return true;
    });
  }, [tasks, query, priorities, projectFilter, due, showProject, today]);

  const activeFilterCount = priorities.length + (due ? 1 : 0) + (projectFilter !== "all" ? 1 : 0);
  const filtersOn = query.trim() !== "" || activeFilterCount > 0;

  function clearFilters() {
    setQuery("");
    setPriorities([]);
    setDue(null);
    setProjectFilter("all");
  }

  async function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setTitle("");
    await createTask({
      title: t,
      priority: newPriority,
      dueDate: newDue || null,
      ...(showProject ? { projectId: newProject === "none" ? null : newProject } : {}),
    });
    setNewDue("");
  }

  // New tasks can't go into archived projects; filtering by one is still fine.
  const selectableProjects = projects.filter((p) => !p.archived);

  return (
    <div className="pixel-box bg-card">
      {/* View tabs + save state */}
      <div className="flex items-stretch border-b-2 border-abyssal bg-background">
        {VIEWS.map(({ key, label, short, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => changeView(key)}
            aria-pressed={view === key}
            className={cn(
              "flex items-center justify-center gap-2 px-3 sm:px-5 py-3 font-pixel transition-colors border-r border-border",
              view === key ? "bg-abyssal text-burning-flame" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            style={{ fontSize: "10px" }}
          >
            <Icon size={14} />
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 px-3 font-mono text-xs text-muted-foreground" aria-live="polite">
          {saving > 0 ? (
            <>
              <Loader2 size={13} className="animate-spin" /> saving…
            </>
          ) : (
            <>
              <Check size={13} className="text-status-done" /> <span className="hidden sm:inline">saved</span>
            </>
          )}
        </div>
      </div>

      {/* Quick add */}
      <form onSubmit={quickAdd} className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-background/40">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] pixel-inset bg-background px-3 focus-within:border-burning-flame">
          <Plus size={16} className="text-muted-foreground shrink-0" />
          <input
            ref={addRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="Add a task and press Enter…"
            title="Tip: press C anywhere on this page to jump here"
            className="flex-1 min-w-0 bg-transparent py-2 font-mono text-sm focus:outline-none placeholder:text-muted-foreground"
          />
        </div>
        {/* Extra fields: always on wider screens; on phones they appear once
            you start typing, so the board isn't pushed below the fold. */}
        <div className={cn("flex-wrap items-center gap-2", title.trim() ? "flex" : "hidden sm:flex")}>
          {showProject && (
            <select
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              aria-label="project for new task"
              className="pixel-inset bg-background px-2 py-2 font-mono text-xs max-w-[180px]"
            >
              <option value="none">No project</option>
              {selectableProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <PrioritySelect value={newPriority} onChange={setNewPriority} className="py-2" />
          <input
            type="date"
            value={newDue}
            onChange={(e) => setNewDue(e.target.value)}
            aria-label="due date for new task"
            className="pixel-inset bg-background px-2 py-1.5 font-mono text-xs"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="pixel-btn bg-burning-flame text-abyssal font-pixel px-4 py-2.5 disabled:opacity-50 inline-flex items-center gap-1.5"
            style={{ fontSize: "10px" }}
          >
            <Plus size={14} strokeWidth={3} /> ADD
          </button>
        </div>
      </form>

      {/* Search + quick filters */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] pixel-inset bg-background px-2.5 py-1.5">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={showProject ? "search tasks, notes, projects… ( / )" : "search tasks & notes… ( / )"}
            className="w-full bg-transparent font-mono text-sm focus:outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Phones: filters fold behind a toggle; wider screens show them inline. */}
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          aria-expanded={showFilters}
          className={cn(
            "sm:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 border-2 font-pixel transition-colors",
            showFilters || activeFilterCount > 0 ? "bg-abyssal text-palladian border-abyssal" : "bg-background border-border"
          )}
          style={{ fontSize: "9px" }}
        >
          <SlidersHorizontal size={13} /> FILTERS{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
        </button>

        <div className={cn("items-center gap-2 flex-wrap w-full sm:contents", showFilters ? "flex" : "hidden")}>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRIORITY_ORDER.map((p) => {
            const on = priorities.includes(p);
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                onClick={() => setPriorities((list) => (on ? list.filter((x) => x !== p) : [...list, p]))}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 border-2 font-pixel transition-colors",
                  on ? "bg-abyssal text-palladian border-abyssal" : "bg-background border-border hover:border-abyssal"
                )}
                style={{ fontSize: "9px" }}
              >
                <PriorityIcon priority={p} size={13} className={on ? "text-burning-flame!" : undefined} />
                {PRIORITY_META[p].label}
              </button>
            );
          })}
          <span className="w-px h-5 bg-border mx-0.5" />
          {(
            [
              { key: "overdue", label: "OVERDUE" },
              { key: "week", label: "DUE ≤ 7D" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={due === f.key}
              onClick={() => setDue((d) => (d === f.key ? null : f.key))}
              className={cn(
                "px-2 py-1 border-2 font-pixel transition-colors",
                due === f.key
                  ? f.key === "overdue"
                    ? "bg-due-overdue text-white border-abyssal"
                    : "bg-abyssal text-palladian border-abyssal"
                  : "bg-background border-border hover:border-abyssal"
              )}
              style={{ fontSize: "9px" }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {showProject && (
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            aria-label="filter by project"
            className="pixel-inset bg-background px-2 py-1.5 font-mono text-xs max-w-[200px]"
          >
            <option value="all">All projects</option>
            <option value="none">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.archived ? " (archived)" : ""}
              </option>
            ))}
          </select>
        )}

        {view === "list" && (
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as ListSort)}
            aria-label="sort tasks"
            className="pixel-inset bg-background px-2 py-1.5 font-mono text-xs"
          >
            {LIST_SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                Sort: {s.label}
              </option>
            ))}
          </select>
        )}
        </div>

        {filtersOn && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 font-pixel text-truffle hover:underline"
            style={{ fontSize: "9px" }}
          >
            <X size={12} /> CLEAR
          </button>
        )}
      </div>

      {filtersOn && (
        <p className="px-3 pt-2 font-mono text-xs text-muted-foreground">
          showing {filtered.length} of {tasks.length}
        </p>
      )}

      {view === "list" && (
        <TaskListView
          tasks={filtered}
          showProject={showProject}
          sort={sort}
          emptyHint={tasks.length === 0 ? emptyHint : "no tasks match these filters"}
        />
      )}
      {view === "board" && <TaskBoardView tasks={filtered} showProject={showProject} />}
      {view === "calendar" && <TaskCalendarView tasks={filtered} showProject={showProject} />}
    </div>
  );
}
