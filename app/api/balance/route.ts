// app/api/balance/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserFreeBalance } from "@/utils/transactions-balance";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const balance = await getUserFreeBalance(session.user.id);
  return NextResponse.json(balance);
}