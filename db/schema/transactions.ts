// src/db/schema/transactions.ts
import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
]);

export const categoryEnum = pgEnum("category", [
  // Income categories
  "salary",
  "freelance",
  "investment",
  "gift",
  "other_income",
  // Expense categories
  "food",
  "transport",
  "housing",
  "entertainment",
  "health",
  "shopping",
  "education",
  "utilities",
  "other_expense",
]);

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  category: categoryEnum("category").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  note: text("note"),
  transactionDate: date("transaction_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;