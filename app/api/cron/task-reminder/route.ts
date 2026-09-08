// app/api/cron/task-reminder/route.ts
//
// Daily "here are your active tasks" email. Three ways to hit it:
//   • Vercel Cron       → GET with header `Authorization: Bearer <CRON_SECRET>`
//                          → emails every active user their own digest
//   • Logged-in browser → GET while signed in
//                          → emails ONLY you (a live test send)
//   • ?preview=1         → GET while signed in
//                          → returns your email's HTML in the browser, sends nothing
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  emailConfigured,
  getActiveTaskDigests,
  renderReminderEmail,
  sendReminderEmail,
  type ReminderDigest,
} from "@/utils/task-reminder";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const isCron =
    !!cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`;

  const session = isCron ? null : await auth();
  if (!isCron && !session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const digests = await getActiveTaskDigests();
  const scoped = isCron
    ? digests
    : digests.filter((d) => d.user.id === session!.user.id);

  // Preview the layout without sending anything.
  if (req.nextUrl.searchParams.get("preview")) {
    const target: ReminderDigest =
      scoped[0] ?? {
        user: {
          id: session?.user.id ?? "",
          name: session?.user.name ?? "there",
          email: session?.user.email ?? "",
        },
        tasks: [],
      };
    const { html } = renderReminderEmail(target);
    return new NextResponse(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  if (!emailConfigured()) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not set — see setup notes" },
      { status: 503 }
    );
  }

  const results: Array<Record<string, unknown>> = [];
  for (const digest of scoped) {
    try {
      const { subject, html, text } = renderReminderEmail(digest);
      await sendReminderEmail(digest.user.email, subject, html, text);
      results.push({ email: digest.user.email, tasks: digest.tasks.length, sent: true });
    } catch (err) {
      results.push({
        email: digest.user.email,
        sent: false,
        error: err instanceof Error ? err.message : "send failed",
      });
    }
  }

  return NextResponse.json({
    mode: isCron ? "cron" : "test",
    usersWithActiveTasks: scoped.length,
    results,
    note:
      scoped.length === 0
        ? isCron
          ? "no active users have active tasks — nothing to send"
          : "you have no active tasks — nothing to send"
        : undefined,
  });
}
