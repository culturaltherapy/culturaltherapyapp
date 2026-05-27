"use client";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type DmThread = {
  id: string;
  user_a: string;
  user_b: string;
  last_message_at: string | null;
  created_at: string;
  other?: { id: string; alias: string | null; avatar_url: string | null; last_seen_at: string | null } | null;
  unread_count?: number;
  last_message?: { body: string; sender_id: string; created_at: string } | null;
};

export type DmMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

// ─────────────────────────────────────────────────────────────────
// Threads list (sidebar)
// ─────────────────────────────────────────────────────────────────
export function useMyDmThreads() {
  return useQuery({
    queryKey: ["dm_threads", "mine"],
    queryFn: async (): Promise<DmThread[]> => {
      const supa = getSupabaseBrowser();
      if (!supa) return [];

      const { data: { session } } = await supa.auth.getSession();
      if (!session) return [];
      const me = session.user.id;

      const { data: threads, error } = await (supa as any)
        .from("dm_threads")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) {
        console.error("useMyDmThreads error:", error.message);
        return [];
      }
      if (!threads || threads.length === 0) return [];

      // Hydrate other party profiles
      const otherIds = threads.map((t: any) => (t.user_a === me ? t.user_b : t.user_a));
      const uniqueOtherIds = Array.from(new Set(otherIds));
      const { data: profiles } = await (supa as any)
        .from("profiles")
        .select("id, alias, avatar_url, last_seen_at")
        .in("id", uniqueOtherIds);
      const profMap = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));

      // Last message + unread count per thread
      const enriched = await Promise.all(threads.map(async (t: any) => {
        const otherId = t.user_a === me ? t.user_b : t.user_a;

        const { data: lastMsg } = await (supa as any)
          .from("dm_messages")
          .select("body, sender_id, created_at")
          .eq("thread_id", t.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count: unread } = await (supa as any)
          .from("dm_messages")
          .select("*", { count: "exact", head: true })
          .eq("thread_id", t.id)
          .is("read_at", null)
          .neq("sender_id", me);

        return {
          ...t,
          other: profMap.get(otherId) ?? null,
          last_message: lastMsg ?? null,
          unread_count: unread ?? 0,
        } as DmThread;
      }));

      return enriched;
    },
    refetchOnWindowFocus: true,
  });
}

// ─────────────────────────────────────────────────────────────────
// Single-thread messages with realtime subscription
// ─────────────────────────────────────────────────────────────────
export function useThreadMessages(threadId: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["dm_messages", threadId],
    enabled: !!threadId,
    queryFn: async (): Promise<DmMessage[]> => {
      const supa = getSupabaseBrowser();
      if (!supa || !threadId) return [];

      const { data, error } = await (supa as any)
        .from("dm_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("useThreadMessages error:", error.message);
        return [];
      }
      return (data ?? []) as DmMessage[];
    },
  });

  // Subscribe to INSERTs on this thread
  React.useEffect(() => {
    if (!threadId) return;
    const supa = getSupabaseBrowser();
    if (!supa) return;

    const channel = (supa as any)
      .channel(`dm_thread_${threadId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "dm_messages", filter: `thread_id=eq.${threadId}` },
        (payload: any) => {
          qc.setQueryData<DmMessage[]>(["dm_messages", threadId], (cur) => {
            const next = cur ?? [];
            // De-dupe in case we got the optimistic + realtime row
            if (next.some((m) => m.id === payload.new.id)) return next;
            return [...next, payload.new];
          });
          // Bump threads list so the sidebar updates last_message_at
          qc.invalidateQueries({ queryKey: ["dm_threads", "mine"] });
        }
      )
      .subscribe();

    return () => {
      (supa as any).removeChannel(channel);
    };
  }, [threadId, qc]);

  return query;
}

// ─────────────────────────────────────────────────────────────────
// Send a message
// ─────────────────────────────────────────────────────────────────
export function useSendDm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ threadId, body }: { threadId: string; body: string }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { data, error } = await (supa as any)
        .from("dm_messages")
        .insert({
          thread_id: threadId,
          sender_id: session.user.id,
          body: body.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as DmMessage;
    },
    onSuccess: (msg) => {
      // Optimistic: append immediately
      qc.setQueryData<DmMessage[]>(["dm_messages", msg.thread_id], (cur) => {
        const next = cur ?? [];
        if (next.some((m) => m.id === msg.id)) return next;
        return [...next, msg];
      });
      qc.invalidateQueries({ queryKey: ["dm_threads", "mine"] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────
// Find or create a thread with someone
// ─────────────────────────────────────────────────────────────────
export function useOrCreateThreadWith() {
  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data, error } = await (supa as any).rpc("get_or_create_dm_thread", {
        p_other_user_id: otherUserId,
      });
      if (error) throw error;
      return data as string; // thread id
    },
  });
}

// ─────────────────────────────────────────────────────────────────
// Mark all messages in a thread as read (for current user as recipient)
// ─────────────────────────────────────────────────────────────────
export function useMarkThreadRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (threadId: string) => {
      const supa = getSupabaseBrowser();
      if (!supa) return;
      const { data: { session } } = await supa.auth.getSession();
      if (!session) return;

      const { error } = await (supa as any)
        .from("dm_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("thread_id", threadId)
        .neq("sender_id", session.user.id)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dm_threads", "mine"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
