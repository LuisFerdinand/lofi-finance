import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMonthlyStats, getMonthlyTrend, getCategoryBreakdown } from "@/utils/transactions";
import { getCurrentMonthYear, formatMonth } from "@/utils";
import StatsGrid from "@/components/dashboard/StatsGrid";
import MonthlyChart from "@/components/dashboard/MonthlyChart";
import CategoryChart from "@/components/dashboard/CategoryChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import { getTransactions } from "@/utils/transactions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { month, year } = getCurrentMonthYear();

  const [stats, trend, expenseBreakdown, recent] = await Promise.all([
    getMonthlyStats(session.user.id, month, year),
    getMonthlyTrend(session.user.id),
    getCategoryBreakdown(session.user.id, month, year, "expense"),
    getTransactions(session.user.id, { page: 1, limit: 5 }),
  ]);

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
        <div className="pixel-tag bg-burning-flame text-abyssal border-abyssal">
          LIVE
        </div>
      </div>

      {/* Stats */}
      <StatsGrid stats={stats} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MonthlyChart data={trend} />
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
