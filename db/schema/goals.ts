// db/schema/goals.ts
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  date,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "completed",
  "cancelled",
]);

export const goalIconEnum = pgEnum("goal_icon", [
  "home",
  "car",
  "plane",
  "laptop",
  "heart",
  "graduation",
  "ring",
  "baby",
  "piggy",
  "star",
  "shield",
  "zap",
]);

export const savings_goals = pgTable("savings_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  notes: text("notes"),
  icon: goalIconEnum("icon").notNull().default("piggy"),
  targetAmount: integer("target_amount").notNull(),
  currentAmount: integer("current_amount").notNull().default(0),
  deadline: date("deadline"),
  status: goalStatusEnum("status").notNull().default("active"),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const goal_contributions = pgTable("goal_contributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id").notNull(),
  userId: uuid("user_id").notNull(),
  transactionId: uuid("transaction_id"),
  amount: integer("amount").notNull(), // positive = deposit, negative = withdrawal
  note: text("note"),
  contributedAt: date("contributed_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SavingsGoal = typeof savings_goals.$inferSelect;
export type NewSavingsGoal = typeof savings_goals.$inferInsert;
export type GoalContribution = typeof goal_contributions.$inferSelect;
export type NewGoalContribution = typeof goal_contributions.$inferInsert;