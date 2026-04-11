// src/components/transactions/GlobalAddButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { getCategoriesByType, getCategoryLabel } from "@/utils";
import type { TransactionType } from "@/types";
import RupiahInput from "@/components/ui/RupiahInput";

export default function GlobalAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Add transaction"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40
                   pixel-box bg-burning-flame text-abyssal
                   flex items-center gap-2 px-4 py-3
                   font-pixel shadow-lg hover:bg-truffle hover:text-palladian
                   transition-colors"
        style={{ fontSize: "9px" }}
      >
        <Plus size={14} strokeWidth={3} />
        <span className="hidden sm:inline">ADD</span>
      </button>

      {open && <AddModal onClose={() => setOpen(false)} />}
    </>
  );
}

function AddModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState<number>(0);
  const [form, setForm] = useState({
    category: "",
    description: "",
    note: "",
    transactionDate: new Date().toISOString().slice(0, 10),
  });

  const categories = getCategoriesByType(type);

  function handleTypeChange(t: TransactionType) {
    setType(t);
    setForm((f) => ({ ...f, category: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category) { toast.error("select a category"); return; }
    if (!amount || amount <= 0) { toast.error("enter a valid amount"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type, amount }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      toast.success("transaction added!");
      router.refresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "failed to add");
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
        <div className="bg-abyssal text-palladian px-4 py-3 flex items-center justify-between">
          <span className="font-pixel text-xs">ADD TRANSACTION</span>
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
                onClick={() => handleTypeChange(t)}
                className={`flex-1 pixel-btn font-pixel py-2 transition-colors ${
                  type === t
                    ? t === "income"
                      ? "bg-burning-flame text-abyssal"
                      : "bg-truffle text-palladian"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
                style={{ fontSize: "9px" }}
              >
                {t === "income" ? "▲ INCOME" : "▼ EXPENSE"}
              </button>
            ))}
          </div>

          {/* Rupiah amount input */}
          <RupiahInput
            value={amount}
            onChange={setAmount}
            required
            autoFocus
          />

          {/* Description */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>DESCRIPTION</label>
            <input
              type="text"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:border-burning-flame placeholder:text-muted-foreground"
              placeholder="What was this for?"
            />
          </div>

          {/* Category */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>CATEGORY</label>
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none"
            >
              <option value="">-- select --</option>
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
            {loading ? "SAVING..." : `► SAVE ${type.toUpperCase()}`}
          </button>
        </form>
      </div>
    </div>
  );
}