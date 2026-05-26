"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type PostInteractions = {
  likeCount: number;
  commentCount: number;
  iLiked: boolean;
};

/** Fetches like + comment counts for a post and whether the viewer has liked it. */
export function usePostInteractions(postId: string | null | undefined) {
  return useQuery({
    queryKey: ["post_interactions", postId],
    enabled: !!postId,
    queryFn: async (): Promise<PostInteractions> => {
      const supa = getSupabaseBrowser();
      if (!supa || !postId) return { likeCount: 0, commentCount: 0, iLiked: false };

      const { data: { session } } = await supa.auth.getSession();
      const me = session?.user?.id ?? null;

      const [likes, comments, myLike] = await Promise.all([
        (supa as any)
          .from("post_likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId),
        (supa as any)
          .from("post_comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId),
        me
          ? (supa as any)
              .from("post_likes")
              .select("post_id", { head: true, count: "exact" })
              .eq("post_id", postId)
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

export function useLikePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { error } = await (supa as any)
        .from("post_likes")
        .insert({ post_id: postId, user_id: session.user.id });
      if (error && !error.message?.includes("duplicate")) throw error;
      return postId;
    },
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ["post_interactions", postId] });
      const previous = qc.getQueryData<PostInteractions>(["post_interactions", postId]);
      qc.setQueryData<PostInteractions>(["post_interactions", postId], (cur) => ({
        likeCount: (cur?.likeCount ?? 0) + (cur?.iLiked ? 0 : 1),
        commentCount: cur?.commentCount ?? 0,
        iLiked: true,
      }));
      return { previous };
    },
    onError: (_e, postId, ctx) => {
      if (ctx?.previous) qc.setQueryData(["post_interactions", postId], ctx.previous);
    },
    onSettled: (postId) => {
      qc.invalidateQueries({ queryKey: ["post_interactions", postId] });
    },
  });
}

export function useUnlikePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { error } = await (supa as any)
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", session.user.id);
      if (error) throw error;
      return postId;
    },
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ["post_interactions", postId] });
      const previous = qc.getQueryData<PostInteractions>(["post_interactions", postId]);
      qc.setQueryData<PostInteractions>(["post_interactions", postId], (cur) => ({
        likeCount: Math.max(0, (cur?.likeCount ?? 1) - (cur?.iLiked ? 1 : 0)),
        commentCount: cur?.commentCount ?? 0,
        iLiked: false,
      }));
      return { previous };
    },
    onError: (_e, postId, ctx) => {
      if (ctx?.previous) qc.setQueryData(["post_interactions", postId], ctx.previous);
    },
    onSettled: (postId) => {
      qc.invalidateQueries({ queryKey: ["post_interactions", postId] });
    },
  });
}

// ────────────────────── comments ────────────────────────────────
export type PostComment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  author?: { id: string; alias: string | null; avatar_url: string | null } | null;
};

export function usePostComments(postId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["post_comments", postId],
    enabled: !!postId && enabled,
    queryFn: async (): Promise<PostComment[]> => {
      const supa = getSupabaseBrowser();
      if (!supa || !postId) return [];

      const { data: comments, error } = await (supa as any)
        .from("post_comments")
        .select("id, post_id, author_id, body, created_at, edited_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        // Surface the real error to React Query so the UI can show it
        console.error("usePostComments error:", error);
        throw new Error(error.message ?? "Couldn't load comments.");
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

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, body }: { postId: string; body: string }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { data, error } = await (supa as any)
        .from("post_comments")
        .insert({
          post_id: postId,
          author_id: session.user.id,
          body: body.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as PostComment;
    },
    onSuccess: (comment) => {
      qc.invalidateQueries({ queryKey: ["post_comments", comment.post_id] });
      qc.invalidateQueries({ queryKey: ["post_interactions", comment.post_id] });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { error } = await (supa as any)
        .from("post_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
      return { commentId, postId };
    },
    onSuccess: ({ postId }) => {
      qc.invalidateQueries({ queryKey: ["post_comments", postId] });
      qc.invalidateQueries({ queryKey: ["post_interactions", postId] });
    },
  });
}
