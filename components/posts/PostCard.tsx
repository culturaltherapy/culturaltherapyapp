"use client";

import * as React from "react";
import Link from "next/link";
import { useDeletePost, useUpdatePostVisibility, VIS_OPTIONS, type WallPost } from "@/lib/hooks/useWallPosts";
import {
  usePostInteractions,
  useLikePost,
  useUnlikePost,
  usePostComments,
  useAddComment,
  useDeleteComment,
} from "@/lib/hooks/usePostInteractions";
import { useSession } from "@/lib/hooks/useSession";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { timeAgo } from "@/lib/utils";
import { ReportButton } from "@/components/moderation/ReportButton";

const VIS_LABEL: Record<WallPost["visibility"], string> = {
  public:  "PUBLIC",
  tribe:   "TRIBE",
  village: "VILLAGE",
  private: "PRIVATE",
};

export function PostCard({
  post,
  canDelete,
  allowLikes = true,
  allowComments = true,
  author,
}: {
  post: WallPost;
  canDelete: boolean;
  /** Hide the heart when the post-owner has switched likes off on their wall. */
  allowLikes?: boolean;
  /** Hide the 💬 button when the post-owner has switched comments off on their wall. */
  allowComments?: boolean;
  /** Pass this to show a who-posted-this header — used on cross-member feeds
   *  like the Community Wall, where posts aren't already scoped to one profile. */
  author?: { id: string; alias: string | null; avatar_url: string | null };
}) {
  const del = useDeletePost();
  const updateVisibility = useUpdatePostVisibility();
  const [confirming, setConfirming] = React.useState(false);

  const { data: interactions } = usePostInteractions(post.id);
  const like = useLikePost();
  const unlike = useUnlikePost();

  const likeCount = interactions?.likeCount ?? 0;
  const commentCount = interactions?.commentCount ?? 0;
  const iLiked = interactions?.iLiked ?? false;

  // Auto-expand the comments thread whenever there's something to show, so
  // viewers don't have to click 💬 to discover them. Users can still toggle.
  const [showComments, setShowComments] = React.useState(false);
  const autoExpanded = React.useRef(false);
  React.useEffect(() => {
    if (!autoExpanded.current && commentCount > 0) {
      autoExpanded.current = true;
      setShowComments(true);
    }
  }, [commentCount]);

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return; }
    try {
      await del.mutateAsync(post.id);
    } catch (_) {} finally {
      setConfirming(false);
    }
  }

  function toggleLike() {
    if (iLiked) unlike.mutate(post.id);
    else like.mutate(post.id);
  }

  async function changeVisibility(next: WallPost["visibility"]) {
    if (next === post.visibility) return;
    try {
      await updateVisibility.mutateAsync({ postId: post.id, visibility: next });
    } catch (e: any) {
      alert(e?.message ?? "Couldn't update visibility.");
    }
  }

  return (
    <li className="surface p-4">
      {author && (
        <Link href={`/profile/${author.id}`} className="flex items-center gap-2.5 mb-3">
          <Avatar name={author.alias ?? "Member"} src={author.avatar_url} size={32} />
          <strong className="text-sm hover:underline">{author.alias ?? "Member"}</strong>
        </Link>
      )}
      <div className="flex items-baseline justify-between text-xs text-ink3 gap-3">
        <span>{timeAgo(post.created_at)}{post.edited_at && " · edited"}</span>
        {canDelete ? (
          <select
            value={post.visibility}
            onChange={(e) => changeVisibility(e.target.value as WallPost["visibility"])}
            disabled={updateVisibility.isPending}
            aria-label="Change who can see this post"
            className="font-mono uppercase text-xs bg-transparent border border-line rounded px-1.5 py-0.5 outline-none focus:border-terracotta disabled:opacity-50"
          >
            {VIS_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        ) : (
          <span className="font-mono uppercase">{VIS_LABEL[post.visibility]}</span>
        )}
      </div>
      <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap">{post.body}</p>

      {/* Action row */}
      <div className="mt-3 pt-3 border-t border-line flex items-center gap-4 text-sm">
        {allowLikes ? (
          <button
            onClick={toggleLike}
            disabled={like.isPending || unlike.isPending}
            className={`inline-flex items-center gap-1.5 transition ${
              iLiked ? "text-terracotta" : "text-ink3 hover:text-ink"
            }`}
            aria-label={iLiked ? "Unlike" : "Like"}
          >
            <span aria-hidden>{iLiked ? "♥" : "♡"}</span>
            <span className="text-xs font-mono">{likeCount}</span>
          </button>
        ) : likeCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-ink3">
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

        {!allowLikes && !allowComments && likeCount === 0 && commentCount === 0 && (
          <span className="text-xs text-ink3 italic">Reactions are off</span>
        )}

        {canDelete ? (
          <button
            onClick={handleDelete}
            disabled={del.isPending}
            className={`ml-auto text-xs ${confirming ? "text-crisis font-medium" : "text-ink3"} hover:text-crisis`}
          >
            {del.isPending ? "Deleting…" : confirming ? "Tap again to confirm delete" : "Delete"}
          </button>
        ) : (
          <div className="ml-auto">
            <ReportButton
              targetKind="post"
              targetTable="posts"
              targetId={post.id}
              targetLabel="this post"
              variant="link"
            />
          </div>
        )}
      </div>

      {/* Comments section — only if comments are allowed AND user expanded */}
      {showComments && allowComments && <PostComments postId={post.id} />}
    </li>
  );
}

function PostComments({ postId }: { postId: string }) {
  const { userId } = useSession();
  const { data: comments = [], isLoading, error } = usePostComments(postId);
  const add = useAddComment();
  const del = useDeleteComment();
  const [draft, setDraft] = React.useState("");
  const [confirming, setConfirming] = React.useState<string | null>(null);

  async function submit() {
    if (!draft.trim()) return;
    try {
      await add.mutateAsync({ postId, body: draft.trim() });
      setDraft("");
    } catch (e: any) {
      // Surface as alert for simplicity
      alert(e?.message ?? "Couldn't post comment.");
    }
  }

  async function remove(id: string) {
    if (confirming !== id) { setConfirming(id); return; }
    try {
      await del.mutateAsync({ commentId: id, postId });
    } catch (_) {} finally {
      setConfirming(null);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-line">
      {isLoading ? (
        <p className="text-xs text-ink3">Loading comments…</p>
      ) : error ? (
        <p className="text-xs text-crisis">
          Couldn't load comments: {(error as Error).message}
        </p>
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
                  {c.author_id === userId ? (
                    <button
                      onClick={() => remove(c.id)}
                      className={`ml-auto ${confirming === c.id ? "text-crisis font-medium" : "text-ink3"} hover:text-crisis`}
                    >
                      {confirming === c.id ? "tap again" : "delete"}
                    </button>
                  ) : (
                    <div className="ml-auto">
                      <ReportButton
                        targetKind="comment"
                        targetTable="post_comments"
                        targetId={c.id}
                        targetLabel="this comment"
                        variant="link"
                      />
                    </div>
                  )}
                </div>
                <p className="text-sm mt-0.5 whitespace-pre-wrap">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {userId && (
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
          <Button size="sm" onClick={submit} disabled={add.isPending || !draft.trim()}>
            {add.isPending ? "…" : "Post"}
          </Button>
        </div>
      )}
    </div>
  );
}
