"use client";

import * as React from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * Pings `touch_last_seen` every ~60s while the tab is visible. Mount this
 * once from the signed-in app layout. Cheap: one UPDATE per minute per
 * active tab, and we stop pinging when the tab is hidden.
 */
export function usePresence() {
  React.useEffect(() => {
    const supa = getSupabaseBrowser();
    if (!supa) return;

    let cancelled = false;

    async function touch() {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        await (supa as any).rpc("touch_last_seen");
      } catch {
        // Network blips are fine — the next interval will retry.
      }
    }

    // Fire once on mount so the dot lights up immediately, then every 60s.
    touch();
    const id = setInterval(touch, 60_000);

    function onVis() {
      if (document.visibilityState === "visible") touch();
    }
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
}
