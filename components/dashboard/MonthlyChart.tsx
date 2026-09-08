/* eslint-disable @typescript-eslint/no-explicit-any */
// components/dashboard/MonthlyChart.tsx
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
import type { MonthlyTrend } from "@/types";

type TrendPoint = MonthlyTrend & { balance: number };

interface MonthlyChartProps {
  data: TrendPoint[];
}

const formatRupiah = (value: number) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}k`;
  return String(value);
};

const LABELS: Record<string, string> = {
  income: "in",
  expense: "out",
  balance: "balance",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="pixel-box bg-card p-3 text-xs font-mono">
      <p className="font-pixel mb-2" style={{ fontSize: "8px" }}>{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {LABELS[entry.name] ?? entry.name}: Rp {formatRupiah(entry.value)}
        </p>
      ))}
    </div>
  );
};

export default function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <div className="pixel-box bg-card p-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
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
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-foreground" />
            <span className="font-mono text-xs text-muted-foreground">balance</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data} barGap={2} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="2 2" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontFamily: "Space Mono", fontSize: 9, fill: "var(--muted-foreground)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            yAxisId="flow"
            tick={{ fontFamily: "Space Mono", fontSize: 9, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatRupiah(v)}
          />
          <YAxis
            yAxisId="balance"
            orientation="right"
            tick={{ fontFamily: "Space Mono", fontSize: 9, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatRupiah(v)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
          <Bar yAxisId="flow" dataKey="income" fill="var(--burning-flame)" stroke="var(--abyssal)" strokeWidth={1} />
          <Bar yAxisId="flow" dataKey="expense" fill="var(--truffle)" stroke="var(--abyssal)" strokeWidth={1} />
          <Line
            yAxisId="balance"
            type="monotone"
            dataKey="balance"
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
