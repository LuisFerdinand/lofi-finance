// utils/projects-helpers.tsx
// ⚠️  NO server imports here — this file is safe to import in client components

import type { ChecklistItem, Todo, TodoImage, TodoLink } from "@/db/schema/projects";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import {
  Folder,
  Briefcase,
  Code,
  Rocket,
  Target,
  BookOpen,
  Palette,
  Wrench,
  Globe,
  ShoppingBag,
  Camera,
  Music,
  Dumbbell,
  GraduationCap,
  Heart,
  Star,
  Home,
  Plane,
  ChevronsUp,
  ChevronsDown,
  Equal,
  type LucideIcon,
} from "lucide-react";
import { getLast8Weeks } from "@/utils";

export const PROJECT_ICON_MAP: Record<string, LucideIcon> = {
  folder: Folder,
  briefcase: Briefcase,
  code: Code,
  rocket: Rocket,
  target: Target,
  book: BookOpen,
  palette: Palette,
  wrench: Wrench,
  globe: Globe,
  shopping: ShoppingBag,
  camera: Camera,
  music: Music,
  fitness: Dumbbell,
  graduation: GraduationCap,
  heart: Heart,
  star: Star,
  home: Home,
  plane: Plane,
};

export type ProjectIconKey = keyof typeof PROJECT_ICON_MAP;

export function ProjectIconDisplay({
  icon,
  size = 20,
  className,
}: {
  icon: string;
  size?: number;
  className?: string;
}) {
  const Icon = PROJECT_ICON_MAP[icon] ?? Folder;
  return <Icon size={size} className={className} />;
}

export function calcTodoProgress(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.round((done / total) * 100), 100);
}

export type { ChecklistItem, TodoLink, TodoImage };

// ─── Client-side task shape ──────────────────────────────────────────────────

/**
 * A todo as the task UI works with it: JSON-safe (ISO date strings, so server
 * props and API responses look identical), attachments always as arrays, and
 * the owning project's name/icon attached (null for a standalone task).
 */
export type TaskItem = Omit<
  Todo,
  "createdAt" | "updatedAt" | "completedAt" | "link" | "imageUrl"
> & {
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  projectName: string | null;
  projectIcon: string | null;
};

export type ProjectOption = { id: string; name: string; icon: string; archived?: boolean };

export type TaskView = "list" | "board" | "calendar";

/** `?view=` → TaskView. Lives here (not in the client workspace component)
 *  because server pages call it. */
export function parseTaskView(v: string | undefined): TaskView {
  return v === "board" || v === "calendar" ? v : "list";
}

export function toProjectOptions(
  rows: { id: string; name: string; icon: string; status: string }[]
): ProjectOption[] {
  return rows.map((p) => ({ id: p.id, name: p.name, icon: p.icon, archived: p.status === "archived" }));
}

type RawTodo = Omit<Todo, "createdAt" | "updatedAt" | "completedAt" | "links" | "images" | "sortOrder"> & {
  createdAt: Date | string;
  updatedAt: Date | string;
  completedAt: Date | string | null;
  links?: TodoLink[] | null;
  images?: TodoImage[] | null;
  sortOrder?: number | null;
  projectName?: string | null;
  projectIcon?: string | null;
};

const iso = (d: Date | string) => (typeof d === "string" ? d : d.toISOString());

/** Normalize a DB row / API response into a TaskItem. Folds the legacy single
 *  `link` / `imageUrl` columns into the arrays so older tasks keep them. */
export function toTaskItem(raw: RawTodo, project?: { name: string; icon: string } | null): TaskItem {
  const { link, imageUrl, ...rest } = raw;
  const links = [...(raw.links ?? [])];
  if (link && !links.some((l) => l.url === link)) {
    links.unshift({ id: `legacy-link-${raw.id}`, label: hostLabel(link), url: link });
  }
  const images = [...(raw.images ?? [])];
  if (imageUrl && !images.some((i) => i.url === imageUrl)) {
    images.unshift({ id: `legacy-img-${raw.id}`, url: imageUrl });
  }
  return {
    ...rest,
    checklist: raw.checklist ?? [],
    links,
    images,
    sortOrder: raw.sortOrder ?? null,
    createdAt: iso(raw.createdAt),
    updatedAt: iso(raw.updatedAt),
    completedAt: raw.completedAt ? iso(raw.completedAt) : null,
    projectName: project ? project.name : raw.projectName ?? null,
    projectIcon: project ? project.icon : raw.projectIcon ?? null,
  };
}

/** "github.com" from "https://www.github.com/foo" — a fallback link label. */
export function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Accept "figma.com/x" as well as full URLs; returns null if not http(s). */
export function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".") && u.hostname !== "localhost") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * A single task's completion %. Driven by its checklist when it has one,
 * otherwise it's simply 0 or 100 based on the task's own status.
 */
