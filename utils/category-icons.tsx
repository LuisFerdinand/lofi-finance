// utils/category-icons.tsx
// ⚠️  NO server imports here — this file is safe to import in client components

import {
  Briefcase,
  PenTool,
  TrendingUp,
  Gift,
  Wallet,
  UtensilsCrossed,
  Bus,
  Home,
  Gamepad2,
  HeartPulse,
  ShoppingCart,
  BookOpen,
  Lightbulb,
  Package,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/types";

export const CATEGORY_ICON_MAP: Record<Category, LucideIcon> = {
  salary: Briefcase,
  freelance: PenTool,
  investment: TrendingUp,
  gift: Gift,
  other_income: Wallet,
  food: UtensilsCrossed,
  transport: Bus,
  housing: Home,
  entertainment: Gamepad2,
  health: HeartPulse,
  shopping: ShoppingCart,
  education: BookOpen,
  utilities: Lightbulb,
  other_expense: Package,
};

export function CategoryIconDisplay({
  category,
  size = 16,
  className,
}: {
  category: Category;
  size?: number;
  className?: string;
}) {
  const Icon = CATEGORY_ICON_MAP[category] ?? Package;
  return <Icon size={size} className={className} />;
}
