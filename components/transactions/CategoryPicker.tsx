// components/transactions/CategoryPicker.tsx
"use client";

import { Check } from "lucide-react";
import { cn, getCategoriesByType, getCategoryLabel } from "@/utils";
import { CategoryIconDisplay } from "@/utils/category-icons";
import type { Category, TransactionType } from "@/types";

// Tappable icon grid used by both the add and edit transaction forms — one
// tap instead of a dropdown, every option visible, and the selection tinted
// with the transaction type's color so it's obvious at a glance.
export default function CategoryPicker({
  type,
  value,
  onChange,
}: {
  type: TransactionType;
  value: string;
  onChange: (category: Category) => void;
}) {
  const categories = getCategoriesByType(type);
  const selectedCls =
    type === "income" ? "bg-burning-flame text-abyssal border-abyssal" : "bg-truffle text-palladian border-abyssal";

  return (
    <div role="radiogroup" aria-label="category" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {categories.map((c) => {
        const selected = value === c;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(c)}
            className={cn(
              "relative flex items-center gap-2 px-2.5 py-2.5 border-2 text-left transition-colors",
              selected
                ? cn(selectedCls, "shadow-[2px_2px_0_var(--abyssal)]")
                : "bg-background border-border hover:border-abyssal hover:bg-muted"
            )}
          >
            <span
              className={cn(
                "w-8 h-8 shrink-0 flex items-center justify-center border-2",
                selected ? "border-current bg-black/10" : "border-border bg-muted"
              )}
            >
              <CategoryIconDisplay category={c} size={16} />
            </span>
            <span className="font-mono text-sm leading-tight min-w-0 break-words">{getCategoryLabel(c)}</span>
            {selected && (
              <Check size={14} strokeWidth={3} className="absolute top-1 right-1" aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  );
}
