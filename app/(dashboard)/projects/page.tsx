// app/(dashboard)/projects/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProjectsWithProgress } from "@/utils/projects";
import ProjectCard from "@/components/projects/ProjectCard";
import AddProjectButton from "@/components/projects/AddProjectButton";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const projects = await getProjectsWithProgress(session.user.id);
  const active = projects.filter((p) => p.status === "active");
  const completed = projects.filter((p) => p.status === "completed");
  const archived = projects.filter((p) => p.status === "archived");

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-pixel text-sm leading-relaxed">PROJECTS</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            {active.length} active · {completed.length} completed
          </p>
        </div>
        <AddProjectButton />
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="pixel-box bg-card p-12 text-center">
          <p className="font-pixel text-xs text-muted-foreground mb-2">NO PROJECTS YET</p>
          <p className="font-mono text-xs text-muted-foreground">
            create a project to start tracking its own todo list
          </p>
        </div>
      )}

      {/* Active projects */}
      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-pixel text-xs text-muted-foreground" style={{ fontSize: "8px" }}>
            ▶ ACTIVE ({active.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {active.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      {/* Completed projects */}
      {completed.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-pixel text-xs text-muted-foreground" style={{ fontSize: "8px" }}>
            ✓ COMPLETED ({completed.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {completed.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      {/* Archived projects */}
      {archived.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-pixel text-xs text-muted-foreground" style={{ fontSize: "8px" }}>
            ARCHIVED ({archived.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {archived.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
