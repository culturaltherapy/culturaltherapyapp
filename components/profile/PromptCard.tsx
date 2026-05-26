"use client";

import * as React from "react";
import { InteractionsSection } from "@/components/interactions/InteractionsSection";
import { useSession } from "@/lib/hooks/useSession";
import {
  usePromptInteractions,
  useLikePrompt,
  useUnlikePrompt,
  usePromptComments,
  useAddPromptComment,
  useDeletePromptComment,
} from "@/lib/hooks/usePromptInteractions";

export type PromptCardData = {
  id: string;
  question: string;
  answer: string;
};

/**
 * One profile prompt with a heart + comments action row underneath.
 * Owner-side `allowLikes` / `allowComments` should reflect the prompt
 * owner's `allow_prompt_*` flags so viewers can't react if the owner
 * has switched the feature off.
 */
export function PromptCard({
  prompt,
  allowLikes = true,
  allowComments = true,
}: {
  prompt: PromptCardData;
  allowLikes?: boolean;
  allowComments?: boolean;
}) {
  const { userId } = useSession();

  const { data: interactions } = usePromptInteractions(prompt.id);
  const like = useLikePrompt();
  const unlike = useUnlikePrompt();
  const { data: comments = [], isLoading: commentsLoading } = usePromptComments(prompt.id);
  const addComment = useAddPromptComment();
  const delComment = useDeletePromptComment();

  const iLiked = interactions?.iLiked ?? false;
  const likeCount = interactions?.likeCount ?? 0;
  const commentCount = interactions?.commentCount ?? 0;

  function toggleLike() {
    if (iLiked) unlike.mutate(prompt.id);
    else like.mutate(prompt.id);
  }

  return (
    <li className="surface p-5">
      <p className="eyebrow">{prompt.question}</p>
      <p className="font-display text-lg mt-1 italic leading-snug">&ldquo;{prompt.answer}&rdquo;</p>

      <InteractionsSection
        iLiked={iLiked}
        likeCount={likeCount}
        commentCount={commentCount}
        onToggleLike={toggleLike}
        pendingLike={like.isPending || unlike.isPending}
        comments={comments}
        isLoadingComments={commentsLoading}
        onAddComment={async (body) => {
          await addComment.mutateAsync({ promptId: prompt.id, body });
        }}
        onDeleteComment={async (commentId) => {
          await delComment.mutateAsync({ commentId, promptId: prompt.id });
        }}
        currentUserId={userId ?? null}
        variant="inline"
        allowLikes={allowLikes}
        allowComments={allowComments}
      />
    </li>
  );
}
