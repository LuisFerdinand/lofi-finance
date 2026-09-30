// components/projects/AddProjectButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { PROJECT_ICON_MAP } from "@/utils/projects-helpers";
import IconPicker from "@/components/ui/IconPicker";
import FabButton from "@/components/ui/FabButton";
import Modal from "@/components/ui/Modal";

export default function AddProjectButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex pixel-btn bg-burning-flame text-abyssal font-pixel px-4 py-2 items-center gap-2 shrink-0"
        style={{ fontSize: "11px" }}
      >
        <Plus size={14} /> NEW PROJECT
      </button>
      <FabButton icon={Plus} label="new project" onClick={() => setOpen(true)} />
      {open && <ProjectFormModal onClose={() => setOpen(false)} />}
    </>
  );
}

/** Create a project, or edit one when `project` is passed. */
export function ProjectFormModal({
  project,
  onClose,
}: {
  project?: { id: string; name: string; description: string | null; icon: string };
  onClose: () => void;
}) {
  const router = useRouter();
  const editing = Boolean(project);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: project?.name ?? "",
    description: project?.description ?? "",
    icon: project?.icon ?? "folder",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("enter a project name");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(editing ? `/api/projects/${project!.id}` : "/api/projects", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          icon: form.icon,
          description: editing ? form.description.trim() || null : form.description.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "request failed");
      }
      toast.success(editing ? "project updated" : "project created!");
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "failed to save project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={editing ? "EDIT PROJECT" : "NEW PROJECT"}>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="font-pixel block mb-2" style={{ fontSize: "10px" }}>ICON</label>
          <IconPicker icons={PROJECT_ICON_MAP} value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
        </div>

        <div>
          <label htmlFor="project-name" className="font-pixel block mb-1" style={{ fontSize: "10px" }}>
            PROJECT NAME
          </label>
          <input
            id="project-name"
            type="text"
            required
            autoFocus
            maxLength={100}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:border-burning-flame placeholder:text-muted-foreground"
            placeholder="e.g. Home Renovation, Website Launch..."
          />
        </div>

        <div>
          <label htmlFor="project-desc" className="font-pixel block mb-1" style={{ fontSize: "10px" }}>
            DESCRIPTION <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="project-desc"
            value={form.description}
            maxLength={500}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none placeholder:text-muted-foreground resize-none"
            placeholder="What's this project about?"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 pixel-btn bg-burning-flame text-abyssal font-pixel py-3 disabled:opacity-60"
            style={{ fontSize: "11px" }}
          >
            {loading ? "SAVING..." : editing ? "► SAVE CHANGES" : "► CREATE PROJECT"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn bg-muted text-foreground font-pixel px-4 py-3"
            style={{ fontSize: "11px" }}
          >
            CANCEL
          </button>
        </div>
      </form>
    </Modal>
  );
}
