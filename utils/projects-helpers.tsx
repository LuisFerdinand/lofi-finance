// utils/projects-helpers.tsx
// ⚠️  NO server imports here — this file is safe to import in client components

import type { ChecklistItem } from "@/db/schema/projects";
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
  type LucideIcon,
} from "lucide-react";

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

export type { ChecklistItem };

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

export const STATUS_ORDER = ["open", "in_progress", "on_hold", "done", "cancelled"] as const;
export type TodoStatusKey = (typeof STATUS_ORDER)[number];

export const STATUS_LABELS: Record<TodoStatusKey, string> = {
  open: "OPEN",
  in_progress: "IN PROGRESS",
  on_hold: "ON HOLD",
  done: "DONE",
  cancelled: "CANCELLED",
};

// Pixel-tag color classes per status, shared by list rows, kanban cards, and calendar chips
export const STATUS_STYLE: Record<TodoStatusKey, string> = {
  open: "bg-muted text-foreground",
  in_progress: "bg-blue-fantastic text-palladian",
  on_hold: "bg-oatmeal text-abyssal",
  done: "bg-burning-flame text-abyssal",
  cancelled: "bg-truffle text-palladian",
};

const STATUS_RANK: Record<string, number> = { open: 0, in_progress: 1, on_hold: 2, done: 3, cancelled: 4 };
const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

interface SortableTodo {
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string | Date;
}

// Active stages first (open → in_progress → on_hold), then closed (done/cancelled),
// then by priority (high → low), then soonest due date, then oldest first.
// This is what keeps a long todo list scannable without manual drag-and-drop.
export function sortTodos<T extends SortableTodo>(todos: T[]): T[] {
  return [...todos].sort((a, b) => {
    const statusDiff = (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0);
    if (statusDiff !== 0) return statusDiff;
    const priorityDiff = (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
    if (priorityDiff !== 0) return priorityDiff;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}
