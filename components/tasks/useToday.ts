// components/tasks/useToday.ts
"use client";

import { useSyncExternalStore } from "react";
import { todayISO } from "@/utils";

// The server has no idea what timezone the viewer is in, so it renders "today"
// for the app's home timezone; the client then switches to its own local date
// (useSyncExternalStore swaps snapshots after hydration without a mismatch
// error). Re-checked every minute so an open tab rolls over at midnight.
const jakarta = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 60_000);
  return () => clearInterval(timer);
}

export function useToday(): string {
  return useSyncExternalStore(subscribe, todayISO, () => jakarta.format(new Date()));
}

const noop = () => () => {};

/** False during SSR/hydration, true after — for rendering local-time text. */
export function useIsClient(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