export function todoProgress(todo: {
  status: string;
  checklist?: ChecklistItem[] | null;
}): number {
  const items = todo.checklist ?? [];
  if (items.length > 0) {
    const done = items.filter((i) => i.done).length;
    return calcTodoProgress(done, items.length);
  }
  return todo.status === "done" ? 100 : 0;
}

// ─── Status ──────────────────────────────────────────────────────────────────

export const STATUS_ORDER = ["open", "in_progress", "on_hold", "done", "cancelled"] as const;
export type TodoStatusKey = (typeof STATUS_ORDER)[number];
export const ACTIVE_STATUSES: readonly TodoStatusKey[] = ["open", "in_progress", "on_hold"];

export const STATUS_LABELS: Record<TodoStatusKey, string> = {
  open: "TO DO",
  in_progress: "IN PROGRESS",
  on_hold: "ON HOLD",
  done: "DONE",
  cancelled: "CANCELLED",
};

/**
 * Color tokens per stage (see --status-* in globals.css). Kept to four uses so
 * the UI stays calm: `solid` for the one status pill, `dot` for small markers,
 * `edge` for a card/row's left border, `tint` for a faint column/group wash.
 */
export const STATUS_COLOR: Record<
  TodoStatusKey,
  { solid: string; dot: string; edge: string; tint: string; text: string; bar: string }
> = {
  open: {
    solid: "bg-status-open text-white",
    dot: "bg-status-open",
    edge: "border-l-status-open",
    tint: "bg-status-open/[0.07]",
    text: "text-status-open",
    bar: "border-t-status-open",
  },
  in_progress: {
    solid: "bg-status-in-progress text-white",
    dot: "bg-status-in-progress",
    edge: "border-l-status-in-progress",
    tint: "bg-status-in-progress/[0.07]",
    text: "text-status-in-progress",
    bar: "border-t-status-in-progress",
  },
  on_hold: {
    solid: "bg-status-on-hold text-white",
    dot: "bg-status-on-hold",
    edge: "border-l-status-on-hold",
    tint: "bg-status-on-hold/[0.07]",
    text: "text-status-on-hold",
    bar: "border-t-status-on-hold",
  },
  done: {
    solid: "bg-status-done text-white",
    dot: "bg-status-done",
    edge: "border-l-status-done",
    tint: "bg-status-done/[0.07]",
    text: "text-status-done",
    bar: "border-t-status-done",
  },
  cancelled: {
    solid: "bg-status-cancelled text-white",
    dot: "bg-status-cancelled",
    edge: "border-l-status-cancelled",
    tint: "bg-status-cancelled/[0.07]",
    text: "text-status-cancelled",
    bar: "border-t-status-cancelled",
  },
};

// ─── Priority ────────────────────────────────────────────────────────────────

export const PRIORITY_ORDER = ["high", "medium", "low"] as const;
export type PriorityKey = (typeof PRIORITY_ORDER)[number];

/** Jira-style: a colored arrow icon rather than another filled badge. */
export const PRIORITY_META: Record<PriorityKey, { label: string; icon: LucideIcon; text: string }> = {
  high: { label: "HIGH", icon: ChevronsUp, text: "text-prio-high" },
  medium: { label: "MEDIUM", icon: Equal, text: "text-prio-medium" },
  low: { label: "LOW", icon: ChevronsDown, text: "text-prio-low" },
};

export function PriorityIcon({
  priority,
  size = 14,
  className,
}: {
  priority: string;
  size?: number;
  className?: string;
}) {
  const meta = PRIORITY_META[priority as PriorityKey] ?? PRIORITY_META.medium;
  const Icon = meta.icon;
  return (
    <Icon
      size={size}
      strokeWidth={2.75}
      className={`${meta.text} shrink-0 ${className ?? ""}`}
      aria-label={`${meta.label.toLowerCase()} priority`}
    />
  );
}

// ─── Due dates ───────────────────────────────────────────────────────────────

export type DueTone = "overdue" | "today" | "soon" | "later" | "closed";

/**
 * How urgent a due date is relative to `today` (local "yyyy-MM-dd"). Closed
 * tasks are never urgent. `label` is short enough for a card chip.
 */
