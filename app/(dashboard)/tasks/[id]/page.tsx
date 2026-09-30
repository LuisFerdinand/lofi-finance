// app/(dashboard)/tasks/[id]/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { getProjectOptions, getTodoById } from "@/utils/projects";
import { toProjectOptions, toTaskItem } from "@/utils/projects-helpers";
import { TaskProvider } from "@/components/tasks/TaskProvider";
import TaskDetail from "@/components/tasks/detail/TaskDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

const uuid = z.string().uuid();

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const session = await auth();
  const { id } = await params;
  if (!session?.user || !uuid.safeParse(id).success) return { title: "Task" };
  const todo = await getTodoById(id, session.user.id);
  return { title: todo ? todo.title : "Task" };
}

export default async function TaskPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  // A malformed id would otherwise reach Postgres as an invalid uuid → 500.
  if (!uuid.safeParse(id).success) notFound();

  const [todo, projectOptions] = await Promise.all([
    getTodoById(id, session.user.id),
    getProjectOptions(session.user.id),
  ]);
  if (!todo) notFound();

  return (
    <TaskProvider initialTasks={[toTaskItem(todo)]} projects={toProjectOptions(projectOptions)}>
      <TaskDetail taskId={todo.id} />
    </TaskProvider>
  );
}
