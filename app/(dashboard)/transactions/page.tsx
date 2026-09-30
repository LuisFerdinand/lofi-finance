// app/(dashboard)/transactions/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTransactions, getMonthlyStats } from "@/utils/transactions";
import { getCurrentMonthYear, formatMonth, centsToDisplay } from "@/utils";
import { categorySchema, transactionTypeSchema } from "@/utils/transaction-schema";
import TransactionList from "@/components/transactions/TransactionList";
import TransactionFiltersBar from "@/components/transactions/TransactionFiltersBar";
import MonthPicker from "@/components/transactions/MonthPicker";
import AddTransactionButton from "@/components/transactions/AddTransactionButton";
import type { TransactionFilters } from "@/types";

export const metadata: Metadata = { title: "Transactions" };

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

/** Parse a query-string int, falling back when missing/garbage/out of range. */
function intParam(value: string | undefined, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const { month: curMonth, year: curYear } = getCurrentMonthYear();

  // Hand-edited or stale URLs (?page=0, ?month=abc, ?category=foo) used to
  // reach the database as NaN / negative offsets / invalid enums and 500.
  const month = intParam(params.month, curMonth, 1, 12);
  const year = intParam(params.year, curYear, 2000, 2100);
  const page = intParam(params.page, 1, 1, 10_000);
  const type = transactionTypeSchema.safeParse(params.type);
  const category = categorySchema.safeParse(params.category);

  const filters: TransactionFilters = {
    month,
    year,
    page,
    limit: 15,
    type: type.success ? type.data : undefined,
    category: category.success ? category.data : undefined,
    search: params.search?.trim() || undefined,
  };

  const [result, stats] = await Promise.all([
    getTransactions(session.user.id, filters),
    getMonthlyStats(session.user.id, month, year),
  ]);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-pixel text-sm leading-relaxed">TRANSACTIONS</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">
            {result.total} records · {formatMonth(month, year)}
          </p>
        </div>
        <AddTransactionButton />
      </div>

      {/* Month picker */}
      <MonthPicker currentMonth={month} currentYear={year} />

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="pixel-box-sm bg-burning-flame text-abyssal p-3 text-center">
          <p className="font-pixel leading-none mb-1.5" style={{ fontSize: "9px" }}>INCOME</p>
          <p className="font-pixel text-xs break-all">{centsToDisplay(stats.totalIncome)}</p>
        </div>
        <div className="pixel-box-sm bg-truffle text-palladian p-3 text-center">
          <p className="font-pixel leading-none mb-1.5" style={{ fontSize: "9px" }}>EXPENSE</p>
          <p className="font-pixel text-xs break-all">{centsToDisplay(stats.totalExpense)}</p>
        </div>
        <div className={`pixel-box-sm p-3 text-center ${stats.netBalance >= 0 ? "bg-blue-fantastic text-palladian" : "bg-abyssal text-palladian"}`}>
          <p className="font-pixel leading-none mb-1.5" style={{ fontSize: "9px" }}>NET</p>
          <p className="font-pixel text-xs break-all">
            {stats.netBalance < 0 ? "−" : ""}
            {centsToDisplay(Math.abs(stats.netBalance))}
          </p>
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
