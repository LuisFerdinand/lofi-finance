// components/projects/ProjectCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Pin, PinOff, Trash2, ChevronRight, Archive, ArchiveRestore, CheckCircle, XCircle } from "lucide-react";
import { ProjectIconDisplay, calcTodoProgress } from "@/utils/projects-helpers";
import type { ProjectWithProgress } from "@/utils/projects";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function ProjectCard({ project }: { project: ProjectWithProgress }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const progress = calcTodoProgress(project.todoDone, project.todoTotal);
  const isArchived = project.status === "archived";
  const isCompleted = project.status === "completed";

  async function patchStatus(data: Record<string, unknown>) {
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      router.refresh();
    } catch {
      toast.error("failed to update");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      toast.success("project deleted");
      router.refresh();
    } catch {
      toast.error("failed to delete");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className={`pixel-box bg-card transition-all ${isArchived ? "opacity-50" : ""}`}>
      <Link
        href={`/projects/${project.id}`}
        className="block px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="pixel-box-sm bg-burning-flame text-abyssal flex items-center justify-center shrink-0 p-2">
            <ProjectIconDisplay icon={project.icon} size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-pixel text-xs truncate leading-none">{project.name}</p>
              {project.isPinned && (
                <span className="pixel-tag bg-burning-flame text-abyssal border-abyssal shrink-0" style={{ fontSize: "6px" }}>PINNED</span>
              )}
            </div>
            {project.description && (
              <p className="font-mono text-xs text-muted-foreground mt-1 truncate">{project.description}</p>
            )}
          </div>
          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
        </div>
      </Link>

      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-xs text-muted-foreground">
            {project.todoDone} / {project.todoTotal} tasks
          </span>
          <span className="font-pixel text-foreground" style={{ fontSize: "9px" }}>{progress}%</span>
        </div>
        <div className="h-3 bg-muted border-2 border-abyssal overflow-hidden">
          <div
            className={`h-full transition-all ${progress >= 100 && project.todoTotal > 0 ? "bg-burning-flame" : "bg-blue-fantastic"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="px-4 pb-3 flex items-center gap-2">
        <button
          onClick={() => patchStatus({ isPinned: !project.isPinned })}
          title={project.isPinned ? "unpin" : "pin"}
          className="pixel-btn p-2 bg-muted hover:bg-blue-fantastic hover:text-palladian transition-colors"
        >
          {project.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
        </button>
        <button
          onClick={() => patchStatus({ status: isCompleted ? "active" : "completed" })}
          title={isCompleted ? "reopen" : "mark complete"}
          className="pixel-btn p-2 bg-muted hover:bg-burning-flame hover:text-abyssal transition-colors"
        >
          {isCompleted ? <XCircle size={12} /> : <CheckCircle size={12} />}
        </button>
        <button
          onClick={() => patchStatus({ status: isArchived ? "active" : "archived" })}
          title={isArchived ? "unarchive" : "archive"}
          className="pixel-btn p-2 bg-muted hover:bg-blue-fantastic hover:text-palladian transition-colors"
        >
          {isArchived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
        </button>
        <button
          onClick={() => setConfirmOpen(true)}
          title="delete project"
          className="pixel-btn p-2 bg-muted text-truffle hover:bg-truffle hover:text-palladian transition-colors ml-auto"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="DELETE PROJECT"
        message={`Delete "${project.name}" and all its tasks? This cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
