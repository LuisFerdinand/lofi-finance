import { db } from "@/db";
import { transactions, users } from "@/db/schema";
import { eq, and, gte, lte, desc, count, sql, like, or } from "drizzle-orm";
import { getMonthRange } from "@/utils";
import type {
  TransactionFilters,
  MonthlyStats,
  CategoryBreakdown,
  MonthlyTrend,
  PaginatedResult,
  Category,
} from "@/types";
import type { Transaction } from "@/db/schema";
import { getLast6Months } from "@/utils";

// ─── Get transactions with filters & pagination ───────────────────────────────

export async function getTransactions(
  userId: string,
  filters: TransactionFilters = {}
): Promise<PaginatedResult<Transaction>> {
  const {
    type,
    category,
    month,
    year,
    page = 1,
    limit = 20,
    search,
  } = filters;

  const conditions = [eq(transactions.userId, userId)];

  if (type) conditions.push(eq(transactions.type, type));
  if (category) conditions.push(eq(transactions.category, category));

  if (month && year) {
    const { start, end } = getMonthRange(month, year);
    conditions.push(gte(transactions.transactionDate, start));
    conditions.push(lte(transactions.transactionDate, end));
  }

  if (search) {
    conditions.push(
      or(
        like(transactions.description, `%${search}%`),
        like(transactions.note, `%${search}%`)
      )!
    );
  }

  const where = and(...conditions);
  const offset = (page - 1) * limit;

  const [data, [{ total }]] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(where)
      .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(transactions).where(where),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Monthly stats ───────────────────────────────────────────────────────────

export async function getMonthlyStats(
  userId: string,
  month: number,
  year: number
): Promise<MonthlyStats> {
  const { start, end } = getMonthRange(month, year);

  const rows = await db
    .select({
      type: transactions.type,
      total: sql<number>`sum(${transactions.amount})`,
      txCount: count(),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.transactionDate, start),
        lte(transactions.transactionDate, end)
      )
    )
    .groupBy(transactions.type);

  let totalIncome = 0;
  let totalExpense = 0;
  let transactionCount = 0;

  for (const row of rows) {
    transactionCount += row.txCount;
    if (row.type === "income") totalIncome = Number(row.total);
    else totalExpense = Number(row.total);
  }

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    transactionCount,
  };
}

// ─── Category breakdown ───────────────────────────────────────────────────────

export async function getCategoryBreakdown(
  userId: string,
  month: number,
  year: number,
  type: "income" | "expense" = "expense"
): Promise<CategoryBreakdown[]> {
  const { start, end } = getMonthRange(month, year);

  const rows = await db
    .select({
      category: transactions.category,
      total: sql<number>`sum(${transactions.amount})`,
      txCount: count(),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, type),
        gte(transactions.transactionDate, start),
        lte(transactions.transactionDate, end)
      )
    )
    .groupBy(transactions.category)
    .orderBy(desc(sql`sum(${transactions.amount})`));

  const grandTotal = rows.reduce((acc, r) => acc + Number(r.total), 0);

  return rows.map((r) => ({
    category: r.category as Category,
    total: Number(r.total),
    percentage: grandTotal > 0 ? Math.round((Number(r.total) / grandTotal) * 100) : 0,
    count: r.txCount,
  }));
}

// ─── Monthly trend (last 6 months) ───────────────────────────────────────────

export async function getMonthlyTrend(userId: string): Promise<MonthlyTrend[]> {
  const months = getLast6Months();

  const results = await Promise.all(
    months.map(async ({ month, year, label }) => {
      const stats = await getMonthlyStats(userId, month, year);
      return {
        month: label,
        year,
        income: stats.totalIncome,
        expense: stats.totalExpense,
        net: stats.netBalance,
      };
    })
  );

  return results;
}

// ─── Create transaction ───────────────────────────────────────────────────────

export async function createTransaction(data: {
  userId: string;
  type: "income" | "expense";
  category: Category;
  amount: number; // in cents
  description: string;
  note?: string;
  transactionDate: string;
}) {
  const [tx] = await db.insert(transactions).values(data).returning();
  return tx;
}

// ─── Update transaction ───────────────────────────────────────────────────────

export async function updateTransaction(
  id: string,
  userId: string,
  data: Partial<{
    type: "income" | "expense";
    category: Category;
    amount: number;
    description: string;
    note: string;
    transactionDate: string;
  }>
) {
  const [tx] = await db
    .update(transactions)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning();
  return tx;
}

// ─── Delete transaction ───────────────────────────────────────────────────────

export async function deleteTransaction(id: string, userId: string) {
  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}
