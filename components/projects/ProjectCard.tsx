// components/projects/ProjectCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Pin, PinOff, Trash2, ChevronRight, Archive, ArchiveRestore, CheckCircle, XCircle, Pencil } from "lucide-react";
import { ProjectIconDisplay, calcTodoProgress } from "@/utils/projects-helpers";
import type { ProjectWithProgress } from "@/utils/projects";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ProjectFormModal } from "./AddProjectButton";

export default function ProjectCard({ project }: { project: ProjectWithProgress }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const progress = calcTodoProgress(project.todoDone, project.todoTotal);
  const isArchived = project.status === "archived";
  const isCompleted = project.status === "completed";

  async function patch(data: Record<string, unknown>, success?: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      if (success) toast.success(success);
      router.refresh();
    } catch {
      toast.error("failed to update project");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("project deleted");
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast.error("failed to delete project");
    } finally {
      setBusy(false);
    }
  }

  const iconBtn =
    "pixel-btn p-2 bg-muted hover:text-palladian transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className={`pixel-box bg-card transition-all flex flex-col ${isArchived ? "opacity-60" : ""}`}>
      <Link
        href={`/projects/${project.id}`}
        className="block px-4 py-3.5 border-b border-border hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="pixel-box-sm bg-burning-flame text-abyssal flex items-center justify-center shrink-0 p-2">
            <ProjectIconDisplay icon={project.icon} size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-pixel text-xs truncate leading-snug">{project.name}</p>
              {project.isPinned && <Pin size={13} className="text-burning-flame-ink shrink-0" aria-label="pinned" />}
            </div>
            {project.description && (
              <p className="font-mono text-sm text-muted-foreground mt-1 truncate">{project.description}</p>
            )}
          </div>
          <ChevronRight size={16} className="text-muted-foreground shrink-0" />
        </div>
      </Link>

      <div className="px-4 py-3 flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-sm text-muted-foreground">
            {project.todoDone} / {project.todoTotal} tasks done
          </span>
          <span className="font-pixel text-foreground" style={{ fontSize: "11px" }}>{progress}%</span>
        </div>
        <div className="h-3 bg-muted border-2 border-abyssal overflow-hidden">
          <div
            className={`h-full transition-all ${progress >= 100 && project.todoTotal > 0 ? "bg-status-done" : "bg-status-in-progress"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="px-4 pb-3 flex items-center gap-2">
        <button
          onClick={() => patch({ isPinned: !project.isPinned })}
          disabled={busy}
          title={project.isPinned ? "unpin" : "pin"}
          aria-label={project.isPinned ? "unpin project" : "pin project"}
          className={`${iconBtn} hover:bg-blue-fantastic`}
        >
          {project.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
        <button
          onClick={() => setEditing(true)}
          disabled={busy}
          title="edit"
          aria-label="edit project"
          className={`${iconBtn} hover:bg-blue-fantastic`}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() =>
            patch({ status: isCompleted ? "active" : "completed" }, isCompleted ? "project reopened" : "project completed 🎉")
          }
          disabled={busy}
          title={isCompleted ? "reopen" : "mark complete"}
          aria-label={isCompleted ? "reopen project" : "mark project complete"}
          className={`${iconBtn} hover:bg-status-done`}
        >
          {isCompleted ? <XCircle size={14} /> : <CheckCircle size={14} />}
        </button>
        <button
          onClick={() => patch({ status: isArchived ? "active" : "archived" }, isArchived ? "project restored" : "project archived")}
          disabled={busy}
          title={isArchived ? "unarchive" : "archive"}
          aria-label={isArchived ? "unarchive project" : "archive project"}
          className={`${iconBtn} hover:bg-blue-fantastic`}
        >
          {isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
        </button>
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={busy}
          title="delete project"
          aria-label="delete project"
          className="pixel-btn p-2 bg-muted text-truffle hover:bg-truffle hover:text-palladian transition-colors ml-auto disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {editing && <ProjectFormModal project={project} onClose={() => setEditing(false)} />}

      <ConfirmDialog
        open={confirmOpen}
        title="DELETE PROJECT"
        message={`Delete "${project.name}" and all ${project.todoTotal} of its tasks? This cannot be undone.`}
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
