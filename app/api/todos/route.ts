// app/api/todos/route.ts
// Standalone tasks — quick notes with no project attached. Scoped list lives
// in getAllTodos(); this route only needs to handle creation.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createTodo } from "@/utils/projects";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(500).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const todo = await createTodo({ ...data, projectId: null, userId: session.user.id });
    return NextResponse.json(todo, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
  }
}
