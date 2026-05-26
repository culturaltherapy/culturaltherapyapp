"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type PromptInteractions = {
  likeCount: number;
  commentCount: number;
  iLiked: boolean;
};

export function usePromptInteractions(promptId: string | null | undefined) {
  return useQuery({
    queryKey: ["prompt_interactions", promptId],
    enabled: !!promptId,
    queryFn: async (): Promise<PromptInteractions> => {
      const supa = getSupabaseBrowser();
      if (!supa || !promptId) return { likeCount: 0, commentCount: 0, iLiked: false };

      const { data: { session } } = await supa.auth.getSession();
      const me = session?.user?.id ?? null;

      const [likes, comments, myLike] = await Promise.all([
        (supa as any)
          .from("prompt_likes")
          .select("*", { count: "exact", head: true })
          .eq("prompt_id", promptId),
        (supa as any)
          .from("prompt_comments")
          .select("*", { count: "exact", head: true })
          .eq("prompt_id", promptId),
        me
          ? (supa as any)
              .from("prompt_likes")
              .select("prompt_id", { head: true, count: "exact" })
              .eq("prompt_id", promptId)
              .eq("user_id", me)
          : Promise.resolve({ count: 0 }),
      ]);

      return {
        likeCount: likes.count ?? 0,
        commentCount: comments.count ?? 0,
        iLiked: (myLike.count ?? 0) > 0,
      };
    },
  });
}

export function useLikePrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (promptId: string) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { error } = await (supa as any)
        .from("prompt_likes")
        .insert({ prompt_id: promptId, user_id: session.user.id });
      if (error && !error.message?.includes("duplicate")) throw error;
      return promptId;
    },
    onMutate: async (promptId) => {
      await qc.cancelQueries({ queryKey: ["prompt_interactions", promptId] });
      const previous = qc.getQueryData<PromptInteractions>(["prompt_interactions", promptId]);
      qc.setQueryData<PromptInteractions>(["prompt_interactions", promptId], (cur) => ({
        likeCount: (cur?.likeCount ?? 0) + (cur?.iLiked ? 0 : 1),
        commentCount: cur?.commentCount ?? 0,
        iLiked: true,
      }));
      return { previous };
    },
    onError: (_e, promptId, ctx) => {
      if (ctx?.previous) qc.setQueryData(["prompt_interactions", promptId], ctx.previous);
    },
    onSettled: (promptId) => {
      qc.invalidateQueries({ queryKey: ["prompt_interactions", promptId] });
    },
  });
}

export function useUnlikePrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (promptId: string) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { error } = await (supa as any)
        .from("prompt_likes")
        .delete()
        .eq("prompt_id", promptId)
        .eq("user_id", session.user.id);
      if (error) throw error;
      return promptId;
    },
    onMutate: async (promptId) => {
      await qc.cancelQueries({ queryKey: ["prompt_interactions", promptId] });
      const previous = qc.getQueryData<PromptInteractions>(["prompt_interactions", promptId]);
      qc.setQueryData<PromptInteractions>(["prompt_interactions", promptId], (cur) => ({
        likeCount: Math.max(0, (cur?.likeCount ?? 1) - (cur?.iLiked ? 1 : 0)),
        commentCount: cur?.commentCount ?? 0,
        iLiked: false,
      }));
      return { previous };
    },
    onError: (_e, promptId, ctx) => {
      if (ctx?.previous) qc.setQueryData(["prompt_interactions", promptId], ctx.previous);
    },
    onSettled: (promptId) => {
      qc.invalidateQueries({ queryKey: ["prompt_interactions", promptId] });
    },
  });
}

export type PromptComment = {
  id: string;
  prompt_id: string;
  author_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  author?: { id: string; alias: string | null; avatar_url: string | null } | null;
};

export function usePromptComments(promptId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["prompt_comments", promptId],
    enabled: !!promptId && enabled,
    queryFn: async (): Promise<PromptComment[]> => {
      const supa = getSupabaseBrowser();
      if (!supa || !promptId) return [];

      const { data: comments, error } = await (supa as any)
        .from("prompt_comments")
        .select("id, prompt_id, author_id, body, created_at, edited_at")
        .eq("prompt_id", promptId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("usePromptComments error:", error.message);
        return [];
      }
      if (!comments || comments.length === 0) return [];

      const authorIds = Array.from(new Set(comments.map((c: any) => c.author_id)));
      const { data: authors } = await (supa as any)
        .from("profiles")
        .select("id, alias, avatar_url")
        .in("id", authorIds);
      const authorMap = new Map<string, any>((authors ?? []).map((a: any) => [a.id, a]));

      return comments.map((c: any) => ({ ...c, author: authorMap.get(c.author_id) ?? null }));
    },
  });
}

export function useAddPromptComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ promptId, body }: { promptId: string; body: string }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { data, error } = await (supa as any)
        .from("prompt_comments")
        .insert({
          prompt_id: promptId,
          author_id: session.user.id,
          body: body.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as PromptComment;
    },
    onSuccess: (comment) => {
      qc.invalidateQueries({ queryKey: ["prompt_comments", comment.prompt_id] });
      qc.invalidateQueries({ queryKey: ["prompt_interactions", comment.prompt_id] });
    },
  });
}

export function useDeletePromptComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, promptId }: { commentId: string; promptId: string }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { error } = await (supa as any)
        .from("prompt_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
      return { commentId, promptId };
    },
    onSuccess: ({ promptId }) => {
      qc.invalidateQueries({ queryKey: ["prompt_comments", promptId] });
      qc.invalidateQueries({ queryKey: ["prompt_interactions", promptId] });
    },
  });
}
