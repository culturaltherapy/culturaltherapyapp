"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { timeAgo } from "@/lib/utils";

export type InteractionsComment = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: { id: string; alias: string | null; avatar_url: string | null } | null;
};

type Props = {
  iLiked: boolean;
  likeCount: number;
  commentCount: number;
  onToggleLike: () => void;
  pendingLike?: boolean;
  comments: InteractionsComment[];
  isLoadingComments: boolean;
  onAddComment: (body: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  currentUserId: string | null;
  expandedByDefault?: boolean;
  variant?: "inline" | "modal";
  /** Hide the heart button (owner has disabled likes on this surface). */
  allowLikes?: boolean;
  /** Hide the 💬 button (owner has disabled comments on this surface). */
  allowComments?: boolean;
};

/**
 * Shared like + comments action row used by media and prompt cards. Mirrors
 * the structure inside PostCard.tsx but extracted so it can be reused.
 * `variant` controls padding/border styling for inline (cards) vs modal
 * (inside the media lightbox).
 */
export function InteractionsSection({
  iLiked,
  likeCount,
  commentCount,
  onToggleLike,
  pendingLike,
  comments,
  isLoadingComments,
  onAddComment,
  onDeleteComment,
  currentUserId,
  expandedByDefault = false,
  variant = "inline",
  allowLikes = true,
  allowComments = true,
}: Props) {
  const [showComments, setShowComments] = React.useState(expandedByDefault);

  // If both buttons are hidden, the action row collapses entirely
  const hasActions = allowLikes || allowComments;
  // Always show non-zero counts (so owners can see history) but disable buttons
  const showCounts = likeCount > 0 || commentCount > 0;

  if (!hasActions && !showCounts) return null;

  return (
    <div className={variant === "modal" ? "mt-4 pt-3 border-t border-line" : "mt-3 pt-3 border-t border-line"}>
      {/* Action row */}
      <div className="flex items-center gap-4 text-sm">
        {allowLikes ? (
          <button
            onClick={onToggleLike}
            disabled={pendingLike}
            className={`inline-flex items-center gap-1.5 transition ${
              iLiked ? "text-terracotta" : "text-ink3 hover:text-ink"
            }`}
            aria-label={iLiked ? "Unlike" : "Like"}
          >
            <span aria-hidden>{iLiked ? "♥" : "♡"}</span>
            <span className="text-xs font-mono">{likeCount}</span>
          </button>
        ) : likeCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-ink3" aria-label="Likes">
            <span aria-hidden>♥</span>
            <span className="text-xs font-mono">{likeCount}</span>
          </span>
        ) : null}

        {allowComments ? (
          <button
            onClick={() => setShowComments((v) => !v)}
            className="inline-flex items-center gap-1.5 text-ink3 hover:text-ink transition"
          >
            <span aria-hidden>💬</span>
            <span className="text-xs font-mono">{commentCount}</span>
            <span className="text-xs">{commentCount === 1 ? "comment" : "comments"}</span>
          </button>
        ) : commentCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-ink3">
            <span aria-hidden>💬</span>
            <span className="text-xs font-mono">{commentCount}</span>
          </span>
        ) : null}

        {!allowLikes && !allowComments && (
          <span className="text-xs text-ink3 italic">Reactions are off</span>
        )}
      </div>

      {/* Comments thread */}
      {showComments && allowComments && (
        <CommentsThread
          comments={comments}
          isLoading={isLoadingComments}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}

function CommentsThread({
  comments,
  isLoading,
  onAddComment,
  onDeleteComment,
  currentUserId,
}: {
  comments: InteractionsComment[];
  isLoading: boolean;
  onAddComment: (body: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  currentUserId: string | null;
}) {
  const [draft, setDraft] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const [confirming, setConfirming] = React.useState<string | null>(null);

  async function submit() {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      await onAddComment(draft.trim());
      setDraft("");
    } catch (e: any) {
      alert(e?.message ?? "Couldn't post comment.");
    } finally {
      setPosting(false);
    }
  }

  async function remove(id: string) {
    if (confirming !== id) { setConfirming(id); return; }
    try {
      await onDeleteComment(id);
    } catch (_) {} finally {
      setConfirming(null);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-line">
      {isLoading ? (
        <p className="text-xs text-ink3">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-ink3">No comments yet — be the first.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <Link href={`/profile/${c.author_id}`} className="shrink-0">
                <Avatar
                  name={c.author?.alias ?? "Member"}
                  src={c.author?.avatar_url}
                  size={28}
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 text-xs text-ink3">
                  <Link href={`/profile/${c.author_id}`} className="text-ink hover:underline font-medium">
                    {c.author?.alias ?? "Member"}
                  </Link>
                  <span>{timeAgo(c.created_at)}</span>
                  {c.author_id === currentUserId && (
                    <button
                      onClick={() => remove(c.id)}
                      className={`ml-auto ${confirming === c.id ? "text-crisis font-medium" : "text-ink3"} hover:text-crisis`}
                    >
                      {confirming === c.id ? "tap again" : "delete"}
                    </button>
                  )}
                </div>
                <p className="text-sm mt-0.5 whitespace-pre-wrap">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {currentUserId && (
        <div className="mt-3 flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment…"
            rows={1}
            maxLength={1000}
            className="flex-1 rounded-md border border-line bg-bone px-3 py-2 text-sm placeholder:text-ink3 outline-none focus:border-terracotta resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <Button size="sm" onClick={submit} disabled={posting || !draft.trim()}>
            {posting ? "…" : "Post"}
          </Button>
        </div>
      )}
    </div>
  );
}
