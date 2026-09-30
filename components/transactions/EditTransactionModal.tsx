// components/transactions/EditTransactionModal.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { todayISO } from "@/utils";
import type { Transaction } from "@/db/schema";
import type { Category, TransactionType } from "@/types";
import RupiahInput from "@/components/ui/RupiahInput";
import Modal from "@/components/ui/Modal";
import CategoryPicker from "./CategoryPicker";

interface Props {
  transaction: Transaction;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditTransactionModal({ transaction, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState<number>(transaction.amount);
  // Remember a category per type, so flipping income ⇄ expense and back
  // restores the original instead of forcing a re-pick.
  const [categoryByType, setCategoryByType] = useState<Record<TransactionType, Category | "">>({
    income: transaction.type === "income" ? (transaction.category as Category) : "",
    expense: transaction.type === "expense" ? (transaction.category as Category) : "",
  });
  const [form, setForm] = useState({
    description: transaction.description,
    note: transaction.note ?? "",
    transactionDate: transaction.transactionDate,
  });
  const category = categoryByType[type];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) {
      toast.error("pick a category");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, note: form.note.trim() || null, category, type, amount }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "failed to update");
      }
      toast.success("transaction updated!");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="EDIT TRANSACTION" headerClassName="bg-blue-fantastic text-palladian">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Type toggle */}
        <div className="flex gap-2">
          {(["income", "expense"] as TransactionType[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={`flex-1 pixel-btn font-pixel py-2.5 transition-colors ${
                type === t
                  ? t === "income"
                    ? "bg-burning-flame text-abyssal"
                    : "bg-truffle text-palladian"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
              style={{ fontSize: "11px" }}
            >
              {t === "income" ? "▲ INCOME" : "▼ EXPENSE"}
            </button>
          ))}
        </div>

        <RupiahInput value={amount} onChange={setAmount} required />

        <div>
          <label htmlFor="edit-tx-desc" className="font-pixel block mb-1" style={{ fontSize: "10px" }}>
            DESCRIPTION
          </label>
          <input
            id="edit-tx-desc"
            type="text"
            required
            maxLength={200}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:border-burning-flame"
          />
        </div>

        <div>
          <p className="font-pixel mb-2" style={{ fontSize: "10px" }}>
            CATEGORY
          </p>
          <CategoryPicker
            type={type}
            value={category}
            onChange={(c) => setCategoryByType((m) => ({ ...m, [type]: c }))}
          />
        </div>

        <div>
          <label htmlFor="edit-tx-date" className="font-pixel block mb-1" style={{ fontSize: "10px" }}>
            DATE
          </label>
          <input
            id="edit-tx-date"
            type="date"
            required
            value={form.transactionDate}
            max={todayISO()}
            onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
            className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="edit-tx-note" className="font-pixel block mb-1" style={{ fontSize: "10px" }}>
            NOTE <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="edit-tx-note"
            type="text"
            maxLength={500}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none placeholder:text-muted-foreground"
            placeholder="Extra details..."
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 pixel-btn font-pixel py-3 transition-colors disabled:opacity-60 ${
              type === "income" ? "bg-burning-flame text-abyssal" : "bg-truffle text-palladian"
            }`}
            style={{ fontSize: "11px" }}
          >
            {loading ? "SAVING..." : "► SAVE CHANGES"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn bg-muted text-foreground font-pixel px-4 py-3"
            style={{ fontSize: "11px" }}
          >
            CANCEL
          </button>
        </div>
      </form>
    </Modal>
  );
}
