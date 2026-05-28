"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "@/lib/hooks/useSession";
import { useIsModerator } from "@/lib/hooks/useIsModerator";
import {
  useModerationQueue,
  useSetReportStatus,
  useHideContent,
  type ModReport,
  type ReportStatus,
} from "@/lib/hooks/useModerationQueue";
import { useModerationAuditLog } from "@/lib/hooks/useModerationAuditLog";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { timeAgo } from "@/lib/utils";
import { ReportTargetPreview } from "@/components/moderation/ReportTargetPreview";

// Tables that mod_hide_content() supports. Used to decide whether to show
// the "Hide / Restore" button for a given report row.
const HIDEABLE_TABLES = new Set([
  "posts",
  "post_comments",
  "profile_prompts",
  "profile_media",
  "media_comments",
  "prompt_comments",
  "discussion_posts",
]);

const SEVERITY_RANK = { crisis: 0, high: 1, normal: 2 } as const;

export default function ModerationPage() {
  const { loading: sessionLoading, userId } = useSession();
  const isModerator = useIsModerator();
  const [activeTab, setActiveTab] = React.useState<ReportStatus>("open");

  // Gate the page before we even fire the queue query
  if (sessionLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-xl">You need to sign in.</p>
        <Link href="/signin" className="mt-3 inline-block text-terracotta hover:underline">Sign in</Link>
      </div>
    );
  }

  if (!isModerator) {
    return (
      <div className="py-16 max-w-md mx-auto text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-line text-ink3">
          <Icon name="shield" size={28} />
        </div>
        <h1 className="font-display text-2xl mt-4">Moderators only.</h1>
        <p className="mt-2 text-ink2 text-sm">
          This area is reserved for the people responsible for keeping
          Cultural Therapy safe. If you think you should have access, talk to
          the team.
        </p>
        <Link
          href="/home"
          className="mt-5 inline-block text-terracotta hover:underline text-sm"
        >
          ← Back home
        </Link>
      </div>
    );
  }

  return <ModerationQueue activeTab={activeTab} setActiveTab={setActiveTab} />;
}

