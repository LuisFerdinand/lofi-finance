// app/api/todos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { updateTodo, deleteTodo, getProjectById } from "@/utils/projects";
import { firstZodMessage, updateTodoSchema } from "@/utils/todo-schema";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const data = updateTodoSchema.parse(await req.json());
    if (data.projectId) {
      const project = await getProjectById(data.projectId, session.user.id);
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const todo = await updateTodo(id, session.user.id, data);
    if (!todo) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json(todo);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: firstZodMessage(err) }, { status: 400 });
    console.error("[todos] update failed", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const deleted = await deleteTodo(id, session.user.id);
    if (!deleted) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[todos] delete failed", err);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
