// app/(dashboard)/goals/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGoals, getGoalsSummary } from "@/utils/goals";
import { centsToDisplay } from "@/utils";
import GoalCard from "@/components/goals/GoalCard";
import AddGoalButton from "@/components/goals/AddGoalButton";

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [goals, summary] = await Promise.all([
    getGoals(session.user.id),
    getGoalsSummary(session.user.id),
  ]);

  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");
  const cancelled = goals.filter((g) => g.status === "cancelled");

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-pixel text-sm leading-relaxed">SAVINGS GOALS</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            {summary.active} active · {summary.completed} completed
          </p>
        </div>
        <AddGoalButton />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "TOTAL SAVED", value: centsToDisplay(summary.totalSaved), bg: "bg-burning-flame", text: "text-abyssal" },
          { label: "TOTAL TARGET", value: centsToDisplay(summary.totalTarget), bg: "bg-blue-fantastic", text: "text-palladian" },
          { label: "ACTIVE", value: String(summary.active), bg: "bg-abyssal", text: "text-burning-flame" },
          { label: "COMPLETED", value: String(summary.completed), bg: "bg-oatmeal", text: "text-abyssal" },
        ].map((s) => (
          <div key={s.label} className={`pixel-box ${s.bg} ${s.text} p-4`}>
            <p className="font-pixel leading-none mb-2" style={{ fontSize: "7px" }}>{s.label}</p>
            <p className="font-pixel text-sm break-all">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="pixel-box bg-card p-12 text-center">
          <p className="text-4xl mb-4">🐷</p>
          <p className="font-pixel text-xs text-muted-foreground mb-2">NO GOALS YET</p>
          <p className="font-mono text-xs text-muted-foreground">
            create your first savings goal to get started
          </p>
        </div>
      )}

      {/* Active goals */}
      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-pixel text-xs text-muted-foreground" style={{ fontSize: "8px" }}>
            ▶ ACTIVE ({active.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {active.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </section>
      )}

      {/* Completed goals */}
      {completed.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-pixel text-xs text-muted-foreground" style={{ fontSize: "8px" }}>
            ✓ COMPLETED ({completed.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {completed.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </section>
      )}

      {/* Cancelled goals */}
      {cancelled.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-pixel text-xs text-muted-foreground" style={{ fontSize: "8px" }}>
            ✕ CANCELLED ({cancelled.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cancelled.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}