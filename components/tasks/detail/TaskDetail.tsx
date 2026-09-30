// components/tasks/detail/TaskDetail.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDays, format, parseISO } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  RotateCcw,
  StickyNote,
  Trash2,
} from "lucide-react";
import { cn } from "@/utils";
import {
  ProjectIconDisplay,
  STATUS_COLOR,
  type ProjectOption,
  type TaskItem,
  type TodoImage,
  type TodoStatusKey,
} from "@/utils/projects-helpers";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useTasks } from "../TaskProvider";
import { DueChip, PrioritySelect, StatusSelect } from "../TaskBits";
import { useIsClient, useToday } from "../useToday";
import { LAST_LIST_KEY } from "../TaskWorkspace";
import ChecklistSection from "./ChecklistSection";
import LinksSection from "./LinksSection";
import ImagesSection from "./ImagesSection";
import { Section } from "./Section";

const TEXT_SAVE_DELAY = 700;

export default function TaskDetail({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { tasks, projects, saving, updateTask, deleteTask } = useTasks();
  const task = tasks.find((t) => t.id === taskId);
  const today = useToday();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const addImages = useCallback(
    (added: TodoImage[]) => updateTask(taskId, (t) => ({ images: [...t.images, ...added] })),
    [taskId, updateTask]
  );

  // Where "back" goes: the list/board the user came from (with its view),
  // else the task's project, else the Tasks page.
  const fallbackBack = task?.projectId ? `/projects/${task.projectId}` : "/tasks";
  const [backHref, setBackHref] = useState(fallbackBack);
  useEffect(() => {
    try {
      const last = sessionStorage.getItem(LAST_LIST_KEY);
      // Read after mount — sessionStorage doesn't exist during SSR.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (last && last.startsWith("/")) setBackHref(last);
    } catch {
      // storage unavailable — keep the fallback
    }
  }, []);

  if (!task) {
    return (
      <div className="pixel-box bg-card p-10 text-center space-y-3">
        <p className="font-pixel text-xs text-muted-foreground">TASK REMOVED</p>
        <Link href={backHref} className="font-mono text-sm underline">
          go back
        </Link>
      </div>
    );
  }

  const color = STATUS_COLOR[task.status as TodoStatusKey] ?? STATUS_COLOR.open;
  const isDone = task.status === "done";

  async function handleDelete() {
    setDeleting(true);
    const ok = await deleteTask(taskId);
    setDeleting(false);
    setConfirmDelete(false);
    if (ok) router.push(backHref);
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <nav className="flex items-center gap-2 min-w-0 font-pixel text-muted-foreground" style={{ fontSize: "10px" }}>
          <Link href={backHref} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors shrink-0">
            <ArrowLeft size={13} /> BACK
          </Link>
          <span className="opacity-40">|</span>
          <Link href="/tasks" className="hover:text-foreground transition-colors shrink-0">
            TASKS
          </Link>
          {task.projectId && task.projectName && (
            <>
              <ChevronRight size={12} className="shrink-0" />
              <Link
                href={`/projects/${task.projectId}`}
                className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors min-w-0"
              >
                <ProjectIconDisplay icon={task.projectIcon ?? "folder"} size={12} className="shrink-0" />
                <span className="truncate">{task.projectName}</span>
              </Link>
            </>
          )}
        </nav>
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground" aria-live="polite">
          {saving > 0 ? (
            <>
              <Loader2 size={13} className="animate-spin" /> saving…
            </>
          ) : (
            <>
              <Check size={13} className="text-status-done" /> all changes saved
            </>
          )}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px] items-start">
        {/* Main column */}
        <div className="space-y-4 min-w-0">
          <div className={cn("pixel-box bg-card border-t-[6px] p-4 sm:p-5", color.bar)}>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <StatusSelect value={task.status} onChange={(status) => updateTask(taskId, { status })} />
              <DueChip dueDate={task.dueDate} status={task.status} today={today} long />
            </div>
            <TitleEditor task={task} onSave={(title) => updateTask(taskId, { title })} />
          </div>

          <NotesEditor task={task} onSave={(notes) => updateTask(taskId, { notes })} />

          <ChecklistSection items={task.checklist} onChange={(checklist) => updateTask(taskId, { checklist })} />

          <LinksSection links={task.links} onChange={(links) => updateTask(taskId, { links })} />

          <ImagesSection
            images={task.images}
            onAdd={addImages}
            onRemove={(id) => updateTask(taskId, (t) => ({ images: t.images.filter((i) => i.id !== id) }))}
          />
        </div>

        {/* Details sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-0">
          <DetailsPanel
            task={task}
            projects={projects}
            onChange={(patch) => updateTask(taskId, patch)}
          />

          <div className="pixel-box bg-card p-4 space-y-2">
            <button
              type="button"
              onClick={() => updateTask(taskId, { status: isDone ? "open" : "done" })}
              className={cn(
                "w-full pixel-btn font-pixel py-3 inline-flex items-center justify-center gap-2 transition-colors",
                isDone ? "bg-muted text-foreground hover:bg-oatmeal" : "bg-status-done text-white"
              )}
              style={{ fontSize: "10px" }}
            >
              {isDone ? <RotateCcw size={14} /> : <Check size={14} strokeWidth={3} />}
              {isDone ? "REOPEN TASK" : "MARK AS DONE"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full pixel-btn bg-muted text-truffle hover:bg-truffle hover:text-palladian font-pixel py-2.5 inline-flex items-center justify-center gap-2 transition-colors"
              style={{ fontSize: "10px" }}
            >
              <Trash2 size={14} /> DELETE TASK
            </button>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="DELETE TASK"
        message={`Delete "${task.title}"? Its checklist, links and images go with it. This cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

/** Debounced text field: saves shortly after typing stops, and on blur. */
function useDebouncedSave(initial: string, save: (value: string) => void) {
  const [value, setValue] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saved = useRef(initial);
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback((next: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (next === saved.current) return;
    saved.current = next;
    saveRef.current(next);
  }, []);

  const change = useCallback(
    (next: string) => {
      setValue(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => flush(next), TEXT_SAVE_DELAY);
    },
    [flush]
  );

  // Save anything still pending when leaving the page.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  useEffect(() => () => {
    if (timer.current) flush(valueRef.current);
  }, [flush]);

  return { value, setValue, change, flush, saved };
}

function TitleEditor({ task, onSave }: { task: TaskItem; onSave: (title: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const { value, setValue, change, flush, saved } = useDebouncedSave(task.title, (v) => {
    const t = v.trim();
    if (t) onSave(t.slice(0, 200));
  });

  // Auto-grow to fit the title.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      maxLength={200}
      aria-label="task title"
      onChange={(e) => change(e.target.value.replace(/\n/g, " "))}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLTextAreaElement).blur();
        }
      }}
      onBlur={() => {
        if (!value.trim()) {
          setValue(saved.current);
          return;
        }
        flush(value);
      }}
      className={cn(
        "w-full resize-none overflow-hidden bg-transparent font-mono text-xl sm:text-2xl font-bold leading-snug",
        "border-2 border-transparent hover:border-border focus:border-burning-flame focus:bg-background focus:outline-none px-2 py-1 -mx-2",
        (task.status === "done" || task.status === "cancelled") && "text-muted-foreground"
      )}
    />
  );
}

