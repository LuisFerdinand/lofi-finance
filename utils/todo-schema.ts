// utils/todo-schema.ts
// Request validation shared by the todo API routes.
import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid date");

// z.string().url() alone accepts `javascript:` / `data:` URLs, which would then
// be rendered as clickable hrefs — only allow real web links.
const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .url()
  .refine((u) => /^https?:\/\//i.test(u), "only http(s) links are allowed");

const httpsUrl = z
  .string()
  .trim()
  .max(1000)
  .url()
  .refine((u) => /^https:\/\//i.test(u), "images must be https");

export const todoStatus = z.enum(["open", "in_progress", "on_hold", "done", "cancelled"]);
export const todoPriority = z.enum(["low", "medium", "high"]);

export const checklistSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(64),
      text: z.string().trim().min(1).max(200),
      done: z.boolean(),
    })
  )
  .max(50);

export const linksSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(64),
      label: z.string().trim().max(80),
      url: httpUrl,
    })
  )
  .max(20, "up to 20 links per task");

export const imagesSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(64),
      url: httpsUrl,
      name: z.string().max(120).optional(),
    })
  )
  .max(12, "up to 12 images per task");

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, "title required").max(200),
  notes: z.string().max(5000).optional(),
  status: todoStatus.optional(),
  priority: todoPriority.default("medium"),
  dueDate: isoDate.nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
});

export const updateTodoSchema = z.object({
  title: z.string().trim().min(1, "title required").max(200).optional(),
  notes: z.string().max(5000).nullable().optional(),
  // Legacy single-attachment fields — the app only ever clears them now.
  imageUrl: z.null().optional(),
  link: z.null().optional(),
  links: linksSchema.optional(),
  images: imagesSchema.optional(),
  checklist: checklistSchema.optional(),
  status: todoStatus.optional(),
  priority: todoPriority.optional(),
  dueDate: isoDate.nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().finite().nullable().optional(),
});

export const reorderSchema = z.object({
  moves: z
    .array(
      z.object({
        id: z.string().uuid(),
        sortOrder: z.number().finite(),
        status: todoStatus.optional(),
      })
    )
    .min(1)
    .max(200),
});

export function firstZodMessage(err: z.ZodError): string {
  const issue = err.errors[0];
  if (!issue) return "invalid request";
  const path = issue.path.filter((p) => typeof p === "string").join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}
