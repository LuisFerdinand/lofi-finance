import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTransactions, createTransaction } from "@/utils/transactions";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().min(1),
  amount: z.number().int().positive(),
  description: z.string().min(1).max(200),
  note: z.string().max(500).optional(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filters = {
    type: searchParams.get("type") as any,
    category: searchParams.get("category") as any,
    month: searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined,
    year: searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined,
    page: parseInt(searchParams.get("page") ?? "1"),
    limit: parseInt(searchParams.get("limit") ?? "20"),
    search: searchParams.get("search") ?? undefined,
  };

  const result = await getTransactions(session.user.id, filters);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const tx = await createTransaction({ ...data, userId: session.user.id, category: data.category as any });
    return NextResponse.json(tx, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
