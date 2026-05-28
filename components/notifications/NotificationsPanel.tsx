"use client";

import * as React from "react";
import Link from "next/link";
import {
  useNotifications,
  useMarkAllRead,
  useMarkRead,
  type Notification,
} from "@/lib/hooks/useNotifications";
import { Avatar } from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/utils";

export function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: list = [], isLoading } = useNotifications();
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();
  const ref = React.useRef<HTMLDivElement>(null);

  // Click-outside closes
  React.useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    window.addEventListener("mousedown", onDocClick);
    return () => window.removeEventListener("mousedown", onDocClick);
  }, [open, onClose]);

  if (!open) return null;

  const unreadCount = list.filter((n) => !n.read_at).length;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-bone border border-line shadow-soft rounded-xl z-40 max-h-[80dvh] overflow-hidden flex flex-col"
    >
      <div className="px-4 py-3 border-b border-line flex items-center justify-between">
        <p className="font-display text-lg">Notifications</p>
        {unreadCount > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="text-xs text-terracotta hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-ink3 text-sm">Loading…</div>
        ) : list.length === 0 ? (
          <div className="px-4 py-10 text-center text-ink3 text-sm">
            You're all caught up.
          </div>
        ) : (
          <ul>
            {list.map((n) => (
              <li key={n.id}>
                <NotificationRow
                  n={n}
                  onClick={() => {
                    if (!n.read_at) markOne.mutate(n.id);
                    onClose();
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function NotificationRow({ n, onClick }: { n: Notification; onClick: () => void }) {
  const text = describe(n);
  const href = linkFor(n);
  const unread = !n.read_at;
  const source = n.source;

  const isCrisis = n.kind === "report_crisis";
  const body = (
    <div
      className={`px-4 py-3 flex gap-3 transition ${
        isCrisis
          ? "bg-crisis/10 border-l-2 border-crisis"
          : unread
          ? "bg-terracotta/5"
          : ""
      } hover:bg-ink/5`}
    >
      <Avatar
        name={source?.alias ?? "?"}
        src={source?.avatar_url}
        size={36}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <strong className="text-ink">{source?.alias ?? "Someone"}</strong>{" "}
          <span className="text-ink2">{text}</span>
        </p>
        {n.payload?.thread_title && (
          <p className="text-xs text-ink3 mt-1 line-clamp-1 italic">"{n.payload.thread_title}"</p>
        )}
        {n.payload?.excerpt && (
          <p className="text-xs text-ink3 mt-1 line-clamp-2">{n.payload.excerpt}</p>
        )}
        <p className="text-[11px] text-ink3 mt-1 font-mono">{timeAgo(n.created_at)}</p>
      </div>
      {unread && (
        <span className="h-2 w-2 mt-2 rounded-full bg-terracotta shrink-0" aria-label="Unread" />
      )}
    </div>
  );

  return href ? (
    <Link href={href} onClick={onClick} className="block">{body}</Link>
  ) : (
    <button onClick={onClick} className="block w-full text-left">{body}</button>
  );
}

function describe(n: Notification): string {
  switch (n.kind) {
    case "tribe_request_received":
      return `asked to join ${n.payload?.tribe_name ?? "your Tribe"}`;
    case "tribe_invitation":
      return `invited you to ${n.payload?.tribe_name ?? "a Tribe"}`;
    case "tribe_accepted":
      return `your request to join ${n.payload?.tribe_name ?? "the Tribe"} was accepted`;
    case "thread_reply":
      return `replied to your thread`;
    case "connection_request":
      return `wants to connect with you`;
    case "connection_accepted":
      return `accepted your connection request`;
    case "direct_message":
      return `sent you a message`;
    case "post_comment":
      return `commented on your wall post`;
    case "post_like":
      return `liked your wall post`;
    case "media_comment":
      return `commented on your photo`;
    case "media_like":
      return `liked your photo`;
    case "prompt_comment":
      return `commented on your prompt answer`;
    case "prompt_like":
      return `liked your prompt answer`;
    case "report_received":
      return `filed a new report`;
    case "report_crisis":
      return `🚨 filed a CRISIS-severity report — needs attention now`;
    default:
      return "did something";
  }
}

function linkFor(n: Notification): string | null {
  switch (n.kind) {
    case "tribe_request_received":
    case "tribe_invitation":
      return "/tribes";
    case "tribe_accepted":
      return n.payload?.tribe_id ? `/tribes/${n.payload.tribe_id}` : "/tribes";
    case "thread_reply":
      return n.ref_id ? `/discussions/${n.ref_id}` : "/discussions";
    case "connection_request":
    case "connection_accepted":
      return n.source_user_id ? `/profile/${n.source_user_id}` : null;
    case "direct_message":
      return n.ref_id ? `/messages/${n.ref_id}` : "/messages";
    case "post_comment":
    case "post_like":
      // Wall posts are shown on the owner's profile; route to /profile
      return "/profile?tab=wall";
    case "media_comment":
    case "media_like":
    case "prompt_comment":
    case "prompt_like":
      return "/profile?tab=about";
    case "report_received":
    case "report_crisis":
      return "/admin/moderation";
    default:
      return null;
  }
}
