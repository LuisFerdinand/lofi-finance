/* eslint-disable @typescript-eslint/no-explicit-any */
// components/dashboard/MonthlyChart.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyTrend } from "@/types";

interface MonthlyChartProps {
  data: MonthlyTrend[];
}

const formatRupiah = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="pixel-box bg-card p-3 text-xs font-mono">
      <p className="font-pixel mb-2" style={{ fontSize: "8px" }}>{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: Rp {formatRupiah(entry.value)}
        </p>
      ))}
    </div>
  );
};

export default function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    income: d.income,
    expense: d.expense,
  }));

  return (
    <div className="pixel-box bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-pixel text-xs">6-MONTH TREND</h2>
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-burning-flame border border-abyssal" />
            <span className="font-mono text-xs text-muted-foreground">in</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-truffle border border-abyssal" />
            <span className="font-mono text-xs text-muted-foreground">out</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} barGap={2} barCategoryGap="30%">
          <XAxis
            dataKey="month"
            tick={{ fontFamily: "Space Mono", fontSize: 9, fill: "var(--muted-foreground)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontFamily: "Space Mono", fontSize: 9, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${formatRupiah(v)}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
          <Bar dataKey="income" fill="var(--burning-flame)" stroke="var(--abyssal)" strokeWidth={1} />
          <Bar dataKey="expense" fill="var(--truffle)" stroke="var(--abyssal)" strokeWidth={1} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}