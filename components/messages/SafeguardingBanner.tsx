"use client";

import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { ReportButton } from "@/components/moderation/ReportButton";

const STORAGE_KEY = "ct.dm.safeguarding.dismissed";

type Props = {
  /** Optional — when provided, renders a "Report this conversation" link
   *  that files a thread-level report against the DM thread. */
  threadId?: string | null;
};

export function SafeguardingBanner({ threadId }: Props = {}) {
  const [dismissed, setDismissed] = React.useState<boolean>(true); // start hidden to avoid SSR flash

  React.useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {}
  }, []);

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="rounded-lg border border-crisis/30 bg-crisis/5 px-4 py-3 mb-4 flex gap-3">
      <div className="text-crisis pt-0.5"><Icon name="shield" size={18} /></div>
      <div className="flex-1 text-sm text-ink2 leading-relaxed">
        <strong className="text-ink">Stay safe in messages.</strong>{" "}
        Don't share phone numbers, addresses, financial details, or
        passwords here. If someone asks for any of those — or makes
        you feel unsafe — tap{" "}
        {threadId ? (
          <ReportButton
            targetKind="thread"
            targetTable="dm_threads"
            targetId={threadId}
            targetLabel="this conversation"
            variant="link"
            className="!inline !text-ink !underline"
          />
        ) : (
          <span className="text-ink">Report</span>
        )}
        {" "}below. Crisis support is always one tap away.
      </div>
      <button
        onClick={dismiss}
        className="text-xs text-ink3 hover:text-ink shrink-0"
        aria-label="Dismiss"
      >
        Got it
      </button>
    </div>
  );
}
