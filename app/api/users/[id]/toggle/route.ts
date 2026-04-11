import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toggleUserActive } from "@/utils/users";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot deactivate your own account" }, { status: 400 });
    }
    const user = await toggleUserActive(id);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Failed to toggle status" }, { status: 500 });
  }
}
