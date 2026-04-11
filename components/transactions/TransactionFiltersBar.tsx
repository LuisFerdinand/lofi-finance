// src/components/transactions/TransactionFiltersBar.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, getCategoryLabel } from "@/utils";
import type { TransactionFilters } from "@/types";
import { Search, X } from "lucide-react";
import { useState, useTransition } from "react";

interface Props {
  currentFilters: TransactionFilters;
}

export default function TransactionFiltersBar({ currentFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentFilters.search ?? "");

  function updateFilter(key: string, value: string) {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    url.searchParams.set("page", "1");
    startTransition(() => router.push(url.toString()));
  }

  function clearAll() {
    const url = new URL(window.location.href);
    ["type", "category", "search"].forEach((k) => url.searchParams.delete(k));
    url.searchParams.set("page", "1");
    setSearch("");
    startTransition(() => router.push(url.toString()));
  }

  const hasFilters = !!(currentFilters.type || currentFilters.category || currentFilters.search);
  const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateFilter("search", search)}
            className="w-full pixel-inset bg-background pl-8 pr-3 py-2 font-mono text-xs focus:outline-none focus:border-burning-flame placeholder:text-muted-foreground"
            placeholder="search description or note..."
          />
        </div>
        <button
          onClick={() => updateFilter("search", search)}
          className="pixel-btn bg-abyssal text-palladian font-pixel px-3 py-2"
          style={{ fontSize: "8px" }}
        >
          GO
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Type filter */}
        <select
          value={currentFilters.type ?? ""}
          onChange={(e) => updateFilter("type", e.target.value)}
          className="pixel-inset bg-background font-mono text-xs px-2 py-1.5 focus:outline-none"
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        {/* Category filter */}
        <select
          value={currentFilters.category ?? ""}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="pixel-inset bg-background font-mono text-xs px-2 py-1.5 focus:outline-none"
        >
          <option value="">All categories</option>
          <optgroup label="Income">
            {INCOME_CATEGORIES.map((c) => (
              <option key={c} value={c}>{getCategoryLabel(c)}</option>
            ))}
          </optgroup>
          <optgroup label="Expenses">
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{getCategoryLabel(c)}</option>
            ))}
          </optgroup>
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 font-pixel text-truffle hover:underline"
            style={{ fontSize: "8px" }}
          >
            <X size={10} /> CLEAR
          </button>
        )}

        {isPending && (
          <span className="font-pixel text-muted-foreground animate-pixel-blink" style={{ fontSize: "8px" }}>
            loading...
          </span>
        )}
      </div>
    </div>
  );
}