export function dueInfo(
  dueDate: string | null,
  today: string,
  status?: string
): { tone: DueTone; label: string; long: string } | null {
  if (!dueDate) return null;
  const nice = format(parseISO(dueDate), "d MMM");
  if (status === "done" || status === "cancelled") return { tone: "closed", label: nice, long: nice };
  const diff = differenceInCalendarDays(parseISO(dueDate), parseISO(today));
  if (diff < 0) return { tone: "overdue", label: nice, long: `${-diff}d overdue · ${nice}` };
  if (diff === 0) return { tone: "today", label: "today", long: "due today" };
  if (diff === 1) return { tone: "soon", label: "tomorrow", long: "due tomorrow" };
  if (diff <= 3) return { tone: "soon", label: nice, long: `in ${diff} days · ${nice}` };
  return { tone: "later", label: nice, long: `in ${diff} days · ${nice}` };
}

export const DUE_TONE_CLASS: Record<DueTone, string> = {
  overdue: "text-due-overdue font-bold",
  today: "text-due-soon font-bold",
  soon: "text-due-soon",
  later: "text-muted-foreground",
  closed: "text-muted-foreground",
};

// ─── Sorting ─────────────────────────────────────────────────────────────────

const STATUS_RANK: Record<string, number> = { open: 0, in_progress: 1, on_hold: 2, done: 3, cancelled: 4 };
const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

interface SortableTodo {
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string | Date;
}

/** Priority (high → low), then soonest due date, then oldest first. */
export function compareByPriority(a: SortableTodo, b: SortableTodo): number {
  const priorityDiff = (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
  if (priorityDiff !== 0) return priorityDiff;
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate && !b.dueDate) return -1;
  if (b.dueDate && !a.dueDate) return 1;
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

// Active stages first (open → in_progress → on_hold), then closed (done/cancelled),
// then by priority (high → low), then soonest due date, then oldest first.
export function sortTodos<T extends SortableTodo>(todos: T[]): T[] {
  return [...todos].sort((a, b) => {
    const statusDiff = (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0);
    if (statusDiff !== 0) return statusDiff;
    return compareByPriority(a, b);
  });
}

/** Board column order: manually ranked cards first (by rank), then the rest
 *  in the default priority/due-date order. */
export function compareBoard(
  a: SortableTodo & { sortOrder: number | null },
  b: SortableTodo & { sortOrder: number | null }
): number {
  if (a.sortOrder != null && b.sortOrder != null) return a.sortOrder - b.sortOrder;
  if (a.sortOrder != null) return -1;
  if (b.sortOrder != null) return 1;
  return compareByPriority(a, b);
}

export const RANK_STEP = 1024;

/**
 * Rank for a card dropped between `prev` and `next` (either may be missing).
 * Returns null when a neighbour is unranked — the caller then renumbers the
 * whole column once, after which every later drop is a single-row update.
 */
export function rankBetween(
  prev: { sortOrder: number | null } | undefined,
  next: { sortOrder: number | null } | undefined
): number | null {
  if (prev && prev.sortOrder == null) return null;
  if (next && next.sortOrder == null) return null;
  const p = prev?.sortOrder;
  const n = next?.sortOrder;
  if (p == null && n == null) return RANK_STEP;
  if (p == null) return n! - RANK_STEP;
  if (n == null) return p + RANK_STEP;
  const mid = (p + n) / 2;
  // Floating-point gap exhausted after ~50 bisections — renumber instead.
  if (mid === p || mid === n) return null;
  return mid;
}

// ─── Stats (computed client-side from the loaded tasks, so they update live) ─

export interface TaskStats {
  activeCount: number;
  completedThisWeek: number;
  overdueCount: number;
  completionRate: number; // done / (done + active), all-time, as a %
  weekly: { label: string; completed: number; created: number }[];
}

export function computeTaskStats(tasks: TaskItem[], today: string): TaskStats {
  const weeks = getLast8Weeks();
  const weekIndex = (d: Date) => {
    const key = format(d, "yyyy-MM-dd");
    for (let i = weeks.length - 1; i >= 0; i--) if (key >= weeks[i].start) return i;
    return -1;
  };
  const weekly = weeks.map((w) => ({ label: w.label, completed: 0, created: 0 }));

  let active = 0;
  let done = 0;
  let overdue = 0;
  for (const t of tasks) {
    const isActive = (ACTIVE_STATUSES as readonly string[]).includes(t.status);
    if (isActive) active++;
    if (t.status === "done") done++;
    if (isActive && t.dueDate && t.dueDate < today) overdue++;

    const ci = weekIndex(new Date(t.createdAt));
    if (ci >= 0) weekly[ci].created++;
    if (t.completedAt && t.status === "done") {
      const di = weekIndex(new Date(t.completedAt));
      if (di >= 0) weekly[di].completed++;
    }
  }

  return {
    activeCount: active,
    completedThisWeek: weekly[weekly.length - 1]?.completed ?? 0,
    overdueCount: overdue,
    completionRate: done + active > 0 ? Math.round((done / (done + active)) * 100) : 0,
    weekly,
  };
}
