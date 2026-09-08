// utils/task-reminder.ts
import "server-only";
import { format, parseISO } from "date-fns";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { getAllTodos, type TodoWithProject } from "@/utils/projects";

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
const ACTIVE = new Set(["open", "in_progress", "on_hold"]);

export interface ReminderDigest {
  user: { id: string; name: string; email: string };
  tasks: TodoWithProject[];
}

/**
 * One digest per active user that currently has at least one active task,
 * with that user's tasks ordered by priority (high → low) then soonest due date.
 */
export async function getActiveTaskDigests(): Promise<ReminderDigest[]> {
  const activeUsers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.isActive, true));

  const digests: ReminderDigest[] = [];
  for (const u of activeUsers) {
    const tasks = (await getAllTodos(u.id))
      .filter((t) => ACTIVE.has(t.status))
      .sort((a, b) => {
        const p = (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
        if (p !== 0) return p;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });
    if (tasks.length > 0) digests.push({ user: u, tasks });
  }
  return digests;
}

// ─── Email rendering (email-client-safe: tables + inline styles only) ────────

const C = {
  bg: "#eee9df",
  ink: "#1b2632",
  paper: "#f5f1eb",
  line: "#ccc5b8",
  muted: "#6b6258",
  faint: "#9a9388",
  flame: "#ffb162",
  flameInk: "#9a5b12",
  truffle: "#a35139",
  blue: "#2c3b4d",
  low: "#ddd8cf",
  danger: "#c0392b",
};

const PRIORITY_BADGE: Record<string, { bg: string; fg: string }> = {
  high: { bg: C.truffle, fg: C.bg },
  medium: { bg: C.blue, fg: C.bg },
  low: { bg: C.low, fg: C.ink },
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

function fmtDue(dueDate: string | null, today: string): { label: string; color: string } {
  if (!dueDate) return { label: "—", color: C.faint };
  const nice = format(parseISO(dueDate), "d MMM");
  if (dueDate < today) return { label: `overdue · ${nice}`, color: C.danger };
  if (dueDate === today) return { label: "today", color: C.flameInk };
  return { label: nice, color: C.muted };
}

export function renderReminderEmail(digest: ReminderDigest): {
  subject: string;
  html: string;
  text: string;
} {
  const today = new Date().toISOString().slice(0, 10);
  const dateLabel = format(new Date(), "EEEE, d MMMM yyyy");
  const { name } = digest.user;
  const tasks = digest.tasks;
  const highCount = tasks.filter((t) => t.priority === "high").length;
  const overdue = tasks.filter((t) => t.dueDate && t.dueDate < today).length;

  const appUrl = (process.env.AUTH_URL || process.env.VERCEL_URL || "").replace(/\/$/, "");
  const boardHref = appUrl ? `${appUrl.startsWith("http") ? appUrl : `https://${appUrl}`}/tasks` : "#";

  const subject =
    tasks.length === 0
      ? "You're all caught up ✓"
      : `${tasks.length} task${tasks.length === 1 ? "" : "s"} for today${
          highCount ? ` · ${highCount} high priority` : ""
        }`;

  const rows = tasks
    .map((t, i) => {
      const badge = PRIORITY_BADGE[t.priority] ?? PRIORITY_BADGE.medium;
      const due = fmtDue(t.dueDate, today);
      const list = t.checklist ?? [];
      const checklist =
        list.length > 0
          ? ` <span style="color:${C.muted};font-size:11px;">(${list.filter((c) => c.done).length}/${list.length})</span>`
          : "";
      const rowBg = i % 2 === 0 ? C.paper : C.bg;
      return `
      <tr style="background:${rowBg};">
        <td style="padding:8px 10px;border-top:1px solid ${C.line};white-space:nowrap;vertical-align:top;">
          <span style="display:inline-block;background:${badge.bg};color:${badge.fg};font-size:10px;font-weight:bold;letter-spacing:.5px;padding:2px 6px;border:1px solid ${C.ink};">${t.priority.toUpperCase()}</span>
        </td>
        <td style="padding:8px 10px;border-top:1px solid ${C.line};font-size:13px;color:${C.ink};">${esc(t.title)}${checklist}</td>
        <td style="padding:8px 10px;border-top:1px solid ${C.line};font-size:12px;color:${C.muted};white-space:nowrap;">${esc(t.projectName)}</td>
        <td style="padding:8px 10px;border-top:1px solid ${C.line};font-size:12px;color:${due.color};white-space:nowrap;">${due.label}</td>
      </tr>`;
    })
    .join("");

  const body =
    tasks.length === 0
      ? `<tr><td style="padding:24px 20px;font-size:13px;color:${C.muted};">Nothing active right now — enjoy the clear runway. ☕</td></tr>`
      : `
      <tr><td style="padding:16px 20px 10px;font-size:13px;color:${C.ink};">
        Morning ${esc(name)} — here's what's open, by priority${overdue ? ` <span style="color:${C.danger};">(${overdue} overdue)</span>` : ""}:
      </td></tr>
      <tr><td style="padding:0 20px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:2px solid ${C.ink};">
          <tr style="background:${C.ink};color:${C.bg};">
            <th align="left" style="padding:8px 10px;font-size:11px;letter-spacing:.5px;">PRIORITY</th>
            <th align="left" style="padding:8px 10px;font-size:11px;letter-spacing:.5px;">TASK</th>
            <th align="left" style="padding:8px 10px;font-size:11px;letter-spacing:.5px;">PROJECT</th>
            <th align="left" style="padding:8px 10px;font-size:11px;letter-spacing:.5px;">DUE</th>
          </tr>
          ${rows}
        </table>
      </td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;font-family:'Courier New',Courier,monospace;border:2px solid ${C.ink};background:${C.paper};">
  <tr><td style="background:${C.ink};color:${C.bg};padding:16px 20px;">
    <div style="font-size:13px;font-weight:bold;letter-spacing:1px;">LOFI FINANCE · DAILY TASKS</div>
    <div style="font-size:12px;color:#c9c1b1;margin-top:4px;">${dateLabel} · ${tasks.length} active</div>
  </td></tr>
  ${body}
  <tr><td style="padding:0 20px 22px;">
    <a href="${boardHref}" style="display:inline-block;background:${C.flame};color:${C.ink};text-decoration:none;font-weight:bold;font-size:12px;letter-spacing:.5px;padding:10px 16px;border:2px solid ${C.ink};">OPEN TASK BOARD &rarr;</a>
  </td></tr>
  <tr><td style="padding:12px 20px;border-top:1px solid ${C.line};font-size:11px;color:${C.muted};">
    Sent every morning by your Lofi Finance reminder. Tasks are your active items (open / in progress / on hold), ordered by priority then due date.
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    `LOFI FINANCE — DAILY TASKS`,
    `${dateLabel} · ${tasks.length} active`,
    ``,
    ...(tasks.length === 0
      ? ["Nothing active right now."]
      : tasks.map((t) => {
          const due = fmtDue(t.dueDate, today);
          return `- [${t.priority.toUpperCase()}] ${t.title} (${t.projectName}) — due: ${due.label}`;
        })),
    ``,
    boardHref !== "#" ? `Open: ${boardHref}` : ``,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

// ─── Sending (Resend, via fetch — no SDK dependency) ─────────────────────────

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendReminderEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  const from = process.env.REMINDER_FROM || "Lofi Finance <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend responded ${res.status}: ${detail.slice(0, 300)}`);
  }
}
