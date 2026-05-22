"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type NotificationKind =
  | "tribe_request_received"
  | "tribe_invitation"
  | "tribe_accepted"
  | "thread_reply"
  | "connection_request"
  | "connection_accepted"
  | "direct_message"
  | "post_comment"
  | "post_like";

export type Notification = {
  id: string;
  user_id: string;
  kind: NotificationKind;
  source_user_id: string | null;
  ref_kind: string | null;
  ref_id: string | null;
  payload: Record<string, any>;
  read_at: string | null;
  created_at: string;
  source?: { id: string; alias: string | null; avatar_url: string | null } | null;
};

export function useNotifications(limit = 30) {
  return useQuery({
    queryKey: ["notifications", "list", limit],
    queryFn: async (): Promise<Notification[]> => {
      const supa = getSupabaseBrowser();
      if (!supa) return [];

      const { data: { session } } = await supa.auth.getSession();
      if (!session) return [];

      const { data, error } = await (supa as any)
        .from("notifications")
        .select("id, user_id, kind, source_user_id, ref_kind, ref_id, payload, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("useNotifications error:", error.message);
        return [];
      }
      if (!data) return [];

      // Hydrate source user profiles
      const sourceIds = Array.from(new Set(
        data.map((n: any) => n.source_user_id).filter(Boolean)
      ));
      let profMap = new Map<string, any>();
      if (sourceIds.length > 0) {
        const { data: profs } = await (supa as any)
          .from("profiles")
          .select("id, alias, avatar_url")
          .in("id", sourceIds);
        profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
      }

      return data.map((n: any) => ({
        ...n,
        source: n.source_user_id ? profMap.get(n.source_user_id) ?? null : null,
      }));
    },
    // Refetch on window focus so badge count stays in sync after multi-tab use
    refetchOnWindowFocus: true,
    // Refetch every 60s so a passive recipient sees new notifications
    refetchInterval: 60_000,
  });
}

export function useUnreadCount() {
  const { data: list = [] } = useNotifications();
  return list.filter((n) => !n.read_at).length;
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return;
      const { error } = await (supa as any).rpc("mark_all_notifications_read");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supa = getSupabaseBrowser();
      if (!supa) return;
      const { error } = await (supa as any)
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
