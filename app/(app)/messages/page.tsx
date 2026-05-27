"use client";

import * as React from "react";
import Link from "next/link";
import { useMyDmThreads } from "@/lib/hooks/useDirectMessages";
import { useMyConnections } from "@/lib/hooks/useConnections";
import { useOrCreateThreadWith } from "@/lib/hooks/useDirectMessages";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Funtunfunefu } from "@/components/motifs/Motifs";
import { timeAgo } from "@/lib/utils";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";

export default function MessagesPage() {
  const { data: threads = [], isLoading } = useMyDmThreads();
  const { data: connections = [] } = useMyConnections();
  const router = useRouter();
  const orCreate = useOrCreateThreadWith();

  // Accepted connections you haven't messaged yet
  const threadOtherIds = new Set(threads.map((t) => t.other?.id).filter(Boolean) as string[]);
  const fresh = connections
    .filter((c) => c.status === "accepted" && !threadOtherIds.has(c.other?.id ?? ""));

  async function startWith(userId: string) {
    try {
      const threadId = await orCreate.mutateAsync(userId);
      router.push(`/messages/${threadId}`);
    } catch (_) {}
  }

  return (
    <div>
      <header>
        <p className="eyebrow flex items-center gap-2">
          Messages · Funtunfunefu <span className="text-terracotta"><Funtunfunefu size={14} /></span>
        </p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-tight max-w-[22ch]">
          Talk to the people you've connected with.
        </h1>
        <p className="text-ink2 mt-2 max-w-prose">
          Direct messages are only available between accepted connections. Don't
          share phone numbers, addresses, or financial details — keep it inside
          the app where moderators can help.
        </p>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_280px]">
        <section>
          <h2 className="font-display text-2xl mb-3">
            {threads.length === 0 ? "No conversations yet" : `Conversations (${threads.length})`}
          </h2>

          {isLoading ? (
            <div className="surface p-6 text-center">
              <div className="inline-block h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
            </div>
          ) : threads.length === 0 ? (
            <div className="surface p-8 text-center">
              <p className="text-ink2 text-sm max-w-md mx-auto">
                You haven't started any conversations yet. Pick a connection on
                the right to send the first message.
              </p>
            </div>
          ) : (
            <ul className="surface divide-y divide-line">
              {threads.map((t) => (
                <ThreadRow key={t.id} t={t} />
              ))}
            </ul>
          )}
        </section>

        <aside>
          <h2 className="font-display text-xl mb-3">Start a new chat</h2>
          {fresh.length === 0 ? (
            <div className="surface p-4 text-center">
              <p className="text-ink3 text-sm">
                No connections to message. Visit{" "}
                <Link href="/network" className="text-terracotta hover:underline">the network</Link>{" "}
                to connect with someone.
              </p>
            </div>
          ) : (
            <ul className="surface divide-y divide-line">
              {fresh.map((c) => (
                <FreshConnectionRow
                  key={c.id}
                  c={c}
                  onPick={startWith}
                  pending={orCreate.isPending}
                />
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

function ThreadRow({ t }: { t: any }) {
  const online = useOnlineStatus(t.other?.last_seen_at);
  return (
    <li>
      <Link
        href={`/messages/${t.id}`}
        className="block px-4 py-3 hover:bg-ink/[.02] transition flex items-center gap-3"
      >
        <Avatar
          name={t.other?.alias ?? "Member"}
          src={t.other?.avatar_url}
          size={44}
          online={online}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <strong className="truncate">{t.other?.alias ?? "Member"}</strong>
            <span className="text-xs text-ink3 whitespace-nowrap">
              {t.last_message_at ? timeAgo(t.last_message_at) : "—"}
            </span>
          </div>
          <p className="text-sm text-ink3 truncate">
            {t.last_message?.body ?? <em className="text-ink3">no messages yet</em>}
          </p>
        </div>
        {(t.unread_count ?? 0) > 0 && (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-crisis text-bone text-[11px] font-mono font-bold flex items-center justify-center">
            {t.unread_count}
          </span>
        )}
      </Link>
    </li>
  );
}

function FreshConnectionRow({
  c,
  onPick,
  pending,
}: {
  c: any;
  onPick: (id: string) => void;
  pending: boolean;
}) {
  const online = useOnlineStatus(c.other?.last_seen_at);
  return (
    <li>
      <button
        onClick={() => c.other?.id && onPick(c.other.id)}
        disabled={pending}
        className="w-full text-left px-3 py-2.5 hover:bg-ink/[.02] flex items-center gap-3"
      >
        <Avatar
          name={c.other?.alias ?? "Member"}
          src={c.other?.avatar_url}
          size={36}
          online={online}
        />
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-sm">{c.other?.alias ?? "Member"}</strong>
          <span className="text-xs text-ink3">Connected · tap to message</span>
        </div>
      </button>
    </li>
  );
}
