// src/components/transactions/EditTransactionModal.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { getCategoriesByType, getCategoryLabel } from "@/utils";
import type { Transaction } from "@/db/schema";
import type { TransactionType } from "@/types";
import RupiahInput from "@/components/ui/RupiahInput";

interface Props {
  transaction: Transaction;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditTransactionModal({ transaction, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState<number>(transaction.amount);
  const [form, setForm] = useState({
    category: transaction.category,
    description: transaction.description,
    note: transaction.note ?? "",
    transactionDate: transaction.transactionDate,
  });

  const categories = getCategoriesByType(type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || amount <= 0) { toast.error("enter a valid amount"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type, amount }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("transaction updated!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-abyssal/70 z-50 flex items-end md:items-center justify-center p-4 bottom-12 md:bottom-0"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="pixel-box bg-card w-full max-w-md animate-slide-up">
        <div className="bg-blue-fantastic text-palladian px-4 py-3 flex items-center justify-between">
          <span className="font-pixel text-xs">EDIT TRANSACTION</span>
          <button onClick={onClose} className="text-oatmeal hover:text-burning-flame transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(["income", "expense"] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setForm((f) => ({ ...f, category: "" as any })); }}
                className={`flex-1 pixel-btn font-pixel py-2 transition-colors ${
                  type === t
                    ? t === "income" ? "bg-burning-flame text-abyssal" : "bg-truffle text-palladian"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
                style={{ fontSize: "9px" }}
              >
                {t === "income" ? "▲ INCOME" : "▼ EXPENSE"}
              </button>
            ))}
          </div>

          {/* Rupiah amount input */}
          <RupiahInput value={amount} onChange={setAmount} required />

          {/* Description */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>DESCRIPTION</label>
            <input
              type="text"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:border-burning-flame"
            />
          </div>

          {/* Category */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>CATEGORY</label>
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as typeof form.category })}
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none"
            >
              <option value="" disabled>select category</option>
              {categories.map((c) => (
                <option key={c} value={c}>{getCategoryLabel(c)}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>DATE</label>
            <input
              type="date"
              required
              value={form.transactionDate}
              onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none"
            />
          </div>

          {/* Note */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>
              NOTE <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none placeholder:text-muted-foreground"
              placeholder="Extra details..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full pixel-btn font-pixel py-3 transition-colors disabled:opacity-60 ${
              type === "income" ? "bg-burning-flame text-abyssal" : "bg-truffle text-palladian"
            }`}
            style={{ fontSize: "9px" }}
          >
            {loading ? "SAVING..." : "► UPDATE TRANSACTION"}
          </button>
        </form>
      </div>
    </div>
  );
}