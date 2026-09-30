// components/tasks/TaskBits.tsx
"use client";

import { CalendarDays, ChevronDown, Image as ImageIcon, Link2, ListChecks, StickyNote } from "lucide-react";
import { cn } from "@/utils";
import {
  DUE_TONE_CLASS,
  PRIORITY_META,
  PRIORITY_ORDER,
  PriorityIcon,
  ProjectIconDisplay,
  STATUS_COLOR,
  STATUS_LABELS,
  STATUS_ORDER,
  dueInfo,
  type PriorityKey,
  type TaskItem,
  type TodoStatusKey,
} from "@/utils/projects-helpers";

export function StatusDot({ status, className }: { status: string; className?: string }) {
  const c = STATUS_COLOR[status as TodoStatusKey] ?? STATUS_COLOR.open;
  return <span aria-hidden className={cn("inline-block w-2.5 h-2.5 shrink-0 border border-abyssal/40", c.dot, className)} />;
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const s = (status as TodoStatusKey) in STATUS_COLOR ? (status as TodoStatusKey) : "open";
  return <span className={cn("status-pill", STATUS_COLOR[s].solid, className)}>{STATUS_LABELS[s]}</span>;
}

/**
 * The status pill doubles as its own picker: a transparent native <select>
 * sits on top, so it's keyboard/screen-reader friendly, uses the phone's
 * native picker, and its menu can never be clipped by an overflow container.
 */
export function StatusSelect({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string;
  onChange: (status: TodoStatusKey) => void;
  disabled?: boolean;
  className?: string;
}) {
  const s = (value as TodoStatusKey) in STATUS_COLOR ? (value as TodoStatusKey) : "open";
  return (
    <span className={cn("relative inline-flex", className)}>
      <span className={cn("status-pill pr-1.5", STATUS_COLOR[s].solid, disabled && "opacity-60")}>
        {STATUS_LABELS[s]}
        <ChevronDown size={11} strokeWidth={3} />
      </span>
      <select
        aria-label="change status"
        value={s}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as TodoStatusKey)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      >
        {STATUS_ORDER.map((st) => (
          <option key={st} value={st}>
            {STATUS_LABELS[st]}
          </option>
        ))}
      </select>
    </span>
  );
}

export function PrioritySelect({
  value,
  onChange,
  disabled,
  showLabel = true,
  className,
}: {
  value: string;
  onChange: (priority: PriorityKey) => void;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
}) {
  const p = (value as PriorityKey) in PRIORITY_META ? (value as PriorityKey) : "medium";
  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-1.5 pixel-inset bg-background px-2 py-1",
        disabled && "opacity-60",
        className
      )}
    >
      <PriorityIcon priority={p} size={15} />
      {showLabel && (
        <span className="font-pixel" style={{ fontSize: "9px" }}>
          {PRIORITY_META[p].label}
        </span>
      )}
      <ChevronDown size={11} className="text-muted-foreground" />
      <select
        aria-label="change priority"
        value={p}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as PriorityKey)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      >
        {PRIORITY_ORDER.map((pr) => (
          <option key={pr} value={pr}>
            {PRIORITY_META[pr].label}
          </option>
        ))}
      </select>
    </span>
  );
}

export function DueChip({
  dueDate,
  status,
  today,
  long = false,
  className,
}: {
  dueDate: string | null;
  status: string;
  today: string;
  long?: boolean;
  className?: string;
}) {
  const info = dueInfo(dueDate, today, status);
  if (!info) return null;
  return (
    <span
      className={cn("inline-flex items-center gap-1 font-mono text-xs whitespace-nowrap", DUE_TONE_CLASS[info.tone], className)}
      title={info.long}
    >
      <CalendarDays size={12} className="shrink-0" />
      {long ? info.long : info.label}
    </span>
  );
}

export function ProjectChip({
  name,
  icon,
  className,
}: {
  name: string | null;
  icon: string | null;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono text-xs text-muted-foreground min-w-0", className)}>
      {name ? (
        <>
          <ProjectIconDisplay icon={icon ?? "folder"} size={12} className="shrink-0" />
          <span className="truncate">{name}</span>
        </>
      ) : (
        <>
          <StickyNote size={12} className="shrink-0" />
          <span className="truncate italic">no project</span>
        </>
      )}
    </span>
  );
}

/** Compact attachment/checklist counters shown on rows and cards. */
export function TaskMeta({ task, className }: { task: TaskItem; className?: string }) {
  const checklist = task.checklist ?? [];
  const done = checklist.filter((c) => c.done).length;
  const complete = checklist.length > 0 && done === checklist.length;
  if (checklist.length === 0 && task.links.length === 0 && task.images.length === 0 && !task.notes) return null;
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-mono text-xs text-muted-foreground", className)}>
      {checklist.length > 0 && (
        <span className={cn("inline-flex items-center gap-1", complete && "text-status-done font-bold")} title="checklist">
          <ListChecks size={12} /> {done}/{checklist.length}
        </span>
      )}
      {task.links.length > 0 && (
        <span className="inline-flex items-center gap-1" title={`${task.links.length} link(s)`}>
          <Link2 size={12} /> {task.links.length}
        </span>
      )}
      {task.images.length > 0 && (
        <span className="inline-flex items-center gap-1" title={`${task.images.length} image(s)`}>
          <ImageIcon size={12} /> {task.images.length}
        </span>
      )}
      {task.notes && <StickyNote size={12} aria-label="has notes" />}
    </span>
  );
}

/** Thin checklist progress bar. */
export function ChecklistBar({ task, className }: { task: TaskItem; className?: string }) {
  const list = task.checklist ?? [];
  if (list.length === 0) return null;
  const pct = Math.round((list.filter((c) => c.done).length / list.length) * 100);
  return (
    <div className={cn("h-1.5 bg-muted border border-border overflow-hidden", className)}>
      <div
        className={cn("h-full transition-all", pct >= 100 ? "bg-status-done" : "bg-status-in-progress")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
