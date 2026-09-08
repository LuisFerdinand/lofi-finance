// utils/projects.ts
import "server-only"; // prevents DB code leaking into client bundles
import { db } from "@/db";
import { projects, todos } from "@/db/schema/projects";
import {
  eq,
  and,
  desc,
  asc,
  ilike,
  sql,
  gte,
  lt,
  isNotNull,
  inArray,
  count,
  getTableColumns,
} from "drizzle-orm";
import { getLast8Weeks } from "@/utils";
import type { ChecklistItem, Project, Todo } from "@/db/schema/projects";

export type ProjectWithProgress = Project & { todoTotal: number; todoDone: number };
export type TodoWithProject = Todo & { projectName: string; projectIcon: string };

const ACTIVE_STATUSES = ["open", "in_progress", "on_hold"] as const;

export async function getProjectsWithProgress(userId: string): Promise<ProjectWithProgress[]> {
  return db
    .select({
      id: projects.id,
      userId: projects.userId,
      name: projects.name,
      description: projects.description,
      icon: projects.icon,
      status: projects.status,
      isPinned: projects.isPinned,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      todoTotal: sql<number>`count(${todos.id})::int`,
      todoDone: sql<number>`count(${todos.id}) filter (where ${todos.status} = 'done')::int`,
    })
    .from(projects)
    .leftJoin(todos, eq(todos.projectId, projects.id))
    .where(eq(projects.userId, userId))
    .groupBy(projects.id)
    .orderBy(desc(projects.isPinned), desc(projects.createdAt));
}

export async function getProjectById(id: string, userId: string): Promise<Project | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .limit(1);
  return project ?? null;
}

export async function createProject(data: {
  userId: string;
  name: string;
  description?: string;
  icon?: string;
}): Promise<Project> {
  const [project] = await db.insert(projects).values(data).returning();
  return project;
}

export async function updateProject(
  id: string,
  userId: string,
  data: Partial<{
    name: string;
    description: string | null;
    icon: string;
    status: "active" | "completed" | "archived";
    isPinned: boolean;
  }>
): Promise<Project> {
  const [project] = await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();
  return project;
}

export async function deleteProject(id: string, userId: string): Promise<void> {
  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

export async function getTodos(
  projectId: string,
  userId: string,
  filters?: { status?: "open" | "in_progress" | "on_hold" | "done" | "cancelled"; search?: string }
): Promise<Todo[]> {
  const conditions = [eq(todos.projectId, projectId), eq(todos.userId, userId)];
  if (filters?.status) conditions.push(eq(todos.status, filters.status));
  if (filters?.search) conditions.push(ilike(todos.title, `%${filters.search}%`));

  return db
    .select()
    .from(todos)
    .where(and(...conditions))
    .orderBy(asc(todos.createdAt));
}

export async function createTodo(data: {
  projectId: string;
  userId: string;
  title: string;
  notes?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
}): Promise<Todo> {
  const [todo] = await db.insert(todos).values(data).returning();
  return todo;
}

export async function updateTodo(
  id: string,
  userId: string,
  data: Partial<{
    title: string;
    notes: string | null;
    imageUrl: string | null;
    link: string | null;
    checklist: ChecklistItem[];
    status: "open" | "in_progress" | "on_hold" | "done" | "cancelled";
    priority: "low" | "medium" | "high";
    dueDate: string | null;
  }>
): Promise<Todo> {
  const patch: Partial<typeof todos.$inferInsert> & { updatedAt: Date } = {
    ...data,
    updatedAt: new Date(),
  };
  // completedAt only reflects the "done" stage — clear it for every other status
  if (data.status) patch.completedAt = data.status === "done" ? new Date() : null;

  const [todo] = await db
    .update(todos)
    .set(patch)
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .returning();
  return todo;
}

export async function deleteTodo(id: string, userId: string): Promise<void> {
  await db.delete(todos).where(and(eq(todos.id, id), eq(todos.userId, userId)));
}

// ─── Cross-project task views ────────────────────────────────────────────────

/**
 * Every todo the user owns, with its project's name + icon, ordered the same
 * way sortTodos() orders a single list (active stages → priority → due date).
 * Powers the "My Tasks" page.
 */
export async function getAllTodos(userId: string): Promise<TodoWithProject[]> {
  return db
    .select({
      ...getTableColumns(todos),
      projectName: projects.name,
      projectIcon: projects.icon,
    })
    .from(todos)
    .innerJoin(projects, eq(todos.projectId, projects.id))
    .where(eq(todos.userId, userId))
    .orderBy(
      sql`case ${todos.status} when 'open' then 0 when 'in_progress' then 1 when 'on_hold' then 2 when 'done' then 3 else 4 end`,
      sql`case ${todos.priority} when 'high' then 0 when 'medium' then 1 else 2 end`,
      sql`${todos.dueDate} asc nulls last`,
      asc(todos.createdAt)
    );
}

export interface TaskStats {
  activeCount: number;
  completedThisWeek: number;
  overdueCount: number;
  completionRate: number; // done / (done + active), all-time, as a %
  weekly: { label: string; completed: number; created: number }[];
}

/**
 * Headline task numbers + an 8-week throughput series (tasks completed vs
 * created each week) for the productivity chart.
 */
export async function getTaskStats(userId: string): Promise<TaskStats> {
  const weeks = getLast8Weeks();
  const windowStart = new Date(`${weeks[0].start}T00:00:00Z`);
  const today = new Date().toISOString().slice(0, 10);

  const completedWeek = sql<string>`to_char(date_trunc('week', ${todos.completedAt}), 'YYYY-MM-DD')`;
  const createdWeek = sql<string>`to_char(date_trunc('week', ${todos.createdAt}), 'YYYY-MM-DD')`;

  const [statusRows, completedRows, createdRows, overdueRows] = await Promise.all([
    db
      .select({ status: todos.status, c: count() })
      .from(todos)
      .where(eq(todos.userId, userId))
      .groupBy(todos.status),
    db
      .select({ wk: completedWeek, c: count() })
      .from(todos)
      .where(
        and(
          eq(todos.userId, userId),
          isNotNull(todos.completedAt),
          gte(todos.completedAt, windowStart)
        )
      )
      .groupBy(completedWeek),
    db
      .select({ wk: createdWeek, c: count() })
      .from(todos)
      .where(and(eq(todos.userId, userId), gte(todos.createdAt, windowStart)))
      .groupBy(createdWeek),
    db
      .select({ c: count() })
      .from(todos)
      .where(
        and(
          eq(todos.userId, userId),
          isNotNull(todos.dueDate),
          lt(todos.dueDate, today),
          inArray(todos.status, [...ACTIVE_STATUSES])
        )
      ),
  ]);

  let done = 0;
  let active = 0;
  for (const row of statusRows) {
    const n = Number(row.c);
    if (row.status === "done") done = n;
    else if ((ACTIVE_STATUSES as readonly string[]).includes(row.status)) active += n;
  }

  const completedMap = new Map(completedRows.map((r) => [r.wk, Number(r.c)]));
  const createdMap = new Map(createdRows.map((r) => [r.wk, Number(r.c)]));
  const weekly = weeks.map((w) => ({
    label: w.label,
    completed: completedMap.get(w.start) ?? 0,
    created: createdMap.get(w.start) ?? 0,
  }));

  return {
    activeCount: active,
    completedThisWeek: weekly[weekly.length - 1]?.completed ?? 0,
    overdueCount: Number(overdueRows[0]?.c ?? 0),
    completionRate: done + active > 0 ? Math.round((done / (done + active)) * 100) : 0,
    weekly,
  };
}
