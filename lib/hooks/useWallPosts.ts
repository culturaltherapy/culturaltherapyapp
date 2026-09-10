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

export type WallPostWithOwner = WallPost & {
  owner: {
    alias: string | null;
    avatar_url: string | null;
    allow_wall_likes: boolean | null;
    allow_wall_comments: boolean | null;
  } | null;
};

// village is intentionally excluded — it requires a village_id, which
// personal wall posts never have (see useCreatePost below).
export const VIS_OPTIONS: { value: Visibility; label: string; description: string }[] = [
  { value: "public",  label: "Public",   description: "Anyone on Cultural Therapy can see." },
  { value: "tribe",   label: "My Tribes", description: "Only people in your Tribes." },
  { value: "private", label: "Just me",   description: "Only you can see this." },
];

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
      qc.invalidateQueries({ queryKey: ["community_wall_feed"] });
    },
  });
}

export function useUpdatePostVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, visibility }: { postId: string; visibility: Visibility }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { data, error } = await (supa as any)
        .from("posts")
        .update({ visibility })
        .eq("id", postId)
        .eq("owner_id", session.user.id)
        .select()
        .single();

      if (error) throw error;
      return data as WallPost;
    },
    onSuccess: (post) => {
      qc.invalidateQueries({ queryKey: ["wall_posts", post.owner_id] });
      qc.invalidateQueries({ queryKey: ["community_wall_feed"] });
    },
  });
}

// The Community Wall: recent public posts from every member, for the home
// dashboard. RLS already allows any authenticated user to read visibility
// = 'public' posts regardless of tribe, so this needs no server changes.
export function useCommunityWallFeed(limit = 20) {
  return useQuery({
    queryKey: ["community_wall_feed", limit],
    queryFn: async (): Promise<WallPostWithOwner[]> => {
      const supa = getSupabaseBrowser();
      if (!supa) return [];

      const { data, error } = await (supa as any)
        .from("posts")
        .select("id, owner_id, body, visibility, village_id, created_at, edited_at, owner:profiles(alias, avatar_url, allow_wall_likes, allow_wall_comments)")
        .eq("visibility", "public")
        .is("village_id", null)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("useCommunityWallFeed error:", error.message);
        return [];
      }
      return data ?? [];
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
      qc.invalidateQueries({ queryKey: ["community_wall_feed"] });
    },
  });
}
