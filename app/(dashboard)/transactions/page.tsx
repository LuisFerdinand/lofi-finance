// src/app/(dashboard)/transactions/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTransactions, getMonthlyStats } from "@/utils/transactions";
import { getCurrentMonthYear, formatMonth, centsToDisplay } from "@/utils";
import TransactionList from "@/components/transactions/TransactionList";
import TransactionFiltersBar from "@/components/transactions/TransactionFiltersBar";
import MonthPicker from "@/components/transactions/MonthPicker";
import type { TransactionFilters } from "@/types";

interface PageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
    type?: string;
    category?: string;
    page?: string;
    search?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const { month: curMonth, year: curYear } = getCurrentMonthYear();

  const month = parseInt(params.month ?? String(curMonth));
  const year = parseInt(params.year ?? String(curYear));
  const page = parseInt(params.page ?? "1");

  const filters: TransactionFilters = {
    month,
    year,
    page,
    limit: 15,
    type: params.type as any,
    category: params.category as any,
    search: params.search,
  };

  const [result, stats] = await Promise.all([
    getTransactions(session.user.id, filters),
    getMonthlyStats(session.user.id, month, year),
  ]);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header — no Add button here, it's global in the layout */}
      <div>
        <h1 className="font-pixel text-sm leading-relaxed">TRANSACTIONS</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">
          {result.total} records · {formatMonth(month, year)}
        </p>
      </div>

      {/* Month picker */}
      <MonthPicker currentMonth={month} currentYear={year} />

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="pixel-box-sm bg-burning-flame text-abyssal p-3 text-center">
          <p className="font-pixel leading-none mb-1" style={{ fontSize: "7px" }}>INCOME</p>
          <p className="font-pixel text-xs">{centsToDisplay(stats.totalIncome)}</p>
        </div>
        <div className="pixel-box-sm bg-truffle text-palladian p-3 text-center">
          <p className="font-pixel leading-none mb-1" style={{ fontSize: "7px" }}>EXPENSE</p>
          <p className="font-pixel text-xs">{centsToDisplay(stats.totalExpense)}</p>
        </div>
        <div className={`pixel-box-sm p-3 text-center ${stats.netBalance >= 0 ? "bg-blue-fantastic text-palladian" : "bg-truffle text-palladian"}`}>
          <p className="font-pixel leading-none mb-1" style={{ fontSize: "7px" }}>NET</p>
          <p className="font-pixel text-xs">{centsToDisplay(Math.abs(stats.netBalance))}</p>
        </div>
      </div>

      {/* Filters */}
      <TransactionFiltersBar currentFilters={filters} />

      {/* List */}
      <TransactionList
        transactions={result.data}
        total={result.total}
        page={page}
        totalPages={result.totalPages}
      />
    </div>
  );
}