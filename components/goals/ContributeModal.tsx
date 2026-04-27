/* eslint-disable @typescript-eslint/no-explicit-any */
// components/goals/ContributeModal.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, ArrowDownCircle, ArrowUpCircle, Wallet, AlertTriangle } from "lucide-react";
import { centsToDisplay } from "@/utils";
import { calcProgress } from "@/utils/goals-helpers";
import type { SavingsGoal } from "@/db/schema/goals";
import RupiahInput from "@/components/ui/RupiahInput";

interface Props {
  goal: SavingsGoal;
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = "deposit" | "withdraw";

interface BalanceData {
  netBalance: number;
  freeBalance: number;
}

export default function ContributeModal({ goal, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [mode, setMode] = useState<Mode>("deposit");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetch("/api/balance")
      .then((r) => r.json())
      .then((data) => setBalance(data))
      .catch(() => toast.error("couldn't load balance"))
      .finally(() => setBalanceLoading(false));
  }, []);

  const remainingToGoal = Math.max(0, goal.targetAmount - goal.currentAmount);
  const currentProgress = calcProgress(goal.currentAmount, goal.targetAmount);
  const progressAfter = calcProgress(
    goal.currentAmount + (mode === "deposit" ? amount : -amount),
    goal.targetAmount
  );
  const maxDeposit = balance ? Math.max(0, balance.freeBalance) : 0;
  const exceedsBalance = mode === "deposit" && balance !== null && amount > balance.freeBalance;
  const exceedsGoalRemaining = mode === "deposit" && amount > remainingToGoal && remainingToGoal > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || amount <= 0) { toast.error("enter a valid amount"); return; }
    if (mode === "deposit" && balance && amount > balance.freeBalance) {
      toast.error("amount exceeds your available balance"); return;
    }
    if (mode === "withdraw" && amount > goal.currentAmount) {
      toast.error("cannot withdraw more than current savings"); return;
    }
    setLoading(true);
    try {
      const payload: Record<string, any> = {
        amount: mode === "deposit" ? amount : -amount,
        contributedAt: date,
        note: note || undefined,
      };
      // Only pass transactionId if user manually typed one
      if (transactionId.trim()) payload.transactionId = transactionId.trim();

      const res = await fetch(`/api/goals/${goal.id}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const updated = await res.json();
      if (updated.status === "completed") toast.success("🎉 Goal reached! Congratulations!");
      else toast.success(mode === "deposit" ? "contribution saved!" : "withdrawal recorded");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-abyssal/70 z-50 flex items-end md:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="pixel-box bg-card w-full max-w-md animate-slide-up max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className={`px-4 py-3 flex items-center justify-between sticky top-0 ${
          mode === "deposit" ? "bg-abyssal" : "bg-truffle"
        } text-palladian`}>
          <div className="flex items-center gap-2">
            {mode === "deposit"
              ? <ArrowDownCircle size={14} className="text-burning-flame" />
              : <ArrowUpCircle size={14} />}
            <span className="font-pixel text-xs">{goal.name}</span>
          </div>
          <button onClick={onClose} className="text-oatmeal hover:text-burning-flame transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Balance panel */}
        <div className="px-4 pt-4 pb-2">
          <div className={`pixel-box-sm p-3 ${
            balanceLoading ? "bg-muted"
            : balance && balance.freeBalance > 0 ? "bg-blue-fantastic"
            : "bg-truffle/20"
          }`}>
            {balanceLoading ? (
              <p className="font-pixel text-muted-foreground animate-pixel-blink" style={{ fontSize: "8px" }}>
                loading balance...
              </p>
            ) : balance ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet size={14} className="text-burning-flame shrink-0" />
                  <p className="font-pixel text-palladian" style={{ fontSize: "8px" }}>
                    AVAILABLE BALANCE
                  </p>
                </div>
                <p className={`font-pixel ${balance.freeBalance > 0 ? "text-burning-flame" : "text-truffle"}`}
                  style={{ fontSize: "12px" }}>
                  {centsToDisplay(balance.freeBalance)}
                </p>
              </div>
            ) : (
              <p className="font-mono text-xs text-muted-foreground">balance unavailable</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-2">
          <div className="flex justify-between mb-1">
            <span className="font-mono text-xs text-muted-foreground">
              {centsToDisplay(goal.currentAmount)} / {centsToDisplay(goal.targetAmount)}
            </span>
            <span className="font-pixel text-muted-foreground" style={{ fontSize: "8px" }}>
              {currentProgress}%{amount > 0 ? ` → ${progressAfter}%` : ""}
            </span>
          </div>
          <div className="h-2 bg-muted border border-abyssal overflow-hidden">
            <div className="h-full bg-oatmeal" style={{ width: `${currentProgress}%` }} />
          </div>
          {amount > 0 && (
            <div className="h-2 bg-muted border border-abyssal overflow-hidden mt-0.5">
              <div
                className={`h-full transition-all ${mode === "deposit" ? "bg-burning-flame" : "bg-truffle"}`}
                style={{ width: `${progressAfter}%` }}
              />
            </div>
          )}
          {amount > 0 && (
            <p className="font-mono text-xs text-muted-foreground mt-1">
              after: {centsToDisplay(
                mode === "deposit"
                  ? goal.currentAmount + amount
                  : goal.currentAmount - amount
              )}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            {(["deposit", "withdraw"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setAmount(0); }}
                className={`flex-1 pixel-btn font-pixel py-2 flex items-center justify-center gap-1 transition-colors ${
                  mode === m
                    ? m === "deposit" ? "bg-burning-flame text-abyssal" : "bg-truffle text-palladian"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
                style={{ fontSize: "8px" }}
              >
                {m === "deposit"
                  ? <><ArrowDownCircle size={10} /> DEPOSIT</>
                  : <><ArrowUpCircle size={10} /> WITHDRAW</>}
              </button>
            ))}
          </div>

          {/* Quick fill — deposit only */}
          {mode === "deposit" && (
            <div>
              <p className="font-pixel mb-2" style={{ fontSize: "7px" }}>QUICK FILL</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "25% of remaining", val: Math.floor(remainingToGoal * 0.25) },
                  { label: "50% of remaining", val: Math.floor(remainingToGoal * 0.5) },
                  { label: "Complete goal",    val: remainingToGoal },
                  { label: "All balance",      val: maxDeposit },
                ]
                  .filter(({ val }) => val > 0)
                  .map(({ label, val }) => {
                    // Cap each preset at the available balance
                    const capped = Math.min(val, maxDeposit);
                    return (
                      <button
                        key={label}
                        type="button"
                        disabled={capped <= 0}
                        onClick={() => setAmount(capped)}
                        className={`pixel-btn font-mono text-xs px-2 py-2 text-left transition-colors
                          disabled:opacity-40 disabled:cursor-not-allowed
                          ${amount === capped && capped > 0
                            ? "bg-burning-flame text-abyssal"
                            : "bg-muted hover:bg-blue-fantastic hover:text-palladian"
                          }`}
                      >
                        <span className="block text-current opacity-70" style={{ fontSize: "9px" }}>
                          {label}
                        </span>
                        <span className="block font-pixel" style={{ fontSize: "8px" }}>
                          {centsToDisplay(capped)}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Withdraw quick fill */}
          {mode === "withdraw" && goal.currentAmount > 0 && (
            <div>
              <p className="font-pixel mb-2" style={{ fontSize: "7px" }}>QUICK WITHDRAW</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "25%", val: Math.floor(goal.currentAmount * 0.25) },
                  { label: "50%", val: Math.floor(goal.currentAmount * 0.5) },
                  { label: "ALL", val: goal.currentAmount },
                ]
                  .filter(({ val }) => val > 0)
                  .map(({ label, val }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`pixel-btn font-mono text-xs px-2 py-2 text-left transition-colors
                        ${amount === val
                          ? "bg-truffle text-palladian"
                          : "bg-muted hover:bg-truffle hover:text-palladian"
                        }`}
                    >
                      <span className="block opacity-70" style={{ fontSize: "9px" }}>{label}</span>
                      <span className="block font-pixel" style={{ fontSize: "8px" }}>{centsToDisplay(val)}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Amount input */}
          <div>
            <RupiahInput value={amount} onChange={setAmount} required />

            {exceedsBalance && (
              <div className="mt-2 flex items-center gap-2 pixel-box-sm bg-truffle/20 p-2">
                <AlertTriangle size={12} className="text-truffle shrink-0" />
                <p className="font-mono text-xs text-truffle">
                  exceeds available balance ({centsToDisplay(balance!.freeBalance)})
                </p>
              </div>
            )}
            {!exceedsBalance && exceedsGoalRemaining && (
              <div className="mt-2 flex items-center gap-2 pixel-box-sm bg-burning-flame/20 p-2">
                <AlertTriangle size={12} className="text-burning-flame shrink-0" />
                <p className="font-mono text-xs text-foreground">
                  overshoots goal by {centsToDisplay(amount - remainingToGoal)}
                </p>
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>DATE</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none placeholder:text-muted-foreground"
              placeholder="e.g. monthly savings transfer"
            />
          </div>

          {/* Manual transaction link */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>
              LINK EXISTING TRANSACTION <span className="text-muted-foreground">(optional — leave blank to auto-create)</span>
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-xs focus:outline-none placeholder:text-muted-foreground"
              placeholder="paste transaction UUID"
            />
          </div>

          <button
            type="submit"
            disabled={loading || exceedsBalance || balanceLoading}
            className={`w-full pixel-btn font-pixel py-3 disabled:opacity-60 transition-colors ${
              mode === "deposit" ? "bg-burning-flame text-abyssal" : "bg-truffle text-palladian"
            }`}
            style={{ fontSize: "9px" }}
          >
            {loading
              ? "SAVING..."
              : mode === "deposit"
              ? `► SAVE ${amount > 0 ? centsToDisplay(amount) : ""} TO GOAL`
              : `► WITHDRAW ${amount > 0 ? centsToDisplay(amount) : ""} FROM GOAL`}
          </button>
        </form>
      </div>
    </div>
  );
}