// components/projects/ProjectHeader.tsx
"use client";

import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/utils";
import { ProjectIconDisplay, STATUS_COLOR, STATUS_LABELS, STATUS_ORDER } from "@/utils/projects-helpers";
import { useTasks } from "@/components/tasks/TaskProvider";
import { ProjectFormModal } from "./AddProjectButton";

// Fills left → right: finished work, then work in flight; the empty rest is to-do.
const BAR_ORDER = ["done", "in_progress", "on_hold"] as const;

// Project name/description + live progress, read from the task store so it
// moves as soon as a task is completed on the board below.
export default function ProjectHeader({
  project,
}: {
  project: { id: string; name: string; description: string | null; icon: string; status: string };
}) {
  const { tasks } = useTasks();
  const [editing, setEditing] = useState(false);

  const counts = useMemo(() => {
    const c = { open: 0, in_progress: 0, on_hold: 0, done: 0, cancelled: 0 } as Record<string, number>;
    for (const t of tasks) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [tasks]);
  // Cancelled work doesn't count against progress.
  const total = tasks.length - counts.cancelled;
  const done = counts.done;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="pixel-box bg-card p-4 flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="pixel-box-sm bg-burning-flame text-abyssal flex items-center justify-center shrink-0 p-3">
          <ProjectIconDisplay icon={project.icon} size={24} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-pixel text-sm leading-relaxed break-words">{project.name}</h1>
            {project.status !== "active" && (
              <span className="pixel-tag bg-muted text-foreground border-abyssal">{project.status}</span>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="edit project"
              title="edit project"
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil size={14} />
            </button>
          </div>
          {project.description && (
            <p className="font-mono text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
          )}
        </div>
      </div>

      <div className="lg:w-96 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-muted-foreground">
            {done} / {total} done
          </span>
          <span className="font-pixel" style={{ fontSize: "11px" }}>
            {progress}%
          </span>
        </div>
        {/* Stacked by stage so the bar shows *where* the work is, not just how much is done. */}
        <div className="h-3.5 bg-muted border-2 border-abyssal overflow-hidden flex">
          {total > 0 &&
            BAR_ORDER.map((s) =>
              counts[s] > 0 ? (
                <div
                  key={s}
                  className={cn("h-full transition-all", STATUS_COLOR[s].dot)}
                  style={{ width: `${(counts[s] / total) * 100}%` }}
                  title={`${STATUS_LABELS[s]}: ${counts[s]}`}
                />
              ) : null
            )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {STATUS_ORDER.map((s) =>
            counts[s] > 0 ? (
              <span key={s} className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <span className={cn("w-2 h-2", STATUS_COLOR[s].dot)} />
                {STATUS_LABELS[s].toLowerCase()} {counts[s]}
              </span>
            ) : null
          )}
        </div>
      </div>

      {editing && <ProjectFormModal project={project} onClose={() => setEditing(false)} />}
    </div>
  );
}
