/* eslint-disable @typescript-eslint/no-explicit-any */
// components/tasks/ProductivityChart.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Activity, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Percent } from "lucide-react";
import { cn } from "@/utils";
import { computeTaskStats } from "@/utils/projects-helpers";
import { useTasks } from "./TaskProvider";
import { useToday } from "./useToday";

const LABELS: Record<string, string> = { completed: "done", created: "added" };
const OPEN_KEY = "lofi:taskChartOpen";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="pixel-box bg-card p-3 text-xs font-mono">
      <p className="font-pixel mb-2" style={{ fontSize: "10px" }}>week of {label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {LABELS[entry.name] ?? entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

// Headline task numbers + an 8-week throughput chart, computed from the live
// task store so they move the moment a task is completed or added.
export default function ProductivityChart() {
  const { tasks } = useTasks();
  const today = useToday();
  const stats = useMemo(() => computeTaskStats(tasks, today), [tasks, today]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      // Per-viewer preference, read after mount (no localStorage during SSR).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(OPEN_KEY) === "0") setOpen(false);
    } catch {
      // ignore
    }
  }, []);

  function toggle() {
    setOpen((o) => {
      try {
        localStorage.setItem(OPEN_KEY, o ? "0" : "1");
      } catch {
        // ignore
      }
      return !o;
    });
  }

  const tiles = [
    { label: "ACTIVE", value: String(stats.activeCount), icon: Activity, cls: "bg-status-in-progress text-white" },
    { label: "DONE THIS WEEK", value: String(stats.completedThisWeek), icon: CheckCircle2, cls: "bg-status-done text-white" },
    {
      label: "OVERDUE",
      value: String(stats.overdueCount),
      icon: AlertTriangle,
      cls: stats.overdueCount > 0 ? "bg-due-overdue text-white" : "bg-muted text-foreground",
    },
    { label: "DONE RATE", value: `${stats.completionRate}%`, icon: Percent, cls: "bg-oatmeal text-abyssal" },
  ];

  return (
    <div className="pixel-box bg-card">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-3">
        {tiles.map((t) => (
          <div key={t.label} className={cn("pixel-box-sm p-3", t.cls)}>
            <div className="flex items-center justify-between mb-2 gap-2">
              <p className="font-pixel leading-tight" style={{ fontSize: "9px" }}>
                {t.label}
              </p>
              <t.icon size={15} className="opacity-70 shrink-0" />
            </div>
            <p className="font-pixel text-base">{t.value}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 border-t border-border hover:bg-muted/40 transition-colors"
      >
        <span className="font-pixel" style={{ fontSize: "10px" }}>
          PRODUCTIVITY · 8 WEEKS
        </span>
        <span className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <span className="w-3 h-3 bg-status-done border border-abyssal" /> done
          </span>
          <span className="hidden sm:flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <span className="w-3 h-0.5 bg-foreground" /> added
          </span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <div className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={stats.weekly} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="2 2" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                width={32}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
              <Bar dataKey="completed" fill="var(--status-done)" stroke="var(--abyssal)" strokeWidth={1} />
              <Line
                type="monotone"
                dataKey="created"
                stroke="var(--foreground)"
                strokeWidth={2}
                dot={{ r: 2, fill: "var(--foreground)" }}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
