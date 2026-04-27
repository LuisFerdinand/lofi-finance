// app/api/goals/[id]/contribute/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addContribution, getGoalById } from "@/utils/goals";
import { createTransaction } from "@/utils/transactions";
import { z } from "zod";

const schema = z.object({
  amount: z.number().int().refine((n) => n !== 0, "Amount cannot be zero"),
  note: z.string().max(300).optional(),
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

    const body = await req.json();
    const data = schema.parse(body);

    // Prevent over-withdrawal from goal
    if (data.amount < 0 && Math.abs(data.amount) > goal.currentAmount) {
      return NextResponse.json(
        { error: "Withdrawal exceeds current goal savings" },
        { status: 400 }
      );
    }

    let linkedTransactionId = data.transactionId;

    // Only auto-create a transaction if the user didn't manually link one
    if (!linkedTransactionId) {
      const isDeposit = data.amount > 0;
      const absAmount = Math.abs(data.amount);

      // Deposit → expense transaction (money leaves your balance into the goal)
      // Withdrawal → income transaction (money returns to your balance)
      const tx = await createTransaction({
        userId: session.user.id,
        type: isDeposit ? "expense" : "income",
        category: isDeposit ? "other_expense" : "other_income",
        amount: absAmount,
        description: isDeposit
          ? `Savings: ${goal.name}`
          : `Withdrawal from: ${goal.name}`,
        note: data.note,
        transactionDate: data.contributedAt,
      });

      linkedTransactionId = tx.id;
    }

    // Record the contribution (now always linked to a transaction)
    const updated = await addContribution({
      goalId: id,
      userId: session.user.id,
      amount: data.amount,
      note: data.note,
      contributedAt: data.contributedAt,
      transactionId: linkedTransactionId,
    });

    return NextResponse.json(updated, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to add contribution" }, { status: 500 });
  }
}