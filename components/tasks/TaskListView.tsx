// components/tasks/TaskListView.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/utils";
import {
  STATUS_COLOR,
  STATUS_LABELS,
  STATUS_ORDER,
  PriorityIcon,
  compareBoard,
  compareByPriority,
  type TaskItem,
  type TodoStatusKey,
} from "@/utils/projects-helpers";
import { isTempId, useTasks } from "./TaskProvider";
import { ChecklistBar, DueChip, ProjectChip, StatusSelect, TaskMeta } from "./TaskBits";
import { useToday } from "./useToday";

export type ListSort = "priority" | "due" | "newest" | "rank";

export const LIST_SORTS: { key: ListSort; label: string }[] = [
  { key: "priority", label: "Priority" },
  { key: "due", label: "Due date" },
  { key: "newest", label: "Newest" },
  { key: "rank", label: "Board order" },
];

const SORTERS: Record<ListSort, (a: TaskItem, b: TaskItem) => number> = {
  priority: compareByPriority,
  due: (a, b) => {
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate && !b.dueDate) return -1;
    if (b.dueDate && !a.dueDate) return 1;
    return compareByPriority(a, b);
  },
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  rank: compareBoard,
};

export default function TaskListView({
  tasks,
  showProject,
  sort,
  emptyHint,
}: {
  tasks: TaskItem[];
  showProject: boolean;
  sort: ListSort;
  emptyHint: string;
}) {
  const [open, setOpen] = useState<Record<TodoStatusKey, boolean>>({
    open: true,
    in_progress: true,
    on_hold: true,
    done: false,
    cancelled: false,
  });

  const groups = useMemo(() => {
    const by: Record<TodoStatusKey, TaskItem[]> = { open: [], in_progress: [], on_hold: [], done: [], cancelled: [] };
    for (const t of tasks) by[t.status as TodoStatusKey]?.push(t);
    for (const s of STATUS_ORDER) by[s].sort(SORTERS[sort]);
    return by;
  }, [tasks, sort]);

  if (tasks.length === 0) {
    return <p className="font-mono text-sm text-muted-foreground text-center p-10">{emptyHint}</p>;
  }

  return (
    <div>
      {STATUS_ORDER.map((status) => {
        const items = groups[status];
        if (items.length === 0) return null;
        const color = STATUS_COLOR[status];
        const expanded = open[status];
        return (
          <section key={status} className="border-b border-border last:border-b-0">
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [status]: !o[status] }))}
              aria-expanded={expanded}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-l-4 hover:brightness-95 transition",
                color.tint,
                color.edge
              )}
            >
              {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              <span className={cn("w-2.5 h-2.5", color.dot)} />
              <span className="font-pixel" style={{ fontSize: "10px" }}>
                {STATUS_LABELS[status]}
              </span>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">{items.length}</span>
            </button>
            {expanded && (
              <ul>
                {items.map((t) => (
                  <TaskRow key={t.id} task={t} showProject={showProject} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function TaskRow({ task, showProject }: { task: TaskItem; showProject: boolean }) {
  const router = useRouter();
  const { updateTask } = useTasks();
  const today = useToday();
  const temp = isTempId(task.id);
  const isDone = task.status === "done";
  const closed = isDone || task.status === "cancelled";
  const href = `/tasks/${task.id}`;

  return (
    <li
      className={cn(
        "relative group flex items-start sm:items-center gap-3 px-3 py-3 border-t border-border hover:bg-muted/40 transition-colors",
        temp && "opacity-60"
      )}
      onMouseEnter={() => !temp && router.prefetch(href)}
    >
      {/* Stretched link — the whole row opens the task; the controls below sit
          above it (relative z-10) so they keep their own clicks. */}
      {!temp && (
        <Link href={href} prefetch={false} aria-label={`open task: ${task.title}`} className="absolute inset-0" />
      )}

      <button
        type="button"
        disabled={temp}
        onClick={() => updateTask(task.id, { status: isDone ? "open" : "done" })}
        aria-label={isDone ? "reopen task" : "mark task done"}
        className={cn(
          "relative z-10 shrink-0 w-6 h-6 mt-0.5 sm:mt-0 border-2 border-abyssal flex items-center justify-center transition-colors",
          isDone ? "bg-status-done text-white" : "bg-background hover:bg-status-done/15"
        )}
      >
        {isDone && <Check size={14} strokeWidth={3} />}
      </button>

      <PriorityIcon priority={task.priority} size={16} className="hidden sm:block" />

      <div className="flex-1 min-w-0">
        <p className={cn("font-mono text-sm leading-snug break-words", closed && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap mt-1">
          <PriorityIcon priority={task.priority} size={14} className="sm:hidden" />
          {showProject && <ProjectChip name={task.projectName} icon={task.projectIcon} className="max-w-[200px]" />}
          <DueChip dueDate={task.dueDate} status={task.status} today={today} className="md:hidden" />
          <TaskMeta task={task} />
        </div>
        {task.checklist.length > 0 && <ChecklistBar task={task} className="mt-1.5 max-w-[240px]" />}
      </div>

      <DueChip
        dueDate={task.dueDate}
        status={task.status}
        today={today}
        className="hidden md:inline-flex w-28 justify-end shrink-0"
      />

      <StatusSelect
        value={task.status}
        disabled={temp}
        onChange={(status) => updateTask(task.id, { status })}
        className="relative z-10 shrink-0"
      />
    </li>
  );
}
