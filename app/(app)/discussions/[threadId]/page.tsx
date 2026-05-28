"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useThread, useReplyToThread } from "@/lib/hooks/useDiscussions";
import { useSession } from "@/lib/hooks/useSession";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { timeAgo } from "@/lib/utils";
import { ReportButton } from "@/components/moderation/ReportButton";

export default function ThreadDetailPage() {
  const params = useParams<{ threadId: string }>();
  const { userId } = useSession();
  const { data, isLoading } = useThread(params.threadId);
  const reply = useReplyToThread();

  const [draft, setDraft] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data?.thread) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-xl">Thread not found.</p>
        <Link href="/discussions" className="mt-3 inline-block text-terracotta hover:underline">
          Back to Discussions
        </Link>
      </div>
    );
  }

  const { thread, replies, room } = data;
  const heading = thread.title || (thread.body ?? "").slice(0, 80);

  async function submitReply() {
    setErr(null);
    if (!draft.trim()) return;
    try {
      await reply.mutateAsync({
        threadId: thread.id,
        roomId: thread.room_id,
        body: draft.trim(),
      });
      setDraft("");
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't post reply.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/discussions" className="text-sm text-ink3 hover:text-ink inline-flex items-center gap-1.5">
        <Icon name="arrowLeft" size={14} /> Back to {room?.title ?? "Discussions"}
      </Link>

      {/* OP */}
      <article className="mt-3 surface p-5 sm:p-6">
        {thread.title && (
          <h1 className="font-display text-2xl sm:text-3xl leading-tight">{thread.title}</h1>
        )}
        <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${thread.title ? "mt-3 text-ink2" : "text-ink"}`}>
          {thread.body}
        </p>
        <div className="mt-4 pt-4 border-t border-line flex items-center gap-2 text-sm text-ink3">
          <Avatar
            name={thread.author?.alias ?? "Member"}
            src={thread.author?.avatar_url}
            size={28}
          />
          <span>
            {thread.author?.id ? (
              <Link href={`/profile/${thread.author.id}`} className="text-ink hover:underline">
                {thread.author.alias ?? "Member"}
              </Link>
            ) : (thread.author?.alias ?? "Member")}
          </span>
          <span>·</span>
          <span>{timeAgo(thread.created_at)}</span>
          {thread.author?.id && thread.author.id !== userId && (
            <span className="ml-auto">
              <ReportButton
                targetKind="thread"
                targetTable="discussion_posts"
                targetId={thread.id}
                targetLabel="this thread"
                variant="link"
              />
            </span>
          )}
        </div>
      </article>

      {/* Replies */}
      <section className="mt-6">
        <h2 className="font-display text-xl mb-3">
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </h2>

        {replies.length === 0 ? (
          <p className="surface p-5 text-center text-ink3 text-sm">
            No replies yet. Be the first to respond.
          </p>
        ) : (
          <ul className="space-y-3">
            {replies.map((r: any) => (
              <li key={r.id} className="surface p-4">
                <div className="flex items-center gap-2 text-sm text-ink3">
                  <Avatar
                    name={r.author?.alias ?? "Member"}
                    src={r.author?.avatar_url}
                    size={24}
                  />
                  <span className="text-ink">
                    {r.author?.id ? (
                      <Link href={`/profile/${r.author.id}`} className="hover:underline">
                        {r.author.alias ?? "Member"}
                      </Link>
                    ) : (r.author?.alias ?? "Member")}
                  </span>
                  <span>·</span>
                  <span>{timeAgo(r.created_at)}</span>
                  {r.author?.id && r.author.id !== userId && (
                    <span className="ml-auto">
                      <ReportButton
                        targetKind="comment"
                        targetTable="discussion_posts"
                        targetId={r.id}
                        targetLabel="this reply"
                        variant="link"
                      />
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Reply composer */}
      {userId && (
        <div className="mt-6 surface p-4">
          <p className="eyebrow mb-2">Your reply</p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add to the thread…"
            rows={4}
            maxLength={5000}
            className="w-full bg-transparent border-0 outline-none resize-none text-[15px] placeholder:text-ink3"
          />
          {err && <p className="mt-2 text-sm text-crisis">{err}</p>}
          <div className="mt-2 pt-3 border-t border-line flex justify-end">
            <Button size="sm" onClick={submitReply} disabled={reply.isPending || !draft.trim()}>
              {reply.isPending ? "Posting…" : "Post reply"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
