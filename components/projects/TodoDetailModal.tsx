// components/projects/TodoDetailModal.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X, ExternalLink, Plus, Trash2, ListChecks } from "lucide-react";
import type { ChecklistItem, Todo } from "@/db/schema/projects";
import { STATUS_ORDER, STATUS_LABELS } from "@/utils/projects-helpers";
import { checkCloudinaryConfigured, uploadToCloudinary } from "@/utils/cloudinary";
import { useTodoActions } from "./useTodoActions";
import CloudinaryImageInput from "./CloudinaryImageInput";

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

// The full task editor — replaces the old cramped inline TodoEditForm. Opened
// from a list row, kanban card, or calendar day panel. Everything is edited
// locally and persisted in one PATCH on SAVE.
export default function TodoDetailModal({ todo, onClose }: { todo: Todo; onClose: () => void }) {
  const { patch, remove, busy, confirmDialog } = useTodoActions(todo.id, onClose);

  const [title, setTitle] = useState(todo.title);
  const [status, setStatus] = useState<Todo["status"]>(todo.status);
  const [priority, setPriority] = useState<Todo["priority"]>(todo.priority);
  const [dueDate, setDueDate] = useState(todo.dueDate ?? "");
  const [link, setLink] = useState(todo.link ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(todo.imageUrl ?? null);
  const [notes, setNotes] = useState(todo.notes ?? "");
  const [items, setItems] = useState<ChecklistItem[]>(todo.checklist ?? []);
  const [draft, setDraft] = useState("");
  const [pasteUploading, setPasteUploading] = useState(false);
  // null = still probing; avoids flashing the "not configured" hint on open.
  const [cldEnabled, setCldEnabled] = useState<boolean | null>(null);

  // Is Cloudinary configured on the server?
  useEffect(() => {
    let active = true;
    checkCloudinaryConfigured().then((ok) => {
      if (active) setCldEnabled(ok);
    });
    return () => {
      active = false;
    };
  }, []);

  // "Paste a screenshot" — anywhere in the modal.
  useEffect(() => {
    if (!cldEnabled) return;
    async function onPaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/")
      );
      const file = item?.getAsFile();
      if (!file) return;
      e.preventDefault();
      setPasteUploading(true);
      try {
        setImageUrl(await uploadToCloudinary(file));
        toast.success("screenshot attached");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "upload failed");
      } finally {
        setPasteUploading(false);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [cldEnabled]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const doneCount = items.filter((i) => i.done).length;
  const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  function addItem() {
    const text = draft.trim();
    if (!text) return;
    setItems((list) => [...list, { id: newId(), text, done: false }]);
    setDraft("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("title required");
      return;
    }

    let normalizedLink: string | null = null;
    if (link.trim()) {
      const raw = /^https?:\/\//i.test(link.trim()) ? link.trim() : `https://${link.trim()}`;
      try {
        new URL(raw);
        normalizedLink = raw;
      } catch {
        toast.error("that link doesn't look valid");
        return;
      }
    }

    const cleanChecklist = items
      .map((i) => ({ id: i.id, text: i.text.trim(), done: i.done }))
      .filter((i) => i.text.length > 0);

    await patch({
      title: title.trim(),
      status,
      priority,
      dueDate: dueDate || null,
      link: normalizedLink,
      imageUrl: imageUrl || null,
      notes: notes.trim() || null,
      checklist: cleanChecklist,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-abyssal/70 z-50 flex items-end md:items-center justify-center p-4 bottom-12 md:bottom-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pixel-box bg-card w-full max-w-lg animate-slide-up max-h-[90dvh] overflow-y-auto">
        <div className="bg-abyssal text-palladian px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <span className="font-pixel text-xs">EDIT TASK</span>
          <button
            onClick={onClose}
            aria-label="close"
            className="text-oatmeal hover:text-burning-flame transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>TITLE</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:border-burning-flame"
            />
          </div>

          {/* Status + priority */}
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>STATUS</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Todo["status"])}
                className="w-full min-w-0 pixel-inset bg-background px-2 py-2 font-mono text-xs focus:outline-none"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>PRIORITY</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Todo["priority"])}
                className="w-full min-w-0 pixel-inset bg-background px-2 py-2 font-mono text-xs focus:outline-none"
              >
                <option value="low">LOW</option>
                <option value="medium">MEDIUM</option>
                <option value="high">HIGH</option>
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>
              DUE DATE <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-xs focus:outline-none"
            />
          </div>

          {/* Link */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-pixel" style={{ fontSize: "8px" }}>
                LINK <span className="text-muted-foreground">(optional)</span>
              </span>
              {link.trim() && (
                <a
                  href={/^https?:\/\//i.test(link.trim()) ? link.trim() : `https://${link.trim()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-burning-flame-ink inline-flex items-center gap-1 hover:underline font-mono text-xs"
                >
                  open <ExternalLink size={9} />
                </a>
              )}
            </div>
            <input
              type="text"
              inputMode="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="figma.com/..., github.com/..., a doc"
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-xs focus:outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Image */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>
              IMAGE <span className="text-muted-foreground">(optional)</span>
              {pasteUploading && <span className="text-burning-flame-ink"> · uploading paste…</span>}
            </label>
            <CloudinaryImageInput value={imageUrl} onChange={setImageUrl} enabled={cldEnabled} />
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-pixel flex items-center gap-1.5" style={{ fontSize: "8px" }}>
                <ListChecks size={11} /> CHECKLIST
              </label>
              {items.length > 0 && (
                <span className="font-mono text-xs text-muted-foreground">
                  {doneCount}/{items.length} · {progress}%
                </span>
              )}
            </div>

            {items.length > 0 && (
              <div className="h-2 bg-muted border border-abyssal overflow-hidden mb-2">
                <div
                  className={`h-full transition-all ${progress >= 100 ? "bg-burning-flame" : "bg-blue-fantastic"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setItems((list) =>
                        list.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i))
                      )
                    }
                    aria-label={item.done ? "mark item undone" : "mark item done"}
                    className={`shrink-0 w-5 h-5 pixel-box-sm flex items-center justify-center text-xs ${
                      item.done ? "bg-burning-flame text-abyssal" : "bg-background"
                    }`}
                  >
                    {item.done ? "✓" : ""}
                  </button>
                  <input
                    value={item.text}
                    onChange={(e) =>
                      setItems((list) =>
                        list.map((i) => (i.id === item.id ? { ...i, text: e.target.value } : i))
                      )
                    }
                    className={`flex-1 min-w-0 pixel-inset bg-background px-2 py-1.5 font-mono text-xs focus:outline-none ${
                      item.done ? "line-through text-muted-foreground" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setItems((list) => list.filter((_, i) => i !== idx))}
                    aria-label="remove checklist item"
                    className="shrink-0 p-1 text-muted-foreground hover:text-truffle transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem();
                  }
                }}
                placeholder="add a step and hit enter"
                className="flex-1 min-w-0 pixel-inset bg-background px-2 py-1.5 font-mono text-xs focus:outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={addItem}
                aria-label="add checklist item"
                className="shrink-0 pixel-btn bg-muted p-1.5 hover:bg-burning-flame hover:text-abyssal transition-colors"
              >
                <Plus size={12} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>
              NOTES <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="context, decisions, blockers…"
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none resize-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 pixel-btn bg-burning-flame text-abyssal font-pixel py-3 disabled:opacity-60"
              style={{ fontSize: "9px" }}
            >
              {busy ? "SAVING..." : "► SAVE"}
            </button>
            <button
              type="button"
              onClick={() => remove(todo.title)}
              disabled={busy}
              aria-label="delete task"
              className="pixel-btn bg-muted text-truffle hover:bg-truffle hover:text-palladian px-3 py-3 transition-colors"
            >
              <Trash2 size={14} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="pixel-btn bg-muted text-foreground font-pixel px-4 py-3"
              style={{ fontSize: "9px" }}
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>

      {confirmDialog}
    </div>
  );
}
