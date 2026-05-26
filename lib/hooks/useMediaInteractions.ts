"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type MediaInteractions = {
  likeCount: number;
  commentCount: number;
  iLiked: boolean;
};

export function useMediaInteractions(mediaId: string | null | undefined) {
  return useQuery({
    queryKey: ["media_interactions", mediaId],
    enabled: !!mediaId,
    queryFn: async (): Promise<MediaInteractions> => {
      const supa = getSupabaseBrowser();
      if (!supa || !mediaId) return { likeCount: 0, commentCount: 0, iLiked: false };

      const { data: { session } } = await supa.auth.getSession();
      const me = session?.user?.id ?? null;

      const [likes, comments, myLike] = await Promise.all([
        (supa as any)
          .from("media_likes")
          .select("*", { count: "exact", head: true })
          .eq("media_id", mediaId),
        (supa as any)
          .from("media_comments")
          .select("*", { count: "exact", head: true })
          .eq("media_id", mediaId),
        me
          ? (supa as any)
              .from("media_likes")
              .select("media_id", { head: true, count: "exact" })
              .eq("media_id", mediaId)
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

export function useLikeMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId: string) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { error } = await (supa as any)
        .from("media_likes")
        .insert({ media_id: mediaId, user_id: session.user.id });
      if (error && !error.message?.includes("duplicate")) throw error;
      return mediaId;
    },
    onMutate: async (mediaId) => {
      await qc.cancelQueries({ queryKey: ["media_interactions", mediaId] });
      const previous = qc.getQueryData<MediaInteractions>(["media_interactions", mediaId]);
      qc.setQueryData<MediaInteractions>(["media_interactions", mediaId], (cur) => ({
        likeCount: (cur?.likeCount ?? 0) + (cur?.iLiked ? 0 : 1),
        commentCount: cur?.commentCount ?? 0,
        iLiked: true,
      }));
      return { previous };
    },
    onError: (_e, mediaId, ctx) => {
      if (ctx?.previous) qc.setQueryData(["media_interactions", mediaId], ctx.previous);
    },
    onSettled: (mediaId) => {
      qc.invalidateQueries({ queryKey: ["media_interactions", mediaId] });
    },
  });
}

export function useUnlikeMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId: string) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { error } = await (supa as any)
        .from("media_likes")
        .delete()
        .eq("media_id", mediaId)
        .eq("user_id", session.user.id);
      if (error) throw error;
      return mediaId;
    },
    onMutate: async (mediaId) => {
      await qc.cancelQueries({ queryKey: ["media_interactions", mediaId] });
      const previous = qc.getQueryData<MediaInteractions>(["media_interactions", mediaId]);
      qc.setQueryData<MediaInteractions>(["media_interactions", mediaId], (cur) => ({
        likeCount: Math.max(0, (cur?.likeCount ?? 1) - (cur?.iLiked ? 1 : 0)),
        commentCount: cur?.commentCount ?? 0,
        iLiked: false,
      }));
      return { previous };
    },
    onError: (_e, mediaId, ctx) => {
      if (ctx?.previous) qc.setQueryData(["media_interactions", mediaId], ctx.previous);
    },
    onSettled: (mediaId) => {
      qc.invalidateQueries({ queryKey: ["media_interactions", mediaId] });
    },
  });
}

export type MediaComment = {
  id: string;
  media_id: string;
  author_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  author?: { id: string; alias: string | null; avatar_url: string | null } | null;
};

export function useMediaComments(mediaId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["media_comments", mediaId],
    enabled: !!mediaId && enabled,
    queryFn: async (): Promise<MediaComment[]> => {
      const supa = getSupabaseBrowser();
      if (!supa || !mediaId) return [];

      const { data: comments, error } = await (supa as any)
        .from("media_comments")
        .select("id, media_id, author_id, body, created_at, edited_at")
        .eq("media_id", mediaId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("useMediaComments error:", error.message);
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

export function useAddMediaComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ mediaId, body }: { mediaId: string; body: string }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { data, error } = await (supa as any)
        .from("media_comments")
        .insert({
          media_id: mediaId,
          author_id: session.user.id,
          body: body.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as MediaComment;
    },
    onSuccess: (comment) => {
      qc.invalidateQueries({ queryKey: ["media_comments", comment.media_id] });
      qc.invalidateQueries({ queryKey: ["media_interactions", comment.media_id] });
    },
  });
}

export function useDeleteMediaComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, mediaId }: { commentId: string; mediaId: string }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { error } = await (supa as any)
        .from("media_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
      return { commentId, mediaId };
    },
    onSuccess: ({ mediaId }) => {
      qc.invalidateQueries({ queryKey: ["media_comments", mediaId] });
      qc.invalidateQueries({ queryKey: ["media_interactions", mediaId] });
    },
  });
}
