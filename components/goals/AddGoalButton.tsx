// components/goals/AddGoalButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { todayISO } from "@/utils";
import { GOAL_ICON_MAP } from "@/utils/goals-helpers"; // ← client-safe import
import type { GoalIcon } from "@/types";
import RupiahInput from "@/components/ui/RupiahInput";
import IconPicker from "@/components/ui/IconPicker";
import FabButton from "@/components/ui/FabButton";
import Modal from "@/components/ui/Modal";

export default function AddGoalButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex pixel-btn bg-burning-flame text-abyssal font-pixel px-4 py-2 items-center gap-2 shrink-0"
        style={{ fontSize: "11px" }}
      >
        <Plus size={12} /> NEW GOAL
      </button>
      <FabButton icon={Plus} label="new goal" onClick={() => setOpen(true)} />
      {open && <AddGoalModal onClose={() => setOpen(false)} />}
    </>
  );
}

function AddGoalModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [targetAmount, setTargetAmount] = useState(0);
  const [form, setForm] = useState({
    name: "",
    notes: "",
    icon: "piggy" as GoalIcon,
    deadline: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetAmount || targetAmount <= 0) { toast.error("enter a target amount"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          targetAmount,
          deadline: form.deadline || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "failed to create goal");
      }
      toast.success("goal created!");
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "failed to create goal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="NEW SAVINGS GOAL">
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Icon picker */}
          <div>
            <label className="font-pixel block mb-2" style={{ fontSize: "10px" }}>ICON</label>
            <IconPicker
              icons={GOAL_ICON_MAP}
              value={form.icon}
              onChange={(icon) => setForm({ ...form, icon })}
            />
          </div>

          {/* Name */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "10px" }}>GOAL NAME</label>
            <input
              type="text"
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:border-burning-flame placeholder:text-muted-foreground"
              placeholder="e.g. New Laptop, Emergency Fund..."
            />
          </div>

          {/* Target amount */}
          <RupiahInput value={targetAmount} onChange={setTargetAmount} required label="TARGET AMOUNT (Rp)" />

          {/* Deadline */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "10px" }}>
              DEADLINE <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="date"
              value={form.deadline}
              min={todayISO()}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "10px" }}>
              NOTES <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none placeholder:text-muted-foreground resize-none"
              placeholder="Why are you saving for this?"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full pixel-btn bg-burning-flame text-abyssal font-pixel py-3 disabled:opacity-60"
            style={{ fontSize: "11px" }}
          >
            {loading ? "CREATING..." : "► CREATE GOAL"}
          </button>
        </form>
    </Modal>
  );
}