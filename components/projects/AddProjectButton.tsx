// components/projects/AddProjectButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { PROJECT_ICON_MAP } from "@/utils/projects-helpers";
import IconPicker from "@/components/ui/IconPicker";
import FabButton from "@/components/ui/FabButton";

export default function AddProjectButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex pixel-btn bg-burning-flame text-abyssal font-pixel px-4 py-2 items-center gap-2 shrink-0"
        style={{ fontSize: "9px" }}
      >
        <Plus size={12} /> NEW PROJECT
      </button>
      <FabButton icon={Plus} label="new project" onClick={() => setOpen(true)} />
      {open && <AddProjectModal onClose={() => setOpen(false)} />}
    </>
  );
}

function AddProjectModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", icon: "folder" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("enter a project name"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, description: form.description || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      toast.success("project created!");
      router.refresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "failed to create project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-abyssal/70 z-50 flex items-end md:items-center justify-center p-4 bottom-12 md:bottom-0"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="pixel-box bg-card w-full max-w-md animate-slide-up max-h-[90dvh] overflow-y-auto">
        <div className="bg-abyssal text-palladian px-4 py-3 flex items-center justify-between sticky top-0">
          <span className="font-pixel text-xs">NEW PROJECT</span>
          <button onClick={onClose} className="text-oatmeal hover:text-burning-flame transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Icon picker */}
          <div>
            <label className="font-pixel block mb-2" style={{ fontSize: "8px" }}>ICON</label>
            <IconPicker
              icons={PROJECT_ICON_MAP}
              value={form.icon}
              onChange={(icon) => setForm({ ...form, icon })}
            />
          </div>

          {/* Name */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>PROJECT NAME</label>
            <input
              type="text"
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:border-burning-flame placeholder:text-muted-foreground"
              placeholder="e.g. Home Renovation, Website Launch..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>
              DESCRIPTION <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none placeholder:text-muted-foreground resize-none"
              placeholder="What's this project about?"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full pixel-btn bg-burning-flame text-abyssal font-pixel py-3 disabled:opacity-60"
            style={{ fontSize: "9px" }}
          >
            {loading ? "CREATING..." : "► CREATE PROJECT"}
          </button>
        </form>
      </div>
    </div>
  );
}
