// app/api/projects/[id]/todos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProjectById, getTodos, createTodo } from "@/utils/projects";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(500).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const validStatuses = ["open", "in_progress", "on_hold", "done", "cancelled"] as const;
  type TodoStatus = (typeof validStatuses)[number];

  const todos = await getTodos(id, session.user.id, {
    status: validStatuses.includes(status as TodoStatus) ? (status as TodoStatus) : undefined,
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

    const body = await req.json();
    const data = createSchema.parse(body);
    const todo = await createTodo({ ...data, projectId: id, userId: session.user.id });
    return NextResponse.json(todo, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
  }
}
