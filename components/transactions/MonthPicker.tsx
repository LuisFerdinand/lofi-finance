// src/components/transactions/MonthPicker.tsx
"use client";

import { useRouter } from "next/navigation";
import { getLast6Months, formatMonth } from "@/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils";

interface Props {
  currentMonth: number;
  currentYear: number;
}

export default function MonthPicker({ currentMonth, currentYear }: Props) {
  const router = useRouter();
  const months = getLast6Months();

  function setMonth(month: number, year: number) {
    const url = new URL(window.location.href);
    url.searchParams.set("month", String(month));
    url.searchParams.set("year", String(year));
    url.searchParams.set("page", "1");
    router.push(url.toString());
  }

  function shift(dir: -1 | 1) {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m, y);
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => shift(-1)}
        className="pixel-btn bg-card p-2 shrink-0"
      >
        <ChevronLeft size={12} />
      </button>

      <div className="flex gap-1 flex-1 overflow-x-auto">
        {months.map(({ month, year, label }) => {
          const isActive = month === currentMonth && year === currentYear;
          return (
            <button
              key={`${year}-${month}`}
              onClick={() => setMonth(month, year)}
              className={cn(
                "shrink-0 pixel-btn font-pixel px-3 py-2 transition-all whitespace-nowrap",
                isActive
                  ? "bg-abyssal text-burning-flame"
                  : "bg-card text-foreground hover:bg-muted"
              )}
              style={{ fontSize: "7px" }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => shift(1)}
        className="pixel-btn bg-card p-2 shrink-0"
      >
        <ChevronRight size={12} />
      </button>
    </div>
  );
}
