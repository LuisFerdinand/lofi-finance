/* eslint-disable @typescript-eslint/no-explicit-any */
// components/dashboard/RecentTransactions.tsx
import Link from "next/link";
import { centsToDisplay, formatDate, getCategoryEmoji, getCategoryLabel } from "@/utils";
import type { Transaction } from "@/db/schema";
import { ArrowRight } from "lucide-react";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="pixel-box bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-pixel text-xs">RECENT ACTIVITY</h2>
        <Link
          href="/transactions"
          className="flex items-center gap-1 font-pixel text-xs text-burning-flame hover:underline"
          style={{ fontSize: "8px" }}
        >
          VIEW ALL <ArrowRight size={10} />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground text-center py-6">
          no transactions yet. add your first one!
        </p>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-3 p-3 bg-background border border-border hover:border-burning-flame transition-colors"
            >
              {/* Category icon */}
              <div className="w-8 h-8 bg-muted border border-border flex items-center justify-center shrink-0 text-base">
                {getCategoryEmoji(tx.category as any)}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs font-bold truncate">{tx.description}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {getCategoryLabel(tx.category as any)} · {formatDate(tx.transactionDate)}
                </p>
              </div>

              {/* Amount */}
              <p
                className={`font-pixel text-xs shrink-0 ${
                  tx.type === "income" ? "text-burning-flame" : "text-truffle"
                }`}
                style={{ fontSize: "10px" }}
              >
                {tx.type === "income" ? "+" : "-"}
                {centsToDisplay(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
