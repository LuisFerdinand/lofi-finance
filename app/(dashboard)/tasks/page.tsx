// app/(dashboard)/tasks/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllTodos, getProjectOptions } from "@/utils/projects";
import { parseTaskView, toProjectOptions, toTaskItem } from "@/utils/projects-helpers";
import { TaskProvider } from "@/components/tasks/TaskProvider";
import TaskWorkspace from "@/components/tasks/TaskWorkspace";
import ProductivityChart from "@/components/tasks/ProductivityChart";
import SendTestReminderButton from "@/components/tasks/SendTestReminderButton";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [todos, projectOptions, params] = await Promise.all([
    getAllTodos(session.user.id),
    getProjectOptions(session.user.id),
    searchParams,
  ]);
  const tasks = todos.map((t) => toTaskItem(t));
  const projects = toProjectOptions(projectOptions);

  return (
    <TaskProvider initialTasks={tasks} projects={projects}>
      <div className="space-y-5 animate-slide-up">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-pixel text-sm leading-relaxed">TASKS</h1>
            <p className="font-mono text-sm text-muted-foreground mt-1">
              everything on your plate, across every project
            </p>
          </div>
          <SendTestReminderButton />
        </div>

        <ProductivityChart />

        <TaskWorkspace
          initialView={parseTaskView(params.view)}
          showProject
          emptyHint="no tasks yet — add one above, or open a project to plan its work"
        />
      </div>
    </TaskProvider>
  );
}
