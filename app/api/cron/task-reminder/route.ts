// app/api/cron/task-reminder/route.ts
//
// Daily "here are your active tasks" email. Three ways to hit it:
//   • Vercel Cron       → GET with header `Authorization: Bearer <CRON_SECRET>`
//                          (Vercel also sends `user-agent: vercel-cron/1.0` and an
//                          `x-vercel-cron-schedule` header)
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

// Resend's free tier allows ~2 requests/second — space out sends on the cron
// path (many recipients) so we don't get 429'd partway through.
const SEND_GAP_MS = 550;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(req: NextRequest) {
  // Vercel injects the secret as `Authorization: Bearer <CRON_SECRET>`. Trim both
  // sides — a trailing newline pasted into the Vercel env var is a common reason
  // the comparison silently fails.
  const authHeader = (req.headers.get("authorization") ?? "").trim();
  const cronSecret = process.env.CRON_SECRET?.trim();
  const cronSchedule = req.headers.get("x-vercel-cron-schedule");
  const userAgent = req.headers.get("user-agent") ?? "";

  const looksLikeVercelCron =
    !!cronSchedule || userAgent.toLowerCase().startsWith("vercel-cron/");
  const secretMatches = !!cronSecret && authHeader === `Bearer ${cronSecret}`;

  // A Vercel cron request that carries the wrong/no bearer token while a secret
  // IS configured is a misconfiguration — say so loudly in the logs instead of
  // failing as a bare 401 with no explanation.
  if (looksLikeVercelCron && cronSecret && !secretMatches) {
    console.error(
      "[task-reminder] Vercel cron request rejected — Authorization header did " +
        "not match CRON_SECRET. Confirm CRON_SECRET is set for the Production " +
        "environment with no stray whitespace, then redeploy."
    );
    return NextResponse.json(
      { error: "cron secret mismatch" },
      { status: 401 }
    );
  }
  if (looksLikeVercelCron && !cronSecret) {
    console.warn(
      "[task-reminder] Cron ran without CRON_SECRET set — this endpoint is " +
        "currently unauthenticated. Add CRON_SECRET to the Vercel project " +
        "(Settings → Environment Variables, Production) and redeploy."
    );
  }

  const isCron = secretMatches || (looksLikeVercelCron && !cronSecret);

  const session = isCron ? null : await auth();
  if (!isCron && !session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let digests: ReminderDigest[];
  try {
    digests = await getActiveTaskDigests();
  } catch (err) {
    console.error("[task-reminder] failed to load task digests", err);
    return NextResponse.json(
      { error: "failed to load task digests" },
      { status: 500 }
    );
  }

  const scoped = isCron
    ? digests
    : digests.filter((d) => d.user.id === session!.user.id);

  console.log(
    `[task-reminder] mode=${isCron ? "cron" : "test"} ` +
      `schedule=${cronSchedule ?? "-"} ` +
      `recipients=${scoped.length}/${digests.length}`
  );

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
    console.error("[task-reminder] RESEND_API_KEY is not set — cannot send");
    return NextResponse.json(
      { error: "RESEND_API_KEY is not set — see setup notes" },
      { status: 503 }
    );
  }

  const results: Array<Record<string, unknown>> = [];
  for (const [i, digest] of scoped.entries()) {
    if (i > 0) await sleep(SEND_GAP_MS);
    try {
      const { subject, html, text } = renderReminderEmail(digest);
      await sendReminderEmail(digest.user.email, subject, html, text);
      results.push({ email: digest.user.email, tasks: digest.tasks.length, sent: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "send failed";
      console.error(`[task-reminder] send failed for ${digest.user.email}: ${message}`);
      results.push({ email: digest.user.email, sent: false, error: message });
    }
  }

  const sentCount = results.filter((r) => r.sent).length;
  console.log(
    `[task-reminder] done mode=${isCron ? "cron" : "test"} ` +
      `sent=${sentCount}/${scoped.length}`
  );

  return NextResponse.json({
    mode: isCron ? "cron" : "test",
    usersWithActiveTasks: scoped.length,
    sent: sentCount,
    results,
    note:
      scoped.length === 0
        ? isCron
          ? "no active users have active tasks — nothing to send"
          : "you have no active tasks — nothing to send"
        : undefined,
  });
}
