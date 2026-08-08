// components/goals/GoalCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { centsToDisplay } from "@/utils";
import { GoalIconDisplay, calcProgress, calcRemainingDays, calcRequiredPerDay } from "@/utils/goals-helpers"; // ← client-safe
import type { SavingsGoal } from "@/db/schema/goals";
import type { GoalIcon } from "@/types";
import { Pin, PinOff, Trash2, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import ContributeModal from "./ContributeModal";
import Link from "next/link";

interface Props {
  goal: SavingsGoal;
  compact?: boolean;
}

export default function GoalCard({ goal, compact = false }: Props) {
  const router = useRouter();
  const [contributeOpen, setContributeOpen] = useState(false);

  const progress = calcProgress(goal.currentAmount, goal.targetAmount);
  const remaining = goal.targetAmount - goal.currentAmount;
  const daysLeft = calcRemainingDays(goal.deadline);
  const perDay = calcRequiredPerDay(remaining, goal.deadline);

  const isCompleted = goal.status === "completed";
  const isCancelled = goal.status === "cancelled";
  const isOverdue = daysLeft !== null && daysLeft < 0 && !isCompleted;

  async function handleTogglePin() {
    try {
      await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !goal.isPinned }),
      });
      router.refresh();
    } catch { toast.error("failed to update"); }
  }

  async function handleDelete() {
    if (!confirm(`delete goal "${goal.name}"?`)) return;
    try {
      await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      toast.success("goal deleted");
      router.refresh();
    } catch { toast.error("failed to delete"); }
  }

  async function handleMarkComplete() {
    try {
      await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isCompleted ? "active" : "completed" }),
      });
      toast.success(isCompleted ? "goal reopened" : "goal complete! 🎉");
      router.refresh();
    } catch { toast.error("failed to update"); }
  }

  const barColor = isCompleted ? "bg-burning-flame"
    : isOverdue ? "bg-truffle"
    : progress >= 75 ? "bg-burning-flame"
    : "bg-blue-fantastic";

  return (
    <>
      <div className={`pixel-box bg-card group transition-all ${isCancelled ? "opacity-50" : ""}`}>
        {/* Header */}
        <div className={`px-4 py-3 flex items-center justify-between border-b border-border ${
          isCompleted ? "bg-burning-flame/10" : isOverdue ? "bg-truffle/10" : ""
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <GoalIconDisplay icon={goal.icon as GoalIcon} size={22} className="shrink-0 text-abyssal" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-pixel text-xs truncate leading-none">{goal.name}</p>
                {goal.isPinned && (
                  <span className="pixel-tag bg-burning-flame text-abyssal border-abyssal shrink-0" style={{ fontSize: "6px" }}>PINNED</span>
                )}
              </div>
              {goal.notes && !compact && (
                <p className="font-mono text-xs text-muted-foreground mt-1 truncate">{goal.notes}</p>
              )}
            </div>
          </div>
          <div className="shrink-0 ml-2">
            {isCompleted ? (
              <span className="pixel-tag bg-burning-flame text-abyssal border-abyssal" style={{ fontSize: "6px" }}>✓ DONE</span>
            ) : isOverdue ? (
              <span className="pixel-tag bg-truffle text-palladian border-abyssal" style={{ fontSize: "6px" }}>OVERDUE</span>
            ) : daysLeft !== null ? (
              <span className="pixel-tag bg-abyssal text-palladian border-abyssal" style={{ fontSize: "6px" }}>{daysLeft}d LEFT</span>
            ) : null}
          </div>
        </div>

        {/* Progress */}
        <div className="px-4 py-3">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="font-pixel text-burning-flame" style={{ fontSize: "11px" }}>{centsToDisplay(goal.currentAmount)}</p>
              <p className="font-mono text-xs text-muted-foreground">of {centsToDisplay(goal.targetAmount)}</p>
            </div>
            <p className="font-pixel text-foreground" style={{ fontSize: "11px" }}>{progress}%</p>
          </div>

          <div className="h-4 bg-muted border-2 border-abyssal relative overflow-hidden">
            <div className={`h-full transition-all ${barColor}`} style={{ width: `${progress}%` }} />
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{
              backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.4) 3px, rgba(0,0,0,0.4) 4px)",
            }} />
            {progress > 20 && (
              <span className="absolute left-2 top-1/2 -translate-y-1/2 font-pixel text-abyssal" style={{ fontSize: "7px" }}>
                {centsToDisplay(goal.currentAmount)}
              </span>
            )}
          </div>

          {!isCompleted && !isCancelled && perDay && perDay > 0 && !compact && (
            <p className="font-mono text-xs text-muted-foreground mt-2">
              need {centsToDisplay(perDay)}/day to reach goal
            </p>
          )}
        </div>

        {/* Actions */}
        {!compact && (
          <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
            {!isCompleted && !isCancelled && (
              <button onClick={() => setContributeOpen(true)} className="pixel-btn bg-burning-flame text-abyssal font-pixel px-3 py-2 flex-1" style={{ fontSize: "8px" }}>
                + CONTRIBUTE
              </button>
            )}
            <Link href={`/goals/${goal.id}`} className="pixel-btn bg-muted text-foreground font-pixel px-3 py-2 flex items-center gap-1" style={{ fontSize: "8px" }}>
              HISTORY <ChevronRight size={10} />
            </Link>
            <button onClick={handleTogglePin} title={goal.isPinned ? "unpin" : "pin"} className="pixel-btn p-2 bg-muted hover:bg-blue-fantastic hover:text-palladian transition-colors">
              {goal.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
            </button>
            <button onClick={handleMarkComplete} title={isCompleted ? "reopen" : "mark complete"} className="pixel-btn p-2 bg-muted hover:bg-burning-flame hover:text-abyssal transition-colors">
              {isCompleted ? <XCircle size={12} /> : <CheckCircle size={12} />}
            </button>
            <button onClick={handleDelete} title="delete goal" className="pixel-btn p-2 bg-muted text-truffle hover:bg-truffle hover:text-palladian transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        )}

        {compact && !isCompleted && !isCancelled && (
          <div className="px-4 pb-3">
            <button onClick={() => setContributeOpen(true)} className="w-full pixel-btn bg-burning-flame text-abyssal font-pixel py-2" style={{ fontSize: "8px" }}>
              + CONTRIBUTE
            </button>
          </div>
        )}
      </div>

      {contributeOpen && (
        <ContributeModal
          goal={goal}
          onClose={() => setContributeOpen(false)}
          onSuccess={() => { setContributeOpen(false); router.refresh(); }}
        />
      )}
    </>
  );
}