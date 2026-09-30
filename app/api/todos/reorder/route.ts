// app/api/todos/reorder/route.ts
// Board ranking in one request: used when a drop lands next to never-ranked
// cards, so the whole column gets evenly spaced ranks at once (after that,
// single drops only PATCH the moved card).
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { updateTodo } from "@/utils/projects";
import { firstZodMessage, reorderSchema } from "@/utils/todo-schema";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { moves } = reorderSchema.parse(await req.json());
    const userId = session.user.id;
    // Each update is scoped to the user, so foreign ids simply match no row.
    const updated = await Promise.all(
      moves.map((m) =>
        updateTodo(m.id, userId, m.status ? { sortOrder: m.sortOrder, status: m.status } : { sortOrder: m.sortOrder })
      )
    );
    return NextResponse.json(updated.filter(Boolean));
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: firstZodMessage(err) }, { status: 400 });
    console.error("[todos] reorder failed", err);
    return NextResponse.json({ error: "Failed to reorder tasks" }, { status: 500 });
  }
}
