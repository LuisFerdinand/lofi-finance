// app/(dashboard)/projects/[id]/page.tsx
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getProjectById, getTodos } from "@/utils/projects";
import { calcTodoProgress, ProjectIconDisplay } from "@/utils/projects-helpers";
import TodoList from "@/components/projects/TodoList";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const [project, todos] = await Promise.all([
    getProjectById(id, session.user.id),
    getTodos(id, session.user.id),
  ]);

  if (!project) notFound();

  const total = todos.length;
  const done = todos.filter((t) => t.status === "done").length;
  const progress = calcTodoProgress(done, total);

  return (
    <div className="space-y-5 animate-slide-up">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 font-pixel text-xs text-muted-foreground hover:text-burning-flame transition-colors"
        style={{ fontSize: "8px" }}
      >
        <ArrowLeft size={10} /> BACK TO PROJECTS
      </Link>

      {/* Header band — spans the full width, name on the left, progress on the right */}
      <div className="pixel-box bg-card p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="pixel-box-sm bg-burning-flame text-abyssal flex items-center justify-center shrink-0 p-2.5">
            <ProjectIconDisplay icon={project.icon} size={22} />
          </div>
          <div className="min-w-0">
            <h1 className="font-pixel text-xs truncate">{project.name}</h1>
            {project.description && (
              <p className="font-mono text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
            )}
          </div>
        </div>

        <div className="sm:w-72 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-xs text-muted-foreground">{done} / {total} tasks</span>
            <span className="font-pixel" style={{ fontSize: "9px" }}>{progress}%</span>
          </div>
          <div className="h-3 bg-muted border-2 border-abyssal overflow-hidden">
            <div
              className={`h-full transition-all ${progress >= 100 && total > 0 ? "bg-burning-flame" : "bg-blue-fantastic"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <TodoList projectId={project.id} todos={todos} />
    </div>
  );
}
