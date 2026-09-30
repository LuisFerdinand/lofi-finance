// app/(dashboard)/projects/[id]/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { getProjectById, getProjectOptions, getTodos } from "@/utils/projects";
import { parseTaskView, toProjectOptions, toTaskItem } from "@/utils/projects-helpers";
import { TaskProvider } from "@/components/tasks/TaskProvider";
import TaskWorkspace from "@/components/tasks/TaskWorkspace";
import ProjectHeader from "@/components/projects/ProjectHeader";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}

const uuid = z.string().uuid();

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const session = await auth();
  const { id } = await params;
  if (!session?.user || !uuid.safeParse(id).success) return { title: "Project" };
  const project = await getProjectById(id, session.user.id);
  return { title: project?.name ?? "Project" };
}

export default async function ProjectDetailPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  // A malformed id would otherwise reach Postgres as an invalid uuid → 500.
  if (!uuid.safeParse(id).success) notFound();

  const [project, todos, projectOptions, sp] = await Promise.all([
    getProjectById(id, session.user.id),
    getTodos(id, session.user.id),
    getProjectOptions(session.user.id),
    searchParams,
  ]);
  if (!project) notFound();

  const tasks = todos.map((t) => toTaskItem(t, { name: project.name, icon: project.icon }));

  return (
    <TaskProvider initialTasks={tasks} projects={toProjectOptions(projectOptions)} scopeProjectId={project.id}>
      <div className="space-y-4 animate-slide-up">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 font-pixel text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontSize: "10px" }}
        >
          <ArrowLeft size={13} /> ALL PROJECTS
        </Link>

        <ProjectHeader
          project={{
            id: project.id,
            name: project.name,
            description: project.description,
            icon: project.icon,
            status: project.status,
          }}
        />

        <TaskWorkspace
          initialView={parseTaskView(sp.view)}
          showProject={false}
          emptyHint="no tasks yet — add the first one above"
        />
      </div>
    </TaskProvider>
  );
}
