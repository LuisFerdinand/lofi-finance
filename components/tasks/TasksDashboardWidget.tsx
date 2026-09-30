"use client";
// components/tasks/TasksDashboardWidget.tsx
// Server component — the dashboard's "what needs attention" card.
import Link from "next/link";
import { ArrowRight, Coffee } from "lucide-react";
import { getAllTodos } from "@/utils/projects";
import { todayInTimeZone } from "@/utils";
import {
  ACTIVE_STATUSES,
  PriorityIcon,
  compareByPriority,
  dueInfo,
  toTaskItem,
} from "@/utils/projects-helpers";
import { DueChip, ProjectChip, StatusDot } from "./TaskBits";

const SHOWN = 6;

export default async function TasksDashboardWidget({ userId }: { userId: string }) {
  const today = todayInTimeZone();
  const tasks = (await getAllTodos(userId))
    .map((t) => toTaskItem(t))
    .filter((t) => (ACTIVE_STATUSES as readonly string[]).includes(t.status));

  const tone = (t: (typeof tasks)[number]) => dueInfo(t.dueDate, today, t.status)?.tone;
  const overdue = tasks.filter((t) => tone(t) === "overdue").length;
  const dueToday = tasks.filter((t) => tone(t) === "today").length;

  // Most urgent first: overdue → today → soon → later → undated, then priority.
  const rank = { overdue: 0, today: 1, soon: 2, later: 3 } as Record<string, number>;
  const focus = [...tasks]
    .sort((a, b) => (rank[tone(a) ?? ""] ?? 4) - (rank[tone(b) ?? ""] ?? 4) || compareByPriority(a, b))
    .slice(0, SHOWN);

  return (
    <div className="pixel-box bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-pixel text-xs">FOCUS</h2>
        <Link
          href="/tasks"
          className="flex items-center gap-1 font-pixel text-burning-flame-ink hover:underline"
          style={{ fontSize: "10px" }}
        >
          ALL TASKS <ArrowRight size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-3 border-b border-border text-center">
        {[
          { label: "OVERDUE", value: overdue, cls: overdue > 0 ? "text-due-overdue" : "" },
          { label: "TODAY", value: dueToday, cls: dueToday > 0 ? "text-due-soon" : "" },
          { label: "ACTIVE", value: tasks.length, cls: "" },
        ].map((s) => (
          <div key={s.label} className="py-2.5 border-r border-border last:border-r-0">
            <p className={`font-pixel text-sm ${s.cls}`}>{s.value}</p>
            <p className="font-pixel text-muted-foreground mt-1" style={{ fontSize: "8px" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {focus.length === 0 ? (
        <div className="p-6 text-center space-y-2">
          <Coffee size={22} className="mx-auto text-muted-foreground" />
          <p className="font-mono text-sm text-muted-foreground">nothing on your plate — enjoy it</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {focus.map((t) => (
            <li key={t.id}>
              <Link
                href={`/tasks/${t.id}`}
                prefetch={false}
                className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-muted/40 transition-colors"
              >
                <PriorityIcon priority={t.priority} size={15} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm truncate">{t.title}</p>
                  <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap mt-0.5">
                    <ProjectChip name={t.projectName} icon={t.projectIcon} className="max-w-[160px]" />
                    <DueChip dueDate={t.dueDate} status={t.status} today={today} />
                  </div>
                </div>
                <StatusDot status={t.status} className="mt-1.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
