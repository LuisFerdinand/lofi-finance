// utils/goals-helpers.ts
// ⚠️  NO server imports here — this file is safe to import in client components

import type { GoalIcon } from "@/types";

export const GOAL_ICONS: Record<GoalIcon, string> = {
  home:       "🏠",
  car:        "🚗",
  plane:      "✈️",
  laptop:     "💻",
  heart:      "❤️",
  graduation: "🎓",
  ring:       "💍",
  baby:       "👶",
  piggy:      "🐷",
  star:       "⭐",
  shield:     "🛡️",
  zap:        "⚡",
};

export function getGoalEmoji(icon: GoalIcon): string {
  return GOAL_ICONS[icon] ?? "🐷";
}

export function calcProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

export function calcRemainingDays(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calcRequiredPerDay(
  remaining: number,
  deadline: string | null
): number | null {
  if (!deadline) return null;
  const days = calcRemainingDays(deadline);
  if (!days || days <= 0) return null;
  return Math.ceil(remaining / days);
}