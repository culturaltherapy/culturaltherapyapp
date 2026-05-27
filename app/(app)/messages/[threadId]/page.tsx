"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useThreadMessages,
  useSendDm,
  useMarkThreadRead,
} from "@/lib/hooks/useDirectMessages";
import { useSession } from "@/lib/hooks/useSession";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SafeguardingBanner } from "@/components/messages/SafeguardingBanner";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { PrivacyShield } from "@/components/privacy/PrivacyShield";
import { timeAgo } from "@/lib/utils";

type ThreadMeta = {
  id: string;
  user_a: string;
  user_b: string;
  other: { id: string; alias: string | null; avatar_url: string | null; last_seen_at: string | null } | null;
};

export default function ThreadView() {
  const params = useParams<{ threadId: string }>();
  const { userId: me, profile: myProfile } = useSession();
  const myAlias = myProfile?.alias ?? "member";
  const { data: messages = [] } = useThreadMessages(params.threadId);
  const sendMsg = useSendDm();
  const markRead = useMarkThreadRead();

  const [meta, setMeta] = React.useState<ThreadMeta | null>(null);
  const [draft, setDraft] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const otherOnline = useOnlineStatus(meta?.other?.last_seen_at);

  // Fetch thread + other user's profile once
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      const supa = getSupabaseBrowser();
      if (!supa) return;
      const { data: thread } = await (supa as any)
        .from("dm_threads")
        .select("*")
        .eq("id", params.threadId)
        .maybeSingle();
      if (cancelled || !thread || !me) return;

      const otherId = thread.user_a === me ? thread.user_b : thread.user_a;
      const { data: prof } = await (supa as any)
        .from("profiles")
        .select("id, alias, avatar_url, last_seen_at")
        .eq("id", otherId)
        .maybeSingle();

      if (!cancelled) {
        setMeta({
          id: thread.id,
          user_a: thread.user_a,
          user_b: thread.user_b,
          other: prof ?? null,
        });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [params.threadId, me]);

  // Mark messages as read when this view mounts and whenever new ones arrive
  React.useEffect(() => {
    if (!params.threadId) return;
    markRead.mutate(params.threadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.threadId, messages.length]);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!draft.trim()) return;
    const body = draft.trim();
    setDraft("");
    try {
      await sendMsg.mutateAsync({ threadId: params.threadId, body });
    } catch (e: any) {
      // Surface the error inline
      setDraft(body); // restore so the user can edit/retry
      alert(e?.message ?? "Couldn't send.");
    }
  }

  if (!meta) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/messages"
        className="text-sm text-ink3 hover:text-ink inline-flex items-center gap-1.5"
      >
        <Icon name="arrowLeft" size={14} /> All messages
      </Link>

      {/* Header */}
      <header className="mt-3 surface p-4 flex items-center gap-3">
        <Avatar
          name={meta.other?.alias ?? "Member"}
          src={meta.other?.avatar_url}
          size={48}
          online={otherOnline}
        />
        <div className="flex-1 min-w-0">
          <Link
            href={meta.other?.id ? `/profile/${meta.other.id}` : "#"}
            className="font-display text-xl hover:underline"
          >
            {meta.other?.alias ?? "Member"}
          </Link>
          <p className="text-xs text-ink3">Connected</p>
        </div>
      </header>

      {/* Messages — wrapped with PrivacyShield for screenshot deterrence */}
      <PrivacyShield watermark={`@${myAlias}`} className="rounded-md mt-4">
        <div className="surface p-4 flex flex-col h-[60dvh] min-h-[400px]">
          <ul className="flex-1 overflow-y-auto space-y-3 pr-1">
            {messages.length === 0 ? (
              <li className="text-center text-ink3 text-sm py-10">
                No messages yet. Say something kind.
              </li>
            ) : (
              messages.map((m) => {
                const mine = m.sender_id === me;
                return (
                  <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed whitespace-pre-wrap ${
                        mine
                          ? "bg-ink text-bone rounded-br-md"
                          : "bg-bone text-ink border border-line rounded-bl-md"
                      }`}
                    >
                      {m.body}
                      <div className={`mt-1 text-[10px] ${mine ? "text-bone/60" : "text-ink3"}`}>
                        {timeAgo(m.created_at)}
                      </div>
                    </div>
                  </li>
                );
              })
            )}
            <div ref={bottomRef} />
          </ul>

          {/* Safety banner — sits directly above the composer so it's the last
              thing the user sees before sending. Dismissible after first ack. */}
          <div className="mt-3">
            <SafeguardingBanner />
          </div>

          <div className="pt-3 border-t border-line flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a message…"
              rows={1}
              maxLength={5000}
              className="flex-1 bg-transparent border-0 outline-none text-[15px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button size="sm" onClick={send} disabled={sendMsg.isPending || !draft.trim()}>
              {sendMsg.isPending ? "…" : "Send"}
            </Button>
          </div>
        </div>
      </PrivacyShield>
    </div>
  );
}
