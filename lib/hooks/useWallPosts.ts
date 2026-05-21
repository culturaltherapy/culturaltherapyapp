"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type WallPost = {
  id: string;
  owner_id: string;
  body: string;
  visibility: "public" | "tribe" | "village" | "private";
  village_id: string | null;
  created_at: string;
  edited_at: string | null;
};

export type Visibility = WallPost["visibility"];

// Fetch a user's wall posts. RLS handles which the viewer can actually see.
export function useWallPosts(ownerId: string | null | undefined) {
  return useQuery({
    queryKey: ["wall_posts", ownerId],
    enabled: !!ownerId,
    queryFn: async (): Promise<WallPost[]> => {
      const supa = getSupabaseBrowser();
      if (!supa || !ownerId) return [];

      const { data, error } = await (supa as any)
        .from("posts")
        .select("id, owner_id, body, visibility, village_id, created_at, edited_at")
        .eq("owner_id", ownerId)
        .is("village_id", null) // Only personal wall posts, not village posts
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("useWallPosts error:", error.message);
        return [];
      }
      return data ?? [];
    },
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, visibility }: {
      body: string;
      visibility: Visibility;
    }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { data, error } = await (supa as any).from("posts").insert({
        owner_id: session.user.id,
        body: body.trim(),
        visibility,
        village_id: null,
      }).select().single();

      if (error) throw error;
      return data as WallPost;
    },
    onSuccess: (post) => {
      qc.invalidateQueries({ queryKey: ["wall_posts", post.owner_id] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { error } = await (supa as any)
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("owner_id", session.user.id);

      if (error) throw error;
      return { id: postId, owner_id: session.user.id };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["wall_posts", res.owner_id] });
    },
  });
}
