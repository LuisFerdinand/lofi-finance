/* eslint-disable @typescript-eslint/no-explicit-any */
// components/tasks/ProductivityChart.tsx
"use client";

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
import { Activity, CheckCircle2, AlertTriangle, Percent } from "lucide-react";
import type { TaskStats } from "@/utils/projects";

const LABELS: Record<string, string> = { completed: "done", created: "added" };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="pixel-box bg-card p-3 text-xs font-mono">
      <p className="font-pixel mb-2" style={{ fontSize: "8px" }}>week of {label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {LABELS[entry.name] ?? entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function ProductivityChart({ stats }: { stats: TaskStats }) {
  const tiles = [
    { label: "ACTIVE NOW", value: String(stats.activeCount), icon: Activity, bg: "bg-blue-fantastic", text: "text-palladian" },
    { label: "DONE / WK", value: String(stats.completedThisWeek), icon: CheckCircle2, bg: "bg-burning-flame", text: "text-abyssal" },
    { label: "OVERDUE", value: String(stats.overdueCount), icon: AlertTriangle, bg: stats.overdueCount > 0 ? "bg-truffle" : "bg-muted", text: stats.overdueCount > 0 ? "text-palladian" : "text-foreground" },
    { label: "DONE RATE", value: `${stats.completionRate}%`, icon: Percent, bg: "bg-oatmeal", text: "text-abyssal" },
  ];

  return (
    <div className="pixel-box bg-card p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-pixel text-xs">PRODUCTIVITY</h2>
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-burning-flame border border-abyssal" />
            <span className="font-mono text-xs text-muted-foreground">done</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-foreground" />
            <span className="font-mono text-xs text-muted-foreground">added</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className={`pixel-box-sm ${t.bg} ${t.text} p-3`}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-pixel leading-none" style={{ fontSize: "7px" }}>{t.label}</p>
              <t.icon size={12} className="opacity-60" />
            </div>
            <p className="font-pixel text-sm">{t.value}</p>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={stats.weekly} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="2 2" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontFamily: "Space Mono", fontSize: 9, fill: "var(--muted-foreground)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontFamily: "Space Mono", fontSize: 9, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
          <Bar dataKey="completed" fill="var(--burning-flame)" stroke="var(--abyssal)" strokeWidth={1} />
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
  );
}
