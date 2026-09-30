// app/api/projects/[id]/todos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getProjectById, getTodos, createTodo } from "@/utils/projects";
import { createTodoSchema, firstZodMessage, todoStatus } from "@/utils/todo-schema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const status = todoStatus.safeParse(searchParams.get("status"));
  const search = searchParams.get("search");

  const todos = await getTodos(id, session.user.id, {
    status: status.success ? status.data : undefined,
    search: search ?? undefined,
  });
  return NextResponse.json(todos);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const project = await getProjectById(id, session.user.id);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const data = createTodoSchema.parse(await req.json());
    const todo = await createTodo({ ...data, projectId: id, userId: session.user.id });
    return NextResponse.json(todo, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: firstZodMessage(err) }, { status: 400 });
    console.error("[projects] create todo failed", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
