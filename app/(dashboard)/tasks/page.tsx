// app/(dashboard)/tasks/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllTodos, getTaskStats } from "@/utils/projects";
import ProductivityChart from "@/components/tasks/ProductivityChart";
import TaskListView from "@/components/tasks/TaskListView";
import SendTestReminderButton from "@/components/tasks/SendTestReminderButton";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [todos, stats] = await Promise.all([
    getAllTodos(session.user.id),
    getTaskStats(session.user.id),
  ]);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-pixel text-sm leading-relaxed">TASKS</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            {stats.activeCount} active · {todos.length} total across all projects
          </p>
        </div>
        <SendTestReminderButton />
      </div>

      <div className="grid gap-5 2xl:grid-cols-[1fr_minmax(380px,440px)] items-start">
        <div className="2xl:order-2 2xl:sticky 2xl:top-0">
          <ProductivityChart stats={stats} />
        </div>
        <div className="2xl:order-1 min-w-0">
          <TaskListView todos={todos} />
        </div>
      </div>
    </div>
  );
}
