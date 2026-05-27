"use client";

import * as React from "react";

/** A user counts as "active recently" if their last_seen_at is within
 * this many ms. The presence-ping interval is 60s, so 2 minutes gives a
 * comfortable buffer for tab-switching / network blips. */
const ACTIVE_WINDOW_MS = 2 * 60_000;

/**
 * Turn a `last_seen_at` timestamp from `profiles` into a boolean
 * "active right now-ish" flag. Re-evaluates every 30s so the dot fades
 * after someone leaves the app without needing a page reload.
 */
export function useOnlineStatus(lastSeenAt: string | null | undefined): boolean {
  const [now, setNow] = React.useState<number>(() => Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!lastSeenAt) return false;
  const t = Date.parse(lastSeenAt);
  if (Number.isNaN(t)) return false;
  return now - t < ACTIVE_WINDOW_MS;
}
