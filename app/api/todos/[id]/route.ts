// app/api/todos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateTodo, deleteTodo } from "@/utils/projects";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  notes: z.string().max(2000).nullable().optional(),
  imageUrl: z.string().url().max(500).nullable().optional(),
  link: z.string().url().max(500).nullable().optional(),
  checklist: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        text: z.string().min(1).max(200),
        done: z.boolean(),
      })
    )
    .max(50)
    .optional(),
  status: z.enum(["open", "in_progress", "on_hold", "done", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

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
    const todo = await updateTodo(id, session.user.id, data);
    return NextResponse.json(todo);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteTodo(id, session.user.id);
  return NextResponse.json({ success: true });
}
