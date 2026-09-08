// src/app/(dashboard)/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getMonthlyStats,
  getMonthlyTrend,
  getCategoryBreakdown,
  getTransactions,
  getBalanceOverview,
  getBalanceTrend,
} from "@/utils/transactions";
import { getCurrentMonthYear, formatMonth } from "@/utils";
import BalanceHero from "@/components/dashboard/BalanceHero";
import StatsGrid from "@/components/dashboard/StatsGrid";
import MonthlyChart from "@/components/dashboard/MonthlyChart";
import CategoryChart from "@/components/dashboard/CategoryChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import GoalsDashboardWidget from "@/components/goals/GoalsDashboardWidget";
import AddTransactionButton from "@/components/transactions/AddTransactionButton";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { month, year } = getCurrentMonthYear();

  const [stats, trend, balanceTrend, overview, expenseBreakdown, recent] = await Promise.all([
    getMonthlyStats(session.user.id, month, year),
    getMonthlyTrend(session.user.id),
    getBalanceTrend(session.user.id),
    getBalanceOverview(session.user.id),
    getCategoryBreakdown(session.user.id, month, year, "expense"),
    getTransactions(session.user.id, { page: 1, limit: 5 }),
  ]);

  // Zip the monthly flow trend with the running-balance trend (same 6 months, same order).
  const chartData = trend.map((point, i) => ({
    ...point,
    balance: balanceTrend[i]?.balance ?? 0,
  }));
  const prevMonthNet = trend.length >= 2 ? trend[trend.length - 2].net : 0;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-pixel text-sm text-foreground leading-relaxed">DASHBOARD</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            {formatMonth(month, year)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="pixel-tag bg-burning-flame text-abyssal border-abyssal">LIVE</div>
          <AddTransactionButton />
        </div>
      </div>

      {/* All-time balance */}
      <BalanceHero
        totalBalance={overview.totalBalance}
        totalIncome={overview.totalIncome}
        totalExpense={overview.totalExpense}
        monthNet={stats.netBalance}
        prevMonthNet={prevMonthNet}
        trend={chartData}
      />

      {/* This month's stats */}
      <StatsGrid stats={stats} />

      {/* Charts + Goals widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <MonthlyChart data={chartData} />
          <GoalsDashboardWidget userId={session.user.id} />
        </div>
        <div>
          <CategoryChart data={expenseBreakdown} />
        </div>
      </div>

      {/* Recent transactions */}
      <RecentTransactions transactions={recent.data} />
    </div>
  );
}
