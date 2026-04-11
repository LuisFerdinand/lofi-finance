// src/utils/index.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import type { Category, TransactionType } from "@/types";

// ─── Tailwind Utility ───────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency ───────────────────────────────────────────────────────────────

/** Store amounts as cents (integer). Use these helpers everywhere. */
export function centsToDisplay(cents: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents);
}

/** For Rupiah we store the raw integer value (no cent subdivision).
 *  These aliases keep the rest of the codebase unchanged. */
export function dollarsToCents(rupiah: number): number {
  return Math.round(rupiah);
}

export function centsToDollars(cents: number): number {
  return cents;
}

// ─── Date ───────────────────────────────────────────────────────────────────

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy");
}

export function formatMonth(month: number, year: number): string {
  return format(new Date(year, month - 1, 1), "MMMM yyyy");
}

export function getMonthRange(month: number, year: number) {
  const date = new Date(year, month - 1, 1);
  return {
    start: format(startOfMonth(date), "yyyy-MM-dd"),
    end: format(endOfMonth(date), "yyyy-MM-dd"),
  };
}

export function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function getLast6Months(): { month: number; year: number; label: string }[] {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: format(d, "MMM yyyy"),
    });
  }
  return months;
}

// ─── Category ───────────────────────────────────────────────────────────────

export const INCOME_CATEGORIES: Category[] = [
  "salary",
  "freelance",
  "investment",
  "gift",
  "other_income",
];

export const EXPENSE_CATEGORIES: Category[] = [
  "food",
  "transport",
  "housing",
  "entertainment",
  "health",
  "shopping",
  "education",
  "utilities",
  "other_expense",
];

export function getCategoryLabel(category: Category): string {
  const labels: Record<Category, string> = {
    salary: "Salary",
    freelance: "Freelance",
    investment: "Investment",
    gift: "Gift",
    other_income: "Other Income",
    food: "Food & Drink",
    transport: "Transport",
    housing: "Housing",
    entertainment: "Entertainment",
    health: "Health",
    shopping: "Shopping",
    education: "Education",
    utilities: "Utilities",
    other_expense: "Other Expense",
  };
  return labels[category] ?? category;
}

export function getCategoryEmoji(category: Category): string {
  const emojis: Record<Category, string> = {
    salary: "💼",
    freelance: "🎨",
    investment: "📈",
    gift: "🎁",
    other_income: "💰",
    food: "🍜",
    transport: "🚌",
    housing: "🏠",
    entertainment: "🎮",
    health: "💊",
    shopping: "🛒",
    education: "📚",
    utilities: "💡",
    other_expense: "📦",
  };
  return emojis[category] ?? "💸";
}

export function isIncomeCategory(category: Category): boolean {
  return INCOME_CATEGORIES.includes(category);
}

export function getCategoriesByType(type: TransactionType): Category[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export function calcPercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function calcSavingsRate(income: number, expense: number): number {
  if (income === 0) return 0;
  return Math.round(((income - expense) / income) * 100);
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function getPaginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

// ─── String ──────────────────────────────────────────────────────────────────

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "…" : str;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Color ───────────────────────────────────────────────────────────────────

export function getTransactionColor(type: TransactionType): string {
  return type === "income" ? "text-burning-flame" : "text-truffle";
}

export function getAmountColor(amount: number): string {
  return amount >= 0 ? "text-burning-flame" : "text-truffle";
}

// ─── Rupiah Input Formatting ─────────────────────────────────────────────────

/**
 * Format a raw numeric string into a display string like "50.000"
 * (dot-separated thousands, no currency symbol) — used for live input preview.
 */
export function formatRupiahInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

/**
 * Strip all non-digit characters so the formatted display value can be
 * converted back to a plain integer for the API.
 */
export function parseRupiahInput(formatted: string): number {
  return parseInt(formatted.replace(/\D/g, "") || "0", 10);
}