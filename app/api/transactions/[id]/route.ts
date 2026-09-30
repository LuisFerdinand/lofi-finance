import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateTransaction, deleteTransaction } from "@/utils/transactions";
import { updateTransactionSchema } from "@/utils/transaction-schema";
import { z } from "zod";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const data = updateTransactionSchema.parse(await req.json());
    const tx = await updateTransaction(id, session.user.id, {
      ...data,
      ...(data.note !== undefined ? { note: data.note || null } : {}),
    });
    if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(tx);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[transactions] update failed", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
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
    const deleted = await deleteTransaction(id, session.user.id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[transactions] delete failed", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
