// utils/projects.ts
import "server-only"; // prevents DB code leaking into client bundles
import { db } from "@/db";
import { projects, todos } from "@/db/schema/projects";
import { eq, and, desc, asc, ilike, sql, getTableColumns } from "drizzle-orm";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";
import type { ChecklistItem, Project, Todo, TodoImage, TodoLink } from "@/db/schema/projects";

export type ProjectWithProgress = Project & { todoTotal: number; todoDone: number };
// projectName/projectIcon are null for a standalone task (no project attached).
export type TodoWithProject = Todo & { projectName: string | null; projectIcon: string | null };

type TodoStatus = "open" | "in_progress" | "on_hold" | "done" | "cancelled";

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

/** Lightweight list for pickers (move-to-project, quick-add). Archived last. */
export async function getProjectOptions(
  userId: string
): Promise<{ id: string; name: string; icon: string; status: Project["status"] }[]> {
  return db
    .select({ id: projects.id, name: projects.name, icon: projects.icon, status: projects.status })
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(
      sql`case ${projects.status} when 'active' then 0 when 'completed' then 1 else 2 end`,
      asc(projects.name)
    );
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

/** Returns null when the project doesn't exist or isn't the user's. */
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
): Promise<Project | null> {
  const [project] = await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();
  return project ?? null;
}

export async function deleteProject(id: string, userId: string): Promise<boolean> {
  const rows = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning({ id: projects.id });
  return rows.length > 0;
}

export async function getTodos(
  projectId: string,
  userId: string,
  filters?: { status?: TodoStatus; search?: string }
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

/** One todo with its project's name/icon, or null if it isn't the user's. */
export async function getTodoById(id: string, userId: string): Promise<TodoWithProject | null> {
  const [row] = await db
    .select({
      ...getTableColumns(todos),
      projectName: projects.name,
      projectIcon: projects.icon,
    })
    .from(todos)
    .leftJoin(projects, eq(todos.projectId, projects.id))
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createTodo(data: {
  // Omitted (or null) creates a standalone task with no project.
  projectId?: string | null;
  userId: string;
  title: string;
  notes?: string;
  status?: TodoStatus;
  priority?: "low" | "medium" | "high";
  dueDate?: string | null;
}): Promise<Todo> {
  const [todo] = await db
    .insert(todos)
    .values({ ...data, completedAt: data.status === "done" ? new Date() : null })
    .returning();
  return todo;
}

export type TodoUpdate = Partial<{
  title: string;
  notes: string | null;
  imageUrl: string | null;
  link: string | null;
  links: TodoLink[];
  images: TodoImage[];
  checklist: ChecklistItem[];
  status: TodoStatus;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  projectId: string | null;
  sortOrder: number | null;
}>;

/** Returns null when the todo doesn't exist or isn't the user's. */
export async function updateTodo(id: string, userId: string, data: TodoUpdate): Promise<Todo | null> {
  const { status, ...rest } = data;
  const patch: PgUpdateSetSource<typeof todos> = { ...rest, updatedAt: new Date() };
  if (status) {
    patch.status = status;
    // completedAt marks the moment a task *became* done — keep the original
    // timestamp when an already-done task is re-saved (the detail page sends
    // its status with every save), clear it for every other stage.
    patch.completedAt =
      status === "done"
        ? sql`case when ${todos.status} = 'done' then coalesce(${todos.completedAt}, now()) else now() end`
        : null;
  }

  const [todo] = await db
    .update(todos)
    .set(patch)
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .returning();
  return todo ?? null;
}

export async function deleteTodo(id: string, userId: string): Promise<boolean> {
  const rows = await db
    .delete(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .returning({ id: todos.id });
  return rows.length > 0;
}

// ─── Cross-project task views ────────────────────────────────────────────────

/**
 * Every todo the user owns, with its project's name + icon (null for a
 * standalone task with no project), ordered the same way sortTodos() orders a
 * single list (active stages → priority → due date). Powers the "Tasks" page
 * and the daily reminder email.
 */
export async function getAllTodos(userId: string): Promise<TodoWithProject[]> {
  return db
    .select({
      ...getTableColumns(todos),
      projectName: projects.name,
      projectIcon: projects.icon,
    })
    .from(todos)
    .leftJoin(projects, eq(todos.projectId, projects.id))
    .where(eq(todos.userId, userId))
    .orderBy(
      sql`case ${todos.status} when 'open' then 0 when 'in_progress' then 1 when 'on_hold' then 2 when 'done' then 3 else 4 end`,
      sql`case ${todos.priority} when 'high' then 0 when 'medium' then 1 else 2 end`,
      sql`${todos.dueDate} asc nulls last`,
      asc(todos.createdAt)
    );
}
