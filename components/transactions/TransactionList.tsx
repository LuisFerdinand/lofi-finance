// src/components/transactions/TransactionList.tsx
"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { centsToDisplay, formatDate, getCategoryEmoji, getCategoryLabel } from "@/utils";
import type { Transaction } from "@/db/schema";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import EditTransactionModal from "./EditTransactionModal";

interface TransactionListProps {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}

export default function TransactionList({ transactions, total, page, totalPages }: TransactionListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Transaction | null>(null);

  const [optimisticTxns, removeOptimistic] = useOptimistic(
    transactions,
    (current, deletedId: string) => current.filter((t) => t.id !== deletedId)
  );

  async function handleDelete(id: string) {
    if (!confirm("delete this transaction?")) return;
    startTransition(async () => {
      removeOptimistic(id);
      try {
        const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast.success("transaction deleted");
        router.refresh();
      } catch {
        toast.error("failed to delete — refreshing");
        router.refresh();
      }
    });
  }

  function changePage(newPage: number) {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(newPage));
    router.push(url.toString());
  }

  if (optimisticTxns.length === 0) {
    return (
      <div className="pixel-box bg-card p-8 text-center">
        <p className="font-pixel text-xs text-muted-foreground">NO TRANSACTIONS FOUND</p>
        <p className="font-mono text-xs text-muted-foreground mt-2">add your first one using the + button</p>
      </div>
    );
  }

  return (
    <>
      <div className={`pixel-box bg-card overflow-hidden transition-opacity ${isPending ? "opacity-60" : "opacity-100"}`}>
        {/* Desktop header */}
        <div className="hidden md:grid md:grid-cols-[64px_1fr_160px_110px_180px_80px] gap-3 px-4 py-2 bg-abyssal text-palladian">
          {["TYPE", "DESCRIPTION", "CATEGORY", "DATE", "AMOUNT", ""].map((h) => (
            <p key={h} className="font-pixel text-palladian" style={{ fontSize: "7px" }}>{h}</p>
          ))}
        </div>

        {optimisticTxns.map((tx, i) => (
          <div
            key={tx.id}
            className={`group flex flex-col md:grid md:grid-cols-[64px_1fr_160px_110px_180px_80px]
                        gap-2 md:gap-3 p-4 border-b border-border last:border-0
                        hover:bg-muted/30 transition-colors items-start md:items-center
                        ${i % 2 === 0 ? "" : "bg-background/40"}`}
          >
            {/* Type badge */}
            <div>
              <span
                className={`pixel-tag ${
                  tx.type === "income"
                    ? "bg-burning-flame text-abyssal border-abyssal"
                    : "bg-truffle text-palladian border-abyssal"
                }`}
                style={{ fontSize: "7px" }}
              >
                {tx.type === "income" ? "▲ IN" : "▼ OUT"}
              </span>
            </div>

            {/* Description */}
            <div className="min-w-0">
              <p className="font-mono text-xs font-bold truncate">{tx.description}</p>
              {tx.note && (
                <p className="font-mono text-xs text-muted-foreground truncate">{tx.note}</p>
              )}
            </div>

            {/* Category */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm leading-none">{getCategoryEmoji(tx.category as any)}</span>
              <span className="font-mono text-xs text-muted-foreground truncate">
                {getCategoryLabel(tx.category as any)}
              </span>
            </div>

            {/* Date */}
            <p className="font-mono text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(tx.transactionDate)}
            </p>

            {/* Amount — highlighted */}
            <div className={`flex items-center gap-2 px-2 py-1.5 border-l-4 ${
              tx.type === "income" ? "border-burning-flame" : "border-truffle"
            }`}>
              <span
                className={`font-pixel leading-none ${
                  tx.type === "income" ? "text-burning-flame" : "text-truffle"
                }`}
                style={{ fontSize: "11px" }}
              >
                {tx.type === "income" ? "+" : "−"}
              </span>
              <span
                className={`font-pixel break-all ${
                  tx.type === "income" ? "text-burning-flame" : "text-truffle"
                }`}
                style={{ fontSize: "11px" }}
              >
                {centsToDisplay(tx.amount)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditing(tx)}
                className="pixel-btn p-1.5 bg-muted text-foreground hover:bg-blue-fantastic hover:text-palladian transition-colors"
                title="edit"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(tx.id)}
                className="pixel-btn p-1.5 bg-muted text-truffle hover:bg-truffle hover:text-palladian transition-colors"
                title="delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <p className="font-mono text-xs text-muted-foreground">
            {total} total · page {page}/{totalPages}
          </p>
          <div className="flex gap-2">
            <button onClick={() => changePage(page - 1)} disabled={page <= 1} className="pixel-btn bg-card p-2 disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => changePage(page + 1)} disabled={page >= totalPages} className="pixel-btn bg-card p-2 disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {editing && (
        <EditTransactionModal
          transaction={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => { setEditing(null); router.refresh(); }}
        />
      )}
    </>
  );
}