function ModerationQueue({
  activeTab,
  setActiveTab,
}: {
  activeTab: ReportStatus;
  setActiveTab: (t: ReportStatus) => void;
}) {
  const { data: reports = [], isLoading, error } = useModerationQueue();
  const { data: audit = [] } = useModerationAuditLog(30);

  const counts: Record<ReportStatus, number> = {
    open:      reports.filter((r) => r.status === "open").length,
    triaged:   reports.filter((r) => r.status === "triaged").length,
    actioned:  reports.filter((r) => r.status === "actioned").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
  };

  const filtered = reports
    .filter((r) => r.status === activeTab)
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  return (
    <div>
      <header>
        <p className="eyebrow flex items-center gap-2">
          Moderation queue · gated
          <span className="rounded-pill bg-crisis text-bone px-2 py-0.5 text-[10px] font-mono">SLA 15M</span>
        </p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-tight max-w-[24ch]">
          The work that keeps this place safe.
        </h1>
        <p className="text-ink2 mt-2 max-w-prose">
          Reports route here. Crisis severity pages on-call moderators within
          15 minutes. Every action is written to the audit log below.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["open", "triaged", "actioned", "dismissed"] as ReportStatus[]).map((tab) => (
          <Chip
            key={tab}
            as="button"
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab[0].toUpperCase() + tab.slice(1)} · {counts[tab]}
          </Chip>
        ))}
      </div>

      {error ? (
        <div className="mt-5 surface p-6 text-center">
          <p className="text-crisis text-sm">
            Couldn't load reports: {(error as Error).message}
          </p>
        </div>
      ) : isLoading ? (
        <div className="mt-5 surface p-6 text-center">
          <div className="inline-block h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-5 surface p-8 text-center">
          <p className="text-ink2 text-sm">
            Nothing in the <strong>{activeTab}</strong> tab.
            {activeTab === "open" ? " Quiet day — well done team." : ""}
          </p>
        </div>
      ) : (
        <ul className="mt-5 surface divide-y divide-line">
          {filtered.map((r) => (
            <ReportRow key={r.id} r={r} />
          ))}
        </ul>
      )}

      <section className="mt-10">
        <h2 className="font-display text-2xl">Recent actions</h2>
        <p className="text-ink3 text-sm mt-1">
          Audit trail. Every status change and content hide is logged here.
        </p>
        {audit.length === 0 ? (
          <div className="mt-3 surface p-4 text-center text-sm text-ink3">
            No actions yet.
          </div>
        ) : (
          <ul className="mt-3 surface divide-y divide-line">
            {audit.map((a) => (
              <li key={a.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                <Avatar
                  name={a.actor?.alias ?? "Mod"}
                  src={a.actor?.avatar_url}
                  size={28}
                />
                <div className="flex-1 min-w-0">
                  <strong className="text-ink">{a.actor?.alias ?? "Moderator"}</strong>{" "}
                  <span className="text-ink2">{formatAction(a.action)}</span>
                  {a.target_kind && (
                    <span className="text-ink3 text-xs ml-1.5">
                      ({a.target_kind})
                    </span>
                  )}
                </div>
                <span className="text-xs text-ink3 whitespace-nowrap">{timeAgo(a.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatAction(action: string): string {
  if (action.startsWith("report_status_")) {
    const s = action.replace("report_status_", "");
    return `marked a report as ${s}`;
  }
  if (action === "content_hidden") return "hid content";
  if (action === "content_restored") return "restored content";
  return action.replace(/_/g, " ");
}

function ReportRow({ r }: { r: ModReport }) {
  const setStatus = useSetReportStatus();
  const hideContent = useHideContent();

  const canHide =
    r.target_table != null && HIDEABLE_TABLES.has(r.target_table) && r.target_id != null;

  const sevClass =
    r.severity === "crisis"
      ? "bg-crisis text-bone"
      : r.severity === "high"
      ? "bg-ochre text-bone"
      : "bg-line text-ink2";

  const targetHref = canonicalHrefFor(r);

  async function transition(to: ReportStatus) {
    try { await setStatus.mutateAsync({ reportId: r.id, status: to }); }
    catch (e: any) { alert(e?.message ?? "Couldn't update report."); }
  }

  async function hideOrRestore(hide: boolean) {
    if (!r.target_table || !r.target_id) return;
    try {
      await hideContent.mutateAsync({ table: r.target_table, rowId: r.target_id, hide });
      // Mark the report as actioned the first time we hide something
      if (hide && r.status === "open") await setStatus.mutateAsync({ reportId: r.id, status: "actioned" });
    } catch (e: any) { alert(e?.message ?? "Couldn't update content."); }
  }

  return (
    <li className="px-4 py-4 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[11px] font-mono uppercase tracking-wider w-fit ${sevClass}`}>
          <Icon name="shield" size={12} /> {r.severity}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <strong className="text-ink">{r.reporter?.alias ?? "A member"}</strong>
            {" "}reported a{" "}
            <span className="font-mono uppercase text-xs">{r.target_kind}</span>
            {r.target_table && (
              <span className="text-ink3 text-xs ml-1.5">
                ({r.target_table})
              </span>
            )}
          </p>
          <p className="text-xs text-ink3 mt-0.5">
            Reason: <span className="font-mono uppercase">{r.reason}</span>
            {" · "}{timeAgo(r.created_at)}
          </p>
          {r.notes && (
            <p className="mt-1.5 text-sm text-ink2 italic border-l-2 border-line pl-2">
              {r.notes}
            </p>
          )}

          <ReportTargetPreview targetTable={r.target_table} targetId={r.target_id} />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {targetHref && (
            <a href={targetHref} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline">Open ↗</Button>
            </a>
          )}
          {canHide && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => hideOrRestore(true)}
              disabled={hideContent.isPending || setStatus.isPending}
            >
              Hide
            </Button>
          )}
          {canHide && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => hideOrRestore(false)}
              disabled={hideContent.isPending}
            >
              Restore
            </Button>
          )}
        </div>
      </div>

      {/* Status transition row */}
      <div className="flex flex-wrap gap-1.5 pl-1">
        {(["open", "triaged", "actioned", "dismissed"] as ReportStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => transition(s)}
            disabled={setStatus.isPending || r.status === s}
            className={`text-xs px-2.5 py-1 rounded-md border transition ${
              r.status === s
                ? "border-ink bg-ink text-bone cursor-default"
                : "border-line text-ink3 hover:border-ink hover:text-ink"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </li>
  );
}

/** Best-effort canonical URL for the reported target so the moderator can
 *  click straight through. Returns null if we don't have a sensible route. */
function canonicalHrefFor(r: ModReport): string | null {
  if (r.target_kind === "profile") return `/profile/${r.target_id}`;
  if (r.target_table === "discussion_posts") return `/discussions/${r.target_id}`;
  if (r.target_kind === "thread" || r.target_table === "dm_threads") return `/messages/${r.target_id}`;
  // For wall posts / comments / media / prompts we don't have direct deep
  // links to a single row yet. The reporter's notes + the audit trail give
  // enough context to track them down.
  return null;
}
