// src/components/transactions/TransactionList.tsx
"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { centsToDisplay, formatDate, getCategoryLabel } from "@/utils";
import { CategoryIconDisplay } from "@/utils/category-icons";
import type { Transaction } from "@/db/schema";
import { Trash2, Pencil, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import EditTransactionModal from "./EditTransactionModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// Desktop column template shared by the header and every row, so the columns
// line up. Kept as one literal `md:` class so Tailwind generates it. The amount
// column fits "−Rp 1.000.000.000" on one line.
const COLS = "md:grid-cols-[88px_minmax(0,1fr)_minmax(140px,190px)_124px_210px_76px]";

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
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [optimisticTxns, removeOptimistic] = useOptimistic(
    transactions,
    (current, deletedId: string) => current.filter((t) => t.id !== deletedId)
  );

  function handleDelete(id: string) {
    setConfirmId(id);
  }

  function confirmDelete() {
    const id = confirmId;
    if (!id) return;
    setConfirmId(null);
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
        {/* Desktop header — same column template as the rows below */}
        <div className={`hidden md:grid ${COLS} gap-x-4 px-4 py-2.5 bg-abyssal text-palladian`}>
          {["TYPE", "DESCRIPTION", "CATEGORY", "DATE", "AMOUNT", ""].map((h, i) => (
            <p
              key={h || i}
              className={`font-pixel text-palladian ${h === "AMOUNT" ? "text-right" : ""}`}
              style={{ fontSize: "10px" }}
            >
              {h}
            </p>
          ))}
        </div>

        {optimisticTxns.map((tx, i) => {
          const income = tx.type === "income";
          return (
          <div
            key={tx.id}
            className={`group grid grid-cols-[auto_minmax(0,1fr)_auto] ${COLS} gap-x-3 md:gap-x-4 gap-y-1
                        px-4 py-3 border-b border-border last:border-b-0 border-l-4 items-center
                        hover:bg-muted/30 transition-colors
                        ${income ? "border-l-burning-flame" : "border-l-truffle"}
                        ${i % 2 === 0 ? "" : "bg-background/40"}`}
          >
            {/* Type — a badge on desktop; on phones the category icon takes this slot */}
            <div className="hidden md:block">
              <span
                className={`inline-flex items-center gap-1 whitespace-nowrap px-2 py-1 border-[1.5px] border-abyssal font-pixel ${
                  income ? "bg-burning-flame text-abyssal" : "bg-truffle text-palladian"
                }`}
                style={{ fontSize: "9px" }}
              >
                {income ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                {income ? "IN" : "OUT"}
              </span>
            </div>
            <span className="md:hidden row-span-2 self-start w-9 h-9 border-2 border-border bg-muted flex items-center justify-center shrink-0">
              <CategoryIconDisplay category={tx.category} size={16} />
            </span>

            {/* Description (+ category · date on phones) */}
            <div className="min-w-0 col-span-2 md:col-span-1">
              <p className="font-mono text-sm font-bold truncate" title={tx.description}>{tx.description}</p>
              {tx.note && (
                <p className="font-mono text-xs text-muted-foreground truncate" title={tx.note}>{tx.note}</p>
              )}
              <p className="md:hidden font-mono text-xs text-muted-foreground truncate">
                {getCategoryLabel(tx.category)} · {formatDate(tx.transactionDate)}
              </p>
            </div>

            {/* Category */}
            <div className="hidden md:flex items-center gap-1.5 min-w-0">
              <CategoryIconDisplay category={tx.category} size={15} className="shrink-0 text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground truncate">
                {getCategoryLabel(tx.category)}
              </span>
            </div>

            {/* Date */}
            <p className="hidden md:block font-mono text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(tx.transactionDate)}
            </p>

            {/* Amount — one line, right-aligned so the digits line up down the column */}
            <p
              className={`col-start-2 md:col-start-auto min-w-0 whitespace-nowrap text-left md:text-right tabular-nums
                          font-mono font-bold text-sm md:font-pixel md:font-normal md:text-xs ${
                income ? "text-burning-flame-ink" : "text-truffle"
              }`}
            >
              {income ? "+" : "−"}
              {/* Intl puts a no-break space after "Rp"; a normal space lets a
                  very large amount wrap on phones (desktop stays nowrap). */}
              {centsToDisplay(tx.amount).replace(/ /g, " ")}
            </p>

            {/* Actions */}
            <div className="col-start-3 md:col-start-auto flex justify-end gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
              <button
                onClick={() => setEditing(tx)}
                className="pixel-btn p-1.5 bg-muted text-foreground hover:bg-blue-fantastic hover:text-palladian transition-colors"
                title="edit"
                aria-label={`edit ${tx.description}`}
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => handleDelete(tx.id)}
                className="pixel-btn p-1.5 bg-muted text-truffle hover:bg-truffle hover:text-palladian transition-colors"
                title="delete"
                aria-label={`delete ${tx.description}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <p className="font-mono text-xs text-muted-foreground">
            {total} total · page {page}/{totalPages}
          </p>
          <div className="flex gap-2">
            <button onClick={() => changePage(page - 1)} disabled={page <= 1} aria-label="previous page" className="pixel-btn bg-card p-2 disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => changePage(page + 1)} disabled={page >= totalPages} aria-label="next page" className="pixel-btn bg-card p-2 disabled:opacity-40">
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

      <ConfirmDialog
        open={confirmId !== null}
        title="DELETE TRANSACTION"
        message="Delete this transaction? This cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}