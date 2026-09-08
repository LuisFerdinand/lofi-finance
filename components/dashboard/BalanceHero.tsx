// components/dashboard/BalanceHero.tsx
"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { centsToDisplay, cn } from "@/utils";

interface BalanceHeroProps {
  /** All-time running balance (every income minus every expense). */
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  /** Net for the month currently in view. */
  monthNet: number;
  /** Net for the previous month, for the up/down comparison. */
  prevMonthNet: number;
  /** 6-month closing-balance series for the sparkline. */
  trend: { month: string; balance: number }[];
}

export default function BalanceHero({
  totalBalance,
  totalIncome,
  totalExpense,
  monthNet,
  prevMonthNet,
  trend,
}: BalanceHeroProps) {
  const positive = totalBalance >= 0;
  const monthUp = monthNet >= 0;
  const swing = monthNet - prevMonthNet;

  return (
    <div
      className={cn(
        "pixel-box scanlines p-4 sm:p-5",
        positive ? "bg-blue-fantastic text-palladian" : "bg-truffle text-palladian"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-pixel flex items-center gap-1.5 opacity-70" style={{ fontSize: "8px" }}>
            <Wallet size={11} /> TOTAL BALANCE
          </p>
          <p className="font-pixel text-base sm:text-xl mt-2 leading-tight break-all">
            {centsToDisplay(totalBalance)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 font-mono text-xs">
            {monthUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>
              {monthUp ? "+" : "-"}
              {centsToDisplay(Math.abs(monthNet))} this month
            </span>
          </div>
        </div>

        <div className="w-20 h-14 sm:w-36 sm:h-16 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="var(--burning-flame)"
                strokeWidth={2}
                fill="var(--burning-flame)"
                fillOpacity={0.2}
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-palladian/20 font-mono text-xs">
        <div>
          <p className="opacity-70" style={{ fontSize: "10px" }}>all income</p>
          <p className="font-pixel mt-1 break-all" style={{ fontSize: "9px" }}>
            {centsToDisplay(totalIncome)}
          </p>
        </div>
        <div>
          <p className="opacity-70" style={{ fontSize: "10px" }}>all expense</p>
          <p className="font-pixel mt-1 break-all" style={{ fontSize: "9px" }}>
            {centsToDisplay(totalExpense)}
          </p>
        </div>
        <div>
          <p className="opacity-70" style={{ fontSize: "10px" }}>vs last month</p>
          <p className="font-pixel mt-1 break-all" style={{ fontSize: "9px" }}>
            {swing >= 0 ? "+" : "-"}
            {centsToDisplay(Math.abs(swing))}
          </p>
        </div>
      </div>
    </div>
  );
}
