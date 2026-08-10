// app/(dashboard)/goals/[id]/page.tsx
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getGoalById, getGoalContributions } from "@/utils/goals";
import { centsToDisplay, formatDate } from "@/utils";
import GoalCard from "@/components/goals/GoalCard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GoalDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const [goal, contributions] = await Promise.all([
    getGoalById(id, session.user.id),
    getGoalContributions(id, session.user.id),
  ]);

  if (!goal) notFound();

  const deposits = contributions.filter((c) => c.amount > 0);
  const withdrawals = contributions.filter((c) => c.amount < 0);
  const totalDeposited = deposits.reduce((a, c) => a + c.amount, 0);
  const totalWithdrawn = withdrawals.reduce((a, c) => a + Math.abs(c.amount), 0);

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <Link href="/goals" className="inline-flex items-center gap-2 font-pixel text-xs text-muted-foreground hover:text-burning-flame transition-colors" style={{ fontSize: "8px" }}>
        <ArrowLeft size={10} /> BACK TO GOALS
      </Link>

      <GoalCard goal={goal} />

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "DEPOSITED", value: centsToDisplay(totalDeposited), bg: "bg-burning-flame", text: "text-abyssal" },
          { label: "WITHDRAWN", value: centsToDisplay(totalWithdrawn), bg: "bg-truffle", text: "text-palladian" },
          { label: "ENTRIES", value: String(contributions.length), bg: "bg-abyssal", text: "text-burning-flame" },
        ].map((s) => (
          <div key={s.label} className={`pixel-box-sm ${s.bg} ${s.text} p-3 text-center`}>
            <p className="font-pixel leading-none mb-1" style={{ fontSize: "7px" }}>{s.label}</p>
            <p className="font-pixel text-xs break-all">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="pixel-box bg-card overflow-hidden">
        <div className="bg-abyssal text-palladian px-4 py-2">
          <p className="font-pixel text-xs">CONTRIBUTION HISTORY</p>
        </div>
        {contributions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-mono text-xs text-muted-foreground">no contributions yet</p>
          </div>
        ) : (
          contributions.map((c, i) => (
            <div key={c.id} className={`flex items-center gap-3 p-4 border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-background/40"}`}>
              <div className={`pixel-tag shrink-0 ${c.amount > 0 ? "bg-burning-flame text-abyssal border-abyssal" : "bg-truffle text-palladian border-abyssal"}`} style={{ fontSize: "6px" }}>
                {c.amount > 0 ? "▲ IN" : "▼ OUT"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs truncate">{c.note ?? (c.transactionDesc ? `linked: ${c.transactionDesc}` : "—")}</p>
                {c.transactionDesc && c.note && (
                  <p className="font-mono text-xs text-muted-foreground truncate">linked: {c.transactionDesc}</p>
                )}
              </div>
              <p className="font-mono text-xs text-muted-foreground whitespace-nowrap shrink-0">{formatDate(c.contributedAt)}</p>
              <p className={`font-pixel shrink-0 ${c.amount > 0 ? "text-burning-flame-ink" : "text-truffle"}`} style={{ fontSize: "10px" }}>
                {c.amount > 0 ? "+" : "−"}{centsToDisplay(Math.abs(c.amount))}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}