function NotesEditor({ task, onSave }: { task: TaskItem; onSave: (notes: string | null) => void }) {
  const { value, change, flush } = useDebouncedSave(task.notes ?? "", (v) => onSave(v.trim() ? v : null));
  return (
    <Section icon={StickyNote} title="DESCRIPTION">
      <textarea
        value={value}
        onChange={(e) => change(e.target.value)}
        onBlur={() => flush(value)}
        rows={6}
        maxLength={5000}
        placeholder="Context, decisions, blockers, acceptance criteria…"
        className="w-full pixel-inset bg-background px-3 py-2.5 font-mono text-sm leading-relaxed focus:outline-none focus:border-burning-flame resize-y min-h-[140px] placeholder:text-muted-foreground"
      />
    </Section>
  );
}

function DetailsPanel({
  task,
  projects,
  onChange,
}: {
  task: TaskItem;
  projects: ProjectOption[];
  onChange: (patch: Partial<Pick<TaskItem, "status" | "priority" | "dueDate" | "projectId">>) => void;
}) {
  const today = useToday();
  const isClient = useIsClient();
  const quickDates = [
    { label: "TODAY", value: today },
    { label: "TMRW", value: format(addDays(parseISO(today), 1), "yyyy-MM-dd") },
    { label: "+1 WK", value: format(addDays(parseISO(today), 7), "yyyy-MM-dd") },
  ];
  const stamp = (iso: string | null) => (iso && isClient ? format(new Date(iso), "d MMM yyyy, HH:mm") : iso ? "…" : "—");
  const overdue = task.dueDate && task.dueDate < today && task.status !== "done" && task.status !== "cancelled";

  return (
    <div className="pixel-box bg-card">
      <div className="bg-abyssal text-palladian px-4 py-2.5">
        <h2 className="font-pixel" style={{ fontSize: "11px" }}>
          DETAILS
        </h2>
      </div>
      <dl className="p-4 space-y-4">
        <Field label="STATUS">
          <StatusSelect value={task.status} onChange={(status) => onChange({ status })} />
        </Field>

        <Field label="PRIORITY">
          <PrioritySelect value={task.priority} onChange={(priority) => onChange({ priority })} className="py-1.5" />
        </Field>

        <Field label="DUE DATE">
          <div className="space-y-2 w-full">
            <input
              type="date"
              value={task.dueDate ?? ""}
              onChange={(e) => onChange({ dueDate: e.target.value || null })}
              className={cn(
                "w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none",
                overdue && "border-due-overdue text-due-overdue"
              )}
            />
            <div className="flex flex-wrap gap-1.5">
              {quickDates.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => onChange({ dueDate: q.value })}
                  className={cn(
                    "px-2 py-1 border-2 font-pixel transition-colors",
                    task.dueDate === q.value ? "bg-abyssal text-palladian border-abyssal" : "border-border hover:border-abyssal"
                  )}
                  style={{ fontSize: "9px" }}
                >
                  {q.label}
                </button>
              ))}
              {task.dueDate && (
                <button
                  type="button"
                  onClick={() => onChange({ dueDate: null })}
                  className="px-2 py-1 border-2 border-border hover:border-truffle hover:text-truffle font-pixel transition-colors"
                  style={{ fontSize: "9px" }}
                >
                  CLEAR
                </button>
              )}
            </div>
            {overdue && (
              <p className="flex items-center gap-1.5 font-mono text-xs text-due-overdue">
                <AlertCircle size={13} /> this task is overdue
              </p>
            )}
          </div>
        </Field>

        <Field label="PROJECT">
          <select
            value={task.projectId ?? ""}
            onChange={(e) => onChange({ projectId: e.target.value || null })}
            className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none"
          >
            <option value="">No project</option>
            {projects
              .filter((p) => !p.archived || p.id === task.projectId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.archived ? " (archived)" : ""}
                </option>
              ))}
          </select>
        </Field>

        <div className="pt-3 border-t border-border space-y-1.5 font-mono text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <Clock size={12} /> created {stamp(task.createdAt)}
          </p>
          <p className="flex items-center gap-2">
            <Clock size={12} /> updated {stamp(task.updatedAt)}
          </p>
          {task.completedAt && task.status === "done" && (
            <p className="flex items-center gap-2 text-status-done">
              <Check size={12} /> completed {stamp(task.completedAt)}
            </p>
          )}
        </div>
      </dl>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="font-pixel text-muted-foreground" style={{ fontSize: "9px" }}>
        {label}
      </dt>
      <dd className="flex">{children}</dd>
    </div>
  );
}
