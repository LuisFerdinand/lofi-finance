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
  doublePrecision,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/** One row of a todo's checklist — stored as a JSONB array on the todo itself. */
export type ChecklistItem = { id: string; text: string; done: boolean };
/** A labeled reference link on a todo (Figma, PR, doc…). */
export type TodoLink = { id: string; label: string; url: string };
/** An uploaded image attachment on a todo (Cloudinary secure_url). */
export type TodoImage = { id: string; url: string; name?: string };

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
  // Null means a standalone task with no project — a quick personal note.
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  notes: text("notes"),
  // Legacy single attachment fields — superseded by `images` / `links` below.
  // Still read (folded into the arrays by toTaskItem) so older rows keep their
  // attachments; new writes clear them.
  imageUrl: text("image_url"),
  link: text("link"),
  links: jsonb("links")
    .$type<TodoLink[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  images: jsonb("images")
    .$type<TodoImage[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  checklist: jsonb("checklist")
    .$type<ChecklistItem[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  status: todoStatusEnum("status").notNull().default("open"),
  priority: todoPriorityEnum("priority").notNull().default("medium"),
  // Manual rank within a board column (fractional, so a drop between two cards
  // only rewrites the moved card). Null = never ranked → falls back to the
  // default priority/due-date order, after ranked cards.
  sortOrder: doublePrecision("sort_order"),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
