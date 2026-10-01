// app/(dashboard)/transactions/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTransactions, getMonthlyStats } from "@/utils/transactions";
import { getCurrentMonthYear, formatMonth, centsToDisplay } from "@/utils";
import { categorySchema, transactionTypeSchema } from "@/utils/transaction-schema";
import Amount from "@/components/ui/Amount";
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
      {/* On phones each stat is a full-width row (label left, amount right) so
          the whole figure is readable; from sm up they sit as three tiles. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          { label: "INCOME", value: centsToDisplay(stats.totalIncome), cls: "bg-burning-flame text-abyssal" },
          { label: "EXPENSE", value: centsToDisplay(stats.totalExpense), cls: "bg-truffle text-palladian" },
          {
            label: "NET",
            value: `${stats.netBalance < 0 ? "−" : ""}${centsToDisplay(Math.abs(stats.netBalance))}`,
            cls: stats.netBalance >= 0 ? "bg-blue-fantastic text-palladian" : "bg-abyssal text-palladian",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`pixel-box-sm ${s.cls} px-3 py-2.5 sm:p-3 flex items-center gap-3 sm:block sm:text-center`}
          >
            <p
              className="font-pixel leading-none w-[4.5rem] shrink-0 sm:w-auto sm:mb-2"
              style={{ fontSize: "10px" }}
            >
              {s.label}
            </p>
            <div className="min-w-0 flex-1 text-right sm:text-center">
              <Amount max={18} className="text-right sm:text-center">{s.value}</Amount>
            </div>
          </div>
        ))}
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
