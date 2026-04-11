import { centsToDisplay } from "@/utils";
import type { MonthlyStats } from "@/types";
import { TrendingUp, TrendingDown, Wallet, Activity } from "lucide-react";

interface StatsGridProps {
  stats: MonthlyStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const cards = [
    {
      label: "INCOME",
      value: centsToDisplay(stats.totalIncome),
      icon: TrendingUp,
      bg: "bg-burning-flame",
      text: "text-abyssal",
      border: "border-abyssal",
    },
    {
      label: "EXPENSES",
      value: centsToDisplay(stats.totalExpense),
      icon: TrendingDown,
      bg: "bg-truffle",
      text: "text-palladian",
      border: "border-abyssal",
    },
    {
      label: "NET BALANCE",
      value: centsToDisplay(stats.netBalance),
      icon: Wallet,
      bg: stats.netBalance >= 0 ? "bg-blue-fantastic" : "bg-abyssal",
      text: "text-palladian",
      border: "border-abyssal",
    },
    {
      label: "TRANSACTIONS",
      value: stats.transactionCount.toString(),
      icon: Activity,
      bg: "bg-oatmeal",
      text: "text-abyssal",
      border: "border-abyssal",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`pixel-box ${card.bg} ${card.text} p-4 scanlines`}
        >
          <div className="flex items-start justify-between mb-3">
            <p className="font-pixel leading-none" style={{ fontSize: "7px" }}>
              {card.label}
            </p>
            <card.icon size={14} className="opacity-60" />
          </div>
          <p className="font-pixel text-sm leading-tight break-all">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
