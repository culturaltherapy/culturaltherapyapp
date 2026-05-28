"use client";

import * as React from "react";
import { InteractionsSection } from "@/components/interactions/InteractionsSection";
import { useSession } from "@/lib/hooks/useSession";
import { ReportButton } from "@/components/moderation/ReportButton";
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
  /** owner of the prompt — passed so we can suppress the Report button on self-views */
  user_id?: string;
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
  const isOwn = userId != null && prompt.user_id != null && prompt.user_id === userId;

  function toggleLike() {
    if (iLiked) unlike.mutate(prompt.id);
    else like.mutate(prompt.id);
  }

  return (
    <li className="surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{prompt.question}</p>
          <p className="font-display text-lg mt-1 italic leading-snug">&ldquo;{prompt.answer}&rdquo;</p>
        </div>
        {!isOwn && (
          <ReportButton
            targetKind="post"
            targetTable="profile_prompts"
            targetId={prompt.id}
            targetLabel="this prompt"
            variant="link"
            className="shrink-0"
          />
        )}
      </div>

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
        commentsTable="prompt_comments"
      />
    </li>
  );
}
