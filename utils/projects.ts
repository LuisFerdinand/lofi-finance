// utils/projects.ts
import "server-only"; // prevents DB code leaking into client bundles
import { db } from "@/db";
import { projects, todos } from "@/db/schema/projects";
import { eq, and, desc, asc, ilike, sql } from "drizzle-orm";
import type { Project, Todo } from "@/db/schema/projects";

export type ProjectWithProgress = Project & { todoTotal: number; todoDone: number };

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
