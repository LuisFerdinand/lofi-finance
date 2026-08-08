// components/goals/GoalsDashboardWidget.tsx
import { getGoals } from "@/utils/goals"; // server-only — fine, this is a server component
import { GoalIconDisplay, calcProgress } from "@/utils/goals-helpers";
import { centsToDisplay } from "@/utils";
import type { GoalIcon } from "@/types";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  userId: string;
}

export default async function GoalsDashboardWidget({ userId }: Props) {
  const goals = await getGoals(userId);
  const active = goals
    .filter((g) => g.status === "active")
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
    .slice(0, 3);

  return (
    <div className="pixel-box bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-pixel text-xs">SAVINGS GOALS</h2>
        <Link href="/goals" className="flex items-center gap-1 font-pixel text-xs text-burning-flame hover:underline" style={{ fontSize: "8px" }}>
          ALL <ArrowRight size={10} />
        </Link>
      </div>

      {active.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-2xl mb-2">🐷</p>
          <p className="font-mono text-xs text-muted-foreground">no active goals</p>
          <Link href="/goals" className="inline-block mt-2 font-pixel text-xs text-burning-flame hover:underline" style={{ fontSize: "8px" }}>
            + CREATE GOAL
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {active.map((goal) => {
            const progress = calcProgress(goal.currentAmount, goal.targetAmount);
            return (
              <Link key={goal.id} href={`/goals/${goal.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
              >
                <GoalIconDisplay icon={goal.icon as GoalIcon} size={18} className="shrink-0 text-abyssal" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-mono text-xs font-bold truncate">{goal.name}</p>
                    <span className="font-pixel text-muted-foreground ml-2 shrink-0" style={{ fontSize: "8px" }}>{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted border border-border overflow-hidden">
                    <div className={`h-full transition-all ${progress >= 100 ? "bg-burning-flame" : "bg-blue-fantastic"}`} style={{ width: `${progress}%` }} />
                  </div>
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    {centsToDisplay(goal.currentAmount)} / {centsToDisplay(goal.targetAmount)}
                  </p>
                </div>
                <ArrowRight size={12} className="text-muted-foreground group-hover:text-burning-flame transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}