"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { discussionRooms as mockRooms } from "@/lib/mock-data";

// ─────────────────────────────────────────────────────────────────────────────
// Rooms
// ─────────────────────────────────────────────────────────────────────────────
export function useDiscussionRooms() {
  return useQuery({
    queryKey: ["discussion_rooms"],
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return mockRooms;

      const { data, error } = await (supa as any)
        .from("discussion_rooms")
        .select("*")
        .order("title");

      if (error) {
        console.error("useDiscussionRooms error:", error.message);
        return [];
      }
      if (!data) return [];
      return data.map((r: any) => ({
        id: r.id,
        title: r.title,
        blurb: r.blurb ?? "",
        count: 0,
        isChat: r.is_chat ?? false,
      }));
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Threads — top-level discussion_posts in a room (parent_id IS NULL)
// ─────────────────────────────────────────────────────────────────────────────
export function useDiscussionThreads(roomId: string) {
  return useQuery({
    queryKey: ["discussion_threads", roomId],
    enabled: !!roomId,
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return [];

      // 1) Top-level threads
      const { data: threads, error } = await (supa as any)
        .from("discussion_posts")
        .select("id, room_id, author_id, title, body, created_at, edited_at")
        .eq("room_id", roomId)
        .is("parent_id", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("useDiscussionThreads error:", error.message);
        return [];
      }
      if (!threads || threads.length === 0) return [];

      // 2) Reply counts per thread (one extra round-trip, kept simple)
      const threadIds = threads.map((t: any) => t.id);
      const { data: replies } = await (supa as any)
        .from("discussion_posts")
        .select("parent_id")
        .in("parent_id", threadIds);

      const replyCount = new Map<string, number>();
      (replies ?? []).forEach((r: any) => {
        replyCount.set(r.parent_id, (replyCount.get(r.parent_id) ?? 0) + 1);
      });

      // 3) Author profiles
      const authorIds = Array.from(new Set(threads.map((t: any) => t.author_id)));
      const { data: profs } = await (supa as any)
        .from("profiles")
        .select("id, alias, avatar_url")
        .in("id", authorIds);
      const profMap = new Map<string, any>((profs ?? []).map((p: any) => [p.id, p]));

      return threads.map((t: any) => ({
        ...t,
        author: profMap.get(t.author_id) ?? null,
        reply_count: replyCount.get(t.id) ?? 0,
      }));
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Single thread + replies
// ─────────────────────────────────────────────────────────────────────────────
export function useThread(threadId: string) {
  return useQuery({
    queryKey: ["discussion_thread", threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return null;

      const { data: thread } = await (supa as any)
        .from("discussion_posts")
        .select("id, room_id, author_id, title, body, created_at, edited_at, parent_id")
        .eq("id", threadId)
        .maybeSingle();

      if (!thread) return null;

      // Replies
      const { data: replies } = await (supa as any)
        .from("discussion_posts")
        .select("id, author_id, body, created_at, edited_at, parent_id")
        .eq("parent_id", threadId)
        .order("created_at", { ascending: true });

      // Author profiles for OP + all repliers
      const ids = Array.from(new Set([thread.author_id, ...(replies ?? []).map((r: any) => r.author_id)]));
      const { data: profs } = await (supa as any)
        .from("profiles")
        .select("id, alias, avatar_url")
        .in("id", ids);
      const profMap = new Map<string, any>((profs ?? []).map((p: any) => [p.id, p]));

      // Room metadata for breadcrumb
      const { data: room } = await (supa as any)
        .from("discussion_rooms")
        .select("id, title")
        .eq("id", thread.room_id)
        .maybeSingle();

      return {
        thread: { ...thread, author: profMap.get(thread.author_id) ?? null },
        replies: (replies ?? []).map((r: any) => ({
          ...r,
          author: profMap.get(r.author_id) ?? null,
        })),
        room,
      };
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────
export function useCreateThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ roomId, title, body }: { roomId: string; title: string; body: string }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { data, error } = await (supa as any).from("discussion_posts").insert({
        room_id: roomId,
        author_id: session.user.id,
        title: title.trim() || null,
        body: body.trim(),
        parent_id: null,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["discussion_threads", vars.roomId] });
    },
  });
}

export function useReplyToThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ threadId, roomId, body }: { threadId: string; roomId: string; body: string }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { data, error } = await (supa as any).from("discussion_posts").insert({
        room_id: roomId,
        author_id: session.user.id,
        body: body.trim(),
        parent_id: threadId,
        title: null,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["discussion_thread", vars.threadId] });
      qc.invalidateQueries({ queryKey: ["discussion_threads", vars.roomId] });
    },
  });
}

// ─── Legacy alias kept so the live "Right now" chat room still works ─────────
export function useDiscussionPosts(roomId: string) {
  return useDiscussionThreads(roomId);
}

export function usePostToDiscussion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ roomId, body }: { roomId: string; body: string }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { data, error } = await (supa as any).from("discussion_posts").insert({
        room_id: roomId,
        author_id: session.user.id,
        body: body.trim(),
        parent_id: null,
        title: null,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { roomId }) => {
      qc.invalidateQueries({ queryKey: ["discussion_threads", roomId] });
    },
  });
}
