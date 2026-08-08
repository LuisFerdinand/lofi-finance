// utils/goals-helpers.tsx
// ⚠️  NO server imports here — this file is safe to import in client components

import {
  Home,
  Car,
  Plane,
  Laptop,
  Heart,
  GraduationCap,
  Gem,
  Baby,
  PiggyBank,
  Star,
  Shield,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { GoalIcon } from "@/types";

export const GOAL_ICON_MAP: Record<GoalIcon, LucideIcon> = {
  home: Home,
  car: Car,
  plane: Plane,
  laptop: Laptop,
  heart: Heart,
  graduation: GraduationCap,
  ring: Gem,
  baby: Baby,
  piggy: PiggyBank,
  star: Star,
  shield: Shield,
  zap: Zap,
};

export function GoalIconDisplay({
  icon,
  size = 20,
  className,
}: {
  icon: GoalIcon;
  size?: number;
  className?: string;
}) {
  const Icon = GOAL_ICON_MAP[icon] ?? PiggyBank;
  return <Icon size={size} className={className} />;
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
