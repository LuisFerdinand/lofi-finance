// app/api/goals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoals, createGoal } from "@/utils/goals";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  notes: z.string().max(500).optional(),
  icon: z.enum(["home","car","plane","laptop","heart","graduation","ring","baby","piggy","star","shield","zap"]).default("piggy"),
  targetAmount: z.number().int().positive(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const goals = await getGoals(session.user.id);
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const goal = await createGoal({ ...data, userId: session.user.id });
    return NextResponse.json(goal, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}