"use client";

import * as React from "react";
import { useDeletePost, type WallPost } from "@/lib/hooks/useWallPosts";
import { timeAgo } from "@/lib/utils";

const VIS_LABEL: Record<WallPost["visibility"], string> = {
  public:  "PUBLIC",
  tribe:   "TRIBE",
  village: "VILLAGE",
  private: "PRIVATE",
};

export function PostCard({ post, canDelete }: { post: WallPost; canDelete: boolean }) {
  const del = useDeletePost();
  const [confirming, setConfirming] = React.useState(false);

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return; }
    try {
      await del.mutateAsync(post.id);
    } catch (_) {
      // surfaced via optimistic UI later; for now silent
    } finally {
      setConfirming(false);
    }
  }

  return (
    <li className="surface p-4">
      <div className="flex items-baseline justify-between text-xs text-ink3 gap-3">
        <span>{timeAgo(post.created_at)}{post.edited_at && " · edited"}</span>
        <span className="font-mono uppercase">{VIS_LABEL[post.visibility]}</span>
      </div>
      <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap">{post.body}</p>
      {canDelete && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleDelete}
            disabled={del.isPending}
            className={`text-xs ${confirming ? "text-crisis font-medium" : "text-ink3"} hover:text-crisis`}
          >
            {del.isPending ? "Deleting…" : confirming ? "Tap again to confirm delete" : "Delete"}
          </button>
        </div>
      )}
    </li>
  );
}
