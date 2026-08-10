// components/transactions/AddTransactionButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X, Check } from "lucide-react";
import { getCategoriesByType, getCategoryLabel } from "@/utils";
import { CategoryIconDisplay } from "@/utils/category-icons";
import type { TransactionType } from "@/types";
import RupiahInput from "@/components/ui/RupiahInput";
import FabButton from "@/components/ui/FabButton";

const LAST_TXN_KEY = "lofi:lastTxn";

function readLastTxn(): { type: TransactionType; category: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_TXN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLastTxn(type: TransactionType, category: string) {
  try {
    localStorage.setItem(LAST_TXN_KEY, JSON.stringify({ type, category }));
  } catch {
    // localStorage unavailable — not critical, just skip remembering
  }
}

export default function AddTransactionButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex pixel-btn bg-burning-flame text-abyssal font-pixel px-4 py-2 items-center gap-2 shrink-0"
        style={{ fontSize: "9px" }}
      >
        <Plus size={12} /> ADD
      </button>
      <FabButton icon={Plus} label="add transaction" onClick={() => setOpen(true)} />

      {open && <AddModal onClose={() => setOpen(false)} />}
    </>
  );
}

function AddModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [amountKey, setAmountKey] = useState(0);

  const last = readLastTxn();
  const [type, setType] = useState<TransactionType>(last?.type ?? "expense");
  const [amount, setAmount] = useState<number>(0);
  const [form, setForm] = useState({
    category: last?.category ?? "",
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
      writeLastTxn(type, form.category);
      toast.success("transaction added!");
      router.refresh();

      // Quick multi-add: keep the sheet open, reset amount/description/note but
      // keep type + category (same category is usually reused a few times in a row)
      setAmount(0);
      setForm((f) => ({ ...f, description: "", note: "" }));
      setAmountKey((k) => k + 1); // remounts RupiahInput so autoFocus fires again
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1600);
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
      <div className="pixel-box bg-card w-full max-w-md animate-slide-up max-h-[90dvh] overflow-y-auto">
        <div className="bg-abyssal text-palladian px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <span className="font-pixel text-xs">ADD TRANSACTION</span>
          <button onClick={onClose} aria-label="Done adding" className="text-oatmeal hover:text-burning-flame transition-colors">
            <X size={14} />
          </button>
        </div>

        {justAdded && (
          <div className="bg-burning-flame text-abyssal px-4 py-2 flex items-center gap-2 font-pixel animate-slide-up" style={{ fontSize: "8px" }}>
            <Check size={12} strokeWidth={3} />
            ADDED — keep going, or tap ✕ when done
          </div>
        )}

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
            key={amountKey}
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

          {/* Category — tappable chips, faster than a dropdown on mobile */}
          <div>
            <label className="font-pixel block mb-2" style={{ fontSize: "8px" }}>CATEGORY</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const selected = form.category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, category: c })}
                    className={`pixel-btn flex items-center gap-1.5 px-2.5 py-2 font-mono text-xs transition-colors ${
                      selected
                        ? "bg-burning-flame text-abyssal border-abyssal"
                        : "bg-muted text-foreground hover:bg-oatmeal"
                    }`}
                  >
                    <CategoryIconDisplay category={c} size={13} />
                    <span>{getCategoryLabel(c)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>DATE</label>
            <input
              type="date"
              required
              value={form.transactionDate}
              max={new Date().toISOString().slice(0, 10)}
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

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 pixel-btn font-pixel py-3 transition-colors disabled:opacity-60 ${
                type === "income" ? "bg-burning-flame text-abyssal" : "bg-truffle text-palladian"
              }`}
              style={{ fontSize: "9px" }}
            >
              {loading ? "SAVING..." : `► SAVE ${type.toUpperCase()}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="pixel-btn bg-muted text-foreground font-pixel px-4 py-3 transition-colors"
              style={{ fontSize: "9px" }}
            >
              DONE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
