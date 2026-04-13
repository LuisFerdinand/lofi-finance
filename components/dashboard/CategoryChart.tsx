// components/dashboard/CategoryChart.tsx
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { centsToDisplay, getCategoryLabel, getCategoryEmoji } from "@/utils";
import type { CategoryBreakdown } from "@/types";

interface CategoryChartProps {
  data: CategoryBreakdown[];
}

const COLORS = [
  "var(--truffle)",
  "var(--burning-flame)",
  "var(--blue-fantastic)",
  "var(--oatmeal)",
  "#7a4030",
  "#d4824a",
  "#1e4060",
  "#a8956a",
];

/* eslint-disable @typescript-eslint/no-explicit-any */
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="pixel-box bg-card p-3 text-xs font-mono">
      <p className="font-pixel mb-1" style={{ fontSize: "8px" }}>
        {getCategoryEmoji(item.category)} {getCategoryLabel(item.category)}
      </p>
      <p className="text-muted-foreground">{centsToDisplay(item.total)}</p>
      <p className="text-muted-foreground">{item.percentage}%</p>
    </div>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function CategoryChart({ data }: CategoryChartProps) {
  const top = data.slice(0, 6);

  return (
    <div className="pixel-box bg-card p-4 h-full">
      <h2 className="font-pixel text-xs mb-4">TOP EXPENSES</h2>

      {top.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground text-center py-8">
          no data yet
        </p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={top}
                dataKey="total"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={75}
                stroke="var(--abyssal)"
                strokeWidth={2}
                paddingAngle={1}
              >
                {top.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="space-y-1.5 mt-3">
            {top.map((item, i) => (
              <div
                key={item.category}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 border border-abyssal shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-sm shrink-0">
                    {getCategoryEmoji(item.category)}
                  </span>
                  <span className="font-mono text-xs truncate">
                    {getCategoryLabel(item.category)}
                  </span>
                </div>
                <span
                  className="font-pixel text-xs shrink-0"
                  style={{ fontSize: "8px" }}
                >
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}