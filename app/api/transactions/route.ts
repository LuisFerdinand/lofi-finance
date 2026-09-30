import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTransactions, createTransaction } from "@/utils/transactions";
import { categorySchema, createTransactionSchema, transactionTypeSchema } from "@/utils/transaction-schema";
import { z } from "zod";

function positiveInt(value: string | null, fallback: number, max: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, max) : fallback;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = transactionTypeSchema.safeParse(searchParams.get("type"));
  const category = categorySchema.safeParse(searchParams.get("category"));
  const month = positiveInt(searchParams.get("month"), 0, 12);
  const year = positiveInt(searchParams.get("year"), 0, 9999);

  const result = await getTransactions(session.user.id, {
    type: type.success ? type.data : undefined,
    category: category.success ? category.data : undefined,
    month: month || undefined,
    year: year || undefined,
    page: positiveInt(searchParams.get("page"), 1, 10_000),
    limit: positiveInt(searchParams.get("limit"), 20, 100),
    search: searchParams.get("search")?.trim() || undefined,
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = createTransactionSchema.parse(await req.json());
    const tx = await createTransaction({ ...data, note: data.note || undefined, userId: session.user.id });
    return NextResponse.json(tx, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[transactions] create failed", err);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
