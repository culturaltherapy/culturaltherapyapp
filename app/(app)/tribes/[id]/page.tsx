"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTribe, useVillageThreads, usePostThread, useSendTribeRequest, usePendingTribeRequests } from "@/lib/hooks/useTribes";
import { useSession } from "@/lib/hooks/useSession";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Motif } from "@/components/motifs/Motifs";
import { Icon } from "@/components/ui/Icon";
import { timeAgo } from "@/lib/utils";

export default function VillagePage() {
  const params = useParams<{ id: string }>();
  const { userId } = useSession();
  const { data: tribe, isLoading } = useTribe(params.id);
  const { data: threads = [] } = useVillageThreads(params.id);
  const postThread = usePostThread();
  const sendRequest = useSendTribeRequest();
  const { data: requests = [] } = usePendingTribeRequests();

  const [draft, setDraft] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const [postErr, setPostErr] = React.useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!tribe) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-xl">Tribe not found.</p>
        <Link href="/tribes" className="mt-3 inline-block text-terracotta hover:underline">
          Back to My Tribes
        </Link>
      </div>
    );
  }

  const t = tribe as any;
  const memberships: any[] = t.tribe_members ?? [];
  const isMember = !!userId && memberships.some((m) => m.user_id === userId);
  const isOwner = !!userId && t.owner_id === userId;
  const members = memberships.map((m) => m.profiles).filter(Boolean);
  const hasPendingRequest = requests.some(
    (r: any) => r.tribe_id === t.id && r.user_id === userId,
  );

  async function handlePost() {
    if (!draft.trim()) return;
    setPosting(true);
    setPostErr(null);
    try {
      const title = draft.trim().split("\n")[0].slice(0, 80);
      await postThread.mutateAsync({ tribeId: t.id, title, body: draft.trim() });
      setDraft("");
    } catch (e: any) {
      setPostErr(e?.message ?? "Couldn't post.");
    } finally {
      setPosting(false);
    }
  }

  async function requestToJoin() {
    try {
      await sendRequest.mutateAsync({ tribeId: t.id });
    } catch (e: any) {
      // ignore — UI updates via cache
    }
  }

  return (
    <div>
      <Link href="/tribes" className="text-sm text-ink3 hover:text-ink inline-flex items-center gap-1.5">
        <Icon name="arrowLeft" size={14} /> Back to my Tribes
      </Link>

      {/* Hero */}
      <section
        className="mt-3 rounded-2xl p-7 sm:p-9 relative overflow-hidden text-bone"
        style={{ background: t.color ?? "#2f4a32" }}
      >
        <div className="absolute -bottom-10 -right-10 opacity-25">
          <Motif name={(t.motif ?? "Ubuntu") as any} size={260} />
        </div>
        <div className="relative">
          <p className="font-mono text-[10px] tracking-widest opacity-70">VILLAGE OF</p>
          <h1 className="font-display text-4xl sm:text-5xl mt-1 leading-tight">{t.name}</h1>
          {t.blurb && <p className="mt-2 text-bone/90 max-w-xl italic">"{t.blurb}"</p>}
          <div className="mt-4 flex flex-wrap gap-2 text-bone">
            <span className="rounded-pill bg-bone/10 px-3 py-1 text-xs font-mono">
              {members.length} MEMBER{members.length === 1 ? "" : "S"}
            </span>
            <span className="rounded-pill bg-bone/10 px-3 py-1 text-xs font-mono">
              {threads.length} THREAD{threads.length === 1 ? "" : "S"}
            </span>
            {isOwner && (
              <span className="rounded-pill bg-bone/20 px-3 py-1 text-xs font-mono">FOUNDER</span>
            )}
          </div>
        </div>
      </section>

      {/* Not a member — show join CTA, hide composer + threads */}
      {!isMember && (
        <div className="mt-6 surface p-6 text-center">
          <p className="font-display text-xl">You're not in this Village yet.</p>
          <p className="text-ink2 text-sm mt-2 max-w-md mx-auto">
            Threads and audio rooms are visible to members only. Send a request to ask the founder to let you in.
          </p>
          {hasPendingRequest ? (
            <p className="mt-3 text-sm text-forest font-mono uppercase">✓ Request sent · awaiting response</p>
          ) : (
            <>
              <Button className="mt-4" onClick={requestToJoin} disabled={sendRequest.isPending}>
                {sendRequest.isPending ? "Sending…" : "Request to join"}
              </Button>
              {sendRequest.isError && (
                <p className="mt-3 text-sm text-crisis">
                  {(sendRequest.error as any)?.message?.includes("tribe_requests_unique_pending")
                    ? "You already have a pending request to this Tribe."
                    : `Couldn't send request: ${(sendRequest.error as any)?.message ?? "Try again."}`}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Main grid — only for members */}
      {isMember && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
          <div>
            {/* Composer */}
            <div className="surface p-4">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Start a thread in ${t.name}…`}
                className="w-full bg-transparent border-0 outline-none resize-none text-[15px] placeholder:text-ink3"
                rows={2}
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-ink3">
                  <Icon name="camera" size={16} />
                  <Icon name="mic" size={16} />
                </div>
                <Button size="sm" onClick={handlePost} disabled={posting || !draft.trim()}>
                  {posting ? "Posting…" : "Post to Village"}
                </Button>
              </div>
              {postErr && <p className="mt-2 text-sm text-crisis">{postErr}</p>}
            </div>

            {/* Threads */}
            <ul className="mt-5 space-y-3">
              {threads.map((th: any) => (
                <li key={th.id} className="surface p-4 hover:shadow-soft transition">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-xl">{th.title}</h3>
                    <span className="text-xs text-ink3 whitespace-nowrap">
                      {th.created_at ? timeAgo(th.created_at) : ""}
                    </span>
                  </div>
                  {th.body && <p className="text-ink2 text-[15px] mt-1 whitespace-pre-wrap">{th.body}</p>}
                  <div className="mt-3 flex items-center gap-2 text-sm text-ink3">
                    <Avatar
                      name={th.profiles?.alias ?? "Member"}
                      src={th.profiles?.avatar_url}
                      size={20}
                    />
                    <span>by {th.profiles?.alias ?? "Member"}</span>
                  </div>
                </li>
              ))}
              {threads.length === 0 && (
                <li className="surface p-6 text-center text-ink3 text-sm">
                  No threads yet. Start the first one above.
                </li>
              )}
            </ul>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="surface p-4">
              <h3 className="font-display text-lg">Members</h3>
              {members.length === 0 ? (
                <p className="mt-2 text-sm text-ink3">No members yet.</p>
              ) : (
                <ul className="mt-3 grid grid-cols-3 gap-2">
                  {members.slice(0, 9).map((m: any) => (
                    <li key={m.id} className="text-center">
                      <Link href={`/profile/${m.id}`}>
                        <Avatar
                          name={m.alias ?? "?"}
                          color={m.avatar_color ?? "#b3563a"}
                          src={m.avatar_url}
                          size={40}
                          className="mx-auto"
                        />
                        <p className="text-[11px] text-ink2 mt-1 truncate">
                          {(m.alias ?? "?").split(" ")[0]}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="surface p-4">
              <h3 className="font-display text-lg">Tribe rules</h3>
              <ul className="mt-2 text-sm text-ink2 space-y-1.5 list-disc pl-4">
                <li>What's said here, stays here.</li>
                <li>Crisis is one tap. Not a debate.</li>
                <li>Mods may join audio rooms silently.</li>
              </ul>
            </div>

            <div className="surface p-4">
              <h3 className="font-display text-lg">Your settings</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Chip>Notifs: priority</Chip>
                <Chip>DMs: on</Chip>
                <Chip>Audio: opt-in</Chip>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
