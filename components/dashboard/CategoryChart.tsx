"use client";

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
        <div className="space-y-3">
          {top.map((item, i) => (
            <div key={item.category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getCategoryEmoji(item.category)}</span>
                  <span className="font-mono text-xs truncate">
                    {getCategoryLabel(item.category)}
                  </span>
                </div>
                <span className="font-pixel text-xs shrink-0 ml-2" style={{ fontSize: "8px" }}>
                  {item.percentage}%
                </span>
              </div>
              {/* Pixel progress bar */}
              <div className="h-3 bg-muted border border-abyssal relative overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${item.percentage}%`,
                    background: COLORS[i % COLORS.length],
                  }}
                />
                {/* Pixel grid overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 4px)",
                  }}
                />
              </div>
              <p className="font-mono text-xs text-muted-foreground mt-0.5">
                {centsToDisplay(item.total)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
