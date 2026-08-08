// utils/goals.ts
import "server-only"; // prevents DB code leaking into client bundles
import { db } from "@/db";
import { savings_goals, goal_contributions } from "@/db/schema/goals";
import { transactions } from "@/db/schema/transactions";
import { eq, and, desc, sql } from "drizzle-orm";
import type { SavingsGoal, GoalContribution } from "@/db/schema/goals";
import type { GoalIcon } from "@/types";

// ─── Pure helpers (no DB — safe to import anywhere) ──────────────────────────
// NOTE: icon rendering lives in utils/goals-helpers.tsx (GOAL_ICON_MAP / GoalIconDisplay)
// since it needs JSX; these numeric helpers are re-exported there for client components.

export function calcProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

export function calcRemainingDays(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calcRequiredPerDay(
  remaining: number,
  deadline: string | null
): number | null {
  if (!deadline) return null;
  const days = calcRemainingDays(deadline);
  if (!days || days <= 0) return null;
  return Math.ceil(remaining / days);
}

// ─── DB queries (server-only) ─────────────────────────────────────────────────

export async function getGoals(userId: string): Promise<SavingsGoal[]> {
  return db
    .select()
    .from(savings_goals)
    .where(eq(savings_goals.userId, userId))
    .orderBy(desc(savings_goals.isPinned), desc(savings_goals.createdAt));
}

export async function getGoalById(
  id: string,
  userId: string
): Promise<SavingsGoal | null> {
  const [goal] = await db
    .select()
    .from(savings_goals)
    .where(and(eq(savings_goals.id, id), eq(savings_goals.userId, userId)))
    .limit(1);
  return goal ?? null;
}

export async function getGoalContributions(
  goalId: string,
  userId: string
): Promise<(GoalContribution & { transactionDesc?: string | null })[]> {
  const rows = await db
    .select({
      id: goal_contributions.id,
      goalId: goal_contributions.goalId,
      userId: goal_contributions.userId,
      transactionId: goal_contributions.transactionId,
      amount: goal_contributions.amount,
      note: goal_contributions.note,
      contributedAt: goal_contributions.contributedAt,
      createdAt: goal_contributions.createdAt,
      transactionDesc: transactions.description,
    })
    .from(goal_contributions)
    .leftJoin(transactions, eq(goal_contributions.transactionId, transactions.id))
    .where(
      and(
        eq(goal_contributions.goalId, goalId),
        eq(goal_contributions.userId, userId)
      )
    )
    .orderBy(desc(goal_contributions.contributedAt));
  return rows;
}

export async function createGoal(data: {
  userId: string;
  name: string;
  notes?: string;
  icon: GoalIcon;
  targetAmount: number;
  deadline?: string;
}): Promise<SavingsGoal> {
  const [goal] = await db.insert(savings_goals).values(data).returning();
  return goal;
}

export async function updateGoal(
  id: string,
  userId: string,
  data: Partial<{
    name: string;
    notes: string;
    icon: GoalIcon;
    targetAmount: number;
    deadline: string;
    status: "active" | "completed" | "cancelled";
    isPinned: boolean;
  }>
): Promise<SavingsGoal> {
  const [goal] = await db
    .update(savings_goals)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(savings_goals.id, id), eq(savings_goals.userId, userId)))
    .returning();
  return goal;
}

export async function deleteGoal(id: string, userId: string): Promise<void> {
  await db
    .delete(savings_goals)
    .where(and(eq(savings_goals.id, id), eq(savings_goals.userId, userId)));
}

export async function addContribution(data: {
  goalId: string;
  userId: string;
  amount: number;
  note?: string;
  contributedAt: string;
  transactionId?: string;
}): Promise<SavingsGoal> {
  await db.insert(goal_contributions).values(data);
  const [updated] = await db
    .update(savings_goals)
    .set({
      currentAmount: sql`${savings_goals.currentAmount} + ${data.amount}`,
      status: sql`CASE WHEN ${savings_goals.currentAmount} + ${data.amount} >= ${savings_goals.targetAmount} THEN 'completed'::goal_status ELSE ${savings_goals.status} END`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(savings_goals.id, data.goalId),
        eq(savings_goals.userId, data.userId)
      )
    )
    .returning();
  return updated;
}

export async function getGoalsSummary(userId: string) {
  const goals = await getGoals(userId);
  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");
  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  return {
    total: goals.length,
    active: active.length,
    completed: completed.length,
    totalSaved,
    totalTarget,
  };
}