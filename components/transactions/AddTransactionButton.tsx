// components/transactions/AddTransactionButton.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
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
  const [presetType, setPresetType] = useState<TransactionType | null>(null);

  // Phone shortcut support: opening /transactions?add=expense (or ?add=income,
  // or ?add=1) — e.g. from a home-screen / PWA app-icon shortcut — pops the
  // sheet straight open, with the type preselected. The param is then stripped
  // from the URL so a refresh or back-navigation doesn't reopen it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const add = params.get("add");
    if (!add) return;

    // One-time init from the URL after mount (window isn't available during
    // SSR, and the modal's presence differs from the server-rendered HTML, so
    // this can't be a lazy useState initializer without a hydration mismatch).
    /* eslint-disable react-hooks/set-state-in-effect */
    if (add === "income" || add === "expense") setPresetType(add);
    setOpen(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    params.delete("add");
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (qs ? `?${qs}` : "")
    );
  }, []);

  return (
    <>
      <button
        onClick={() => { setPresetType(null); setOpen(true); }}
        className="hidden md:flex pixel-btn bg-burning-flame text-abyssal font-pixel px-4 py-2 items-center gap-2 shrink-0"
        style={{ fontSize: "9px" }}
      >
        <Plus size={12} /> ADD
      </button>
      <FabButton
        icon={Plus}
        label="add transaction"
        onClick={() => { setPresetType(null); setOpen(true); }}
      />

      {open && (
        <AddModal presetType={presetType} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function AddModal({
  presetType,
  onClose,
}: {
  presetType: TransactionType | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const last = readLastTxn();
  const initialType: TransactionType = presetType ?? last?.type ?? "expense";
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<number>(0);
  const [form, setForm] = useState({
    // only reuse the last category when it belongs to the type we're opening with
    category: last?.type === initialType ? (last?.category ?? "") : "",
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
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "failed to add");
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
          <button onClick={onClose} aria-label="Close" className="text-oatmeal hover:text-burning-flame transition-colors">
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
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
