// utils/transaction-schema.ts
// Request validation shared by the transaction API routes.
import { z } from "zod";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/utils";
import type { Category } from "@/types";

const ALL = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES] as [Category, ...Category[]];

export const categorySchema = z.enum(ALL);
export const transactionTypeSchema = z.enum(["income", "expense"]);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid date");

function categoryMatchesType(data: { type?: "income" | "expense"; category?: Category }) {
  if (!data.type || !data.category) return true;
  return (data.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).includes(data.category);
}
const mismatch = { message: "category doesn't match the transaction type", path: ["category"] };

export const createTransactionSchema = z
  .object({
    type: transactionTypeSchema,
    category: categorySchema,
    amount: z.number().int().positive().max(1_000_000_000_000),
    description: z.string().trim().min(1, "description required").max(200),
    note: z.string().trim().max(500).optional(),
    transactionDate: isoDate,
  })
  .refine(categoryMatchesType, mismatch);

export const updateTransactionSchema = z
  .object({
    type: transactionTypeSchema.optional(),
    category: categorySchema.optional(),
    amount: z.number().int().positive().max(1_000_000_000_000).optional(),
    description: z.string().trim().min(1, "description required").max(200).optional(),
    note: z.string().trim().max(500).nullable().optional(),
    transactionDate: isoDate.optional(),
  })
  .refine(categoryMatchesType, mismatch)
  // Changing the type without a matching category would leave e.g. an income
  // filed under "Food".
  .refine((d) => !d.type || !!d.category, { message: "category required when changing type", path: ["category"] });
