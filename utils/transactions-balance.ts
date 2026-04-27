// utils/transactions-balance.ts
import "server-only";
import { db } from "@/db";
import { transactions } from "@/db/schema/transactions";
import { eq, sql } from "drizzle-orm";

/**
 * True net balance = all-time income minus all-time expenses from the
 * transactions table. Contributions to goals create expense transactions,
 * so they are already reflected here automatically.
 */
export async function getUserNetBalance(userId: string): Promise<number> {
  const rows = await db
    .select({
      type: transactions.type,
      total: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .groupBy(transactions.type);

  let income = 0;
  let expense = 0;
  for (const row of rows) {
    if (row.type === "income") income = Number(row.total);
    else expense = Number(row.total);
  }

  return income - expense;
}

/**
 * Returns the same net balance with a breakdown for display.
 * No separate goal allocation needed — contributions are already
 * recorded as expense transactions.
 */
export async function getUserFreeBalance(userId: string): Promise<{
  netBalance: number;
  allocatedToGoals: number; // kept for API shape compatibility, always 0 now
  freeBalance: number;
}> {
  const netBalance = await getUserNetBalance(userId);
  return {
    netBalance,
    allocatedToGoals: 0,
    freeBalance: netBalance,
  };
}