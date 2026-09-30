// app/api/goals/[id]/contribute/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { contributeToGoal, getGoalById } from "@/utils/goals";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  amount: z.number().int().refine((n) => n !== 0, "Amount cannot be zero"),
  note: z.string().trim().max(300).optional(),
  contributedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  transactionId: z.string().uuid().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const goal = await getGoalById(id, session.user.id);
    if (!goal)
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    if (goal.status !== "active")
      return NextResponse.json({ error: "Goal is not active" }, { status: 400 });

    const data = schema.parse(await req.json());

    // Prevent over-withdrawal from goal
    if (data.amount < 0 && Math.abs(data.amount) > goal.currentAmount) {
      return NextResponse.json(
        { error: "Withdrawal exceeds current goal savings" },
        { status: 400 }
      );
    }

    // A manually linked transaction must be one of the caller's own — the
    // history view joins on it and would otherwise show someone else's
    // transaction description.
    if (data.transactionId) {
      const [owned] = await db
        .select({ id: transactions.id })
        .from(transactions)
        .where(and(eq(transactions.id, data.transactionId), eq(transactions.userId, session.user.id)))
        .limit(1);
      if (!owned) {
        return NextResponse.json({ error: "Linked transaction not found" }, { status: 404 });
      }
    }

    // Deposit → expense transaction (money leaves your balance into the goal);
    // withdrawal → income transaction (money returns) — unless one was linked.
    const updated = await contributeToGoal({
      goal,
      userId: session.user.id,
      amount: data.amount,
      note: data.note || undefined,
      contributedAt: data.contributedAt,
      transactionId: data.transactionId,
    });
    if (!updated) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    return NextResponse.json(updated, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    console.error("[goals] contribute failed", err);
    return NextResponse.json({ error: "Failed to add contribution" }, { status: 500 });
  }
}
