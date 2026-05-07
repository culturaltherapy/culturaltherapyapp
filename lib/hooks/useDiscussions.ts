"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { discussionRooms as mockRooms, discussionThreads as mockThreads } from "@/lib/mock-data";

export function useDiscussionRooms() {
  return useQuery({
    queryKey: ["discussion_rooms"],
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return mockRooms;

      const { data, error } = await supa
        .from("discussion_rooms")
        .select("*")
        .order("title");

      if (error || !data?.length) return mockRooms;
      return data.map((r) => ({
        id: r.id,
        title: r.title,
        blurb: r.blurb ?? "",
        count: 0,
        isChat: r.is_chat ?? false
      }));
    }
  });
}

export function useDiscussionPosts(roomId: string) {
  return useQuery({
    queryKey: ["discussion_posts", roomId],
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return mockThreads.filter((t) => t.roomId === roomId);

      const { data } = await supa
        .from("discussion_posts")
        .select("*, profiles(alias, avatar_url), discussion_replies(count)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(30);

      return (data ?? []).map((p: any) => ({
        id: p.id,
        roomId: p.room_id,
        title: p.body?.slice(0, 80) ?? "",
        replies: p.discussion_replies?.[0]?.count ?? 0,
        last: new Date(p.created_at).toLocaleTimeString()
      }));
    },
    enabled: !!roomId
  });
}

export function usePostToDiscussion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ roomId, body }: { roomId: string; body: string }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { data, error } = await supa.from("discussion_posts").insert({
        room_id: roomId,
        author_id: session.user.id,
        body
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { roomId }) => {
      qc.invalidateQueries({ queryKey: ["discussion_posts", roomId] });
    }
  });
}
