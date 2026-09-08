// db/schema/projects.ts
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  date,
  pgEnum,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/** One row of a todo's checklist — stored as a JSONB array on the todo itself. */
export type ChecklistItem = { id: string; text: string; done: boolean };

export const projectStatusEnum = pgEnum("project_status", [
  "active",
  "completed",
  "archived",
]);

export const todoStatusEnum = pgEnum("todo_status", [
  "open",
  "in_progress",
  "on_hold",
  "done",
  "cancelled",
]);

export const todoPriorityEnum = pgEnum("todo_priority", [
  "low",
  "medium",
  "high",
]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  // Key into the shared icon map (utils/projects-helpers.tsx) — plain text
  // rather than an enum so new icons can be added without a migration.
  icon: text("icon").notNull().default("folder"),
  status: projectStatusEnum("status").notNull().default("active"),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const todos = pgTable("todos", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  notes: text("notes"),
  // Optional working context attached to a task.
  imageUrl: text("image_url"),
  link: text("link"),
  checklist: jsonb("checklist")
    .$type<ChecklistItem[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  status: todoStatusEnum("status").notNull().default("open"),
  priority: todoPriorityEnum("priority").notNull().default("medium"),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
