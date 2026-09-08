// components/tasks/SendTestReminderButton.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, Eye, Loader2 } from "lucide-react";

// Fires the same endpoint Vercel Cron hits, but as a logged-in user — so it
// only emails you. Lets you confirm Resend is wired up without waiting for 9am.
export default function SendTestReminderButton() {
  const [busy, setBusy] = useState(false);

  async function sendTest() {
    setBusy(true);
    try {
      const res = await fetch("/api/cron/task-reminder");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "request failed");
      }
      if (data.note) {
        toast.info(data.note);
        return;
      }
      const r = data.results?.[0];
      if (r?.sent) {
        toast.success(`test email sent to ${r.email} (${r.tasks} task${r.tasks === 1 ? "" : "s"})`);
      } else {
        toast.error(r?.error ?? "send failed — check RESEND_API_KEY");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "failed to send test");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <a
        href="/api/cron/task-reminder?preview=1"
        target="_blank"
        rel="noopener noreferrer"
        className="pixel-btn bg-muted text-foreground font-pixel px-3 py-2 inline-flex items-center gap-1.5 hover:bg-oatmeal transition-colors"
        style={{ fontSize: "8px" }}
      >
        <Eye size={12} /> PREVIEW
      </a>
      <button
        type="button"
        onClick={sendTest}
        disabled={busy}
        className="pixel-btn bg-burning-flame text-abyssal font-pixel px-3 py-2 inline-flex items-center gap-1.5 disabled:opacity-60"
        style={{ fontSize: "8px" }}
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
        {busy ? "SENDING..." : "TEST EMAIL"}
      </button>
    </div>
  );
}
