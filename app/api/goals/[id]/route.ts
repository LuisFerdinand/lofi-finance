// app/api/goals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoalById, getGoalContributions, updateGoal, deleteGoal } from "@/utils/goals";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  icon: z.enum(["home","car","plane","laptop","heart","graduation","ring","baby","piggy","star","shield","zap"]).optional(),
  targetAmount: z.number().int().positive().optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status: z.enum(["active","completed","cancelled"]).optional(),
  isPinned: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [goal, contributions] = await Promise.all([
    getGoalById(id, session.user.id),
    getGoalContributions(id, session.user.id),
  ]);
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ goal, contributions });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    const goal = await updateGoal(id, session.user.id, {
      ...data,
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
    });
    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(goal);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deleted = await deleteGoal(id, session.user.id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}