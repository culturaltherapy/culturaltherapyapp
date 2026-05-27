"use client";

import { usePresence } from "@/lib/hooks/usePresence";

/**
 * Headless client component — mount once in AppShell so usePresence runs
 * for every signed-in page. Renders nothing.
 */
export function PresenceTracker() {
  usePresence();
  return null;
}
