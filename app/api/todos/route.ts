// app/api/todos/route.ts
// Create a task — standalone (projectId omitted/null) or inside one of the
// user's projects. The cross-project list itself is server-rendered via
// getAllTodos(), so this route only handles creation.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createTodo, getProjectById } from "@/utils/projects";
import { createTodoSchema, firstZodMessage } from "@/utils/todo-schema";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = createTodoSchema.parse(await req.json());
    if (data.projectId) {
      const project = await getProjectById(data.projectId, session.user.id);
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const todo = await createTodo({
      ...data,
      projectId: data.projectId ?? null,
      userId: session.user.id,
    });
    return NextResponse.json(todo, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: firstZodMessage(err) }, { status: 400 });
    console.error("[todos] create failed", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
