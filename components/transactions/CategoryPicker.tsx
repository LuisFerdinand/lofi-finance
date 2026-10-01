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
    // Always 3 equal columns with icon-over-label tiles: the label gets the
    // tile's full width and sits centered, so long names ("Entertainment")
    // never push the icon around or wrap unevenly at the modal's desktop width.
    <div role="radiogroup" aria-label="category" className="grid grid-cols-3 gap-2">
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
              "relative flex flex-col items-center justify-center gap-1.5 px-1.5 py-3 min-h-[5.25rem] border-2 text-center transition-colors",
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
            <span className="font-mono text-xs leading-tight w-full text-balance break-words">
              {getCategoryLabel(c)}
            </span>
            {selected && (
              <Check size={12} strokeWidth={3} className="absolute top-1 right-1" aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  );
}
