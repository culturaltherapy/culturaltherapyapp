"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type ConnectionStatus = "pending" | "accepted" | "declined" | "cancelled" | "blocked";

export type Connection = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: ConnectionStatus;
  message: string | null;
  created_at: string;
  responded_at: string | null;
  other?: { id: string; alias: string | null; avatar_url: string | null } | null;
  direction: "outgoing" | "incoming";
};

/** All my connections (pending + accepted) with the other user's profile hydrated. */
export function useMyConnections() {
  return useQuery({
    queryKey: ["connections", "mine"],
    queryFn: async (): Promise<Connection[]> => {
      const supa = getSupabaseBrowser();
      if (!supa) return [];

      const { data: { session } } = await supa.auth.getSession();
      if (!session) return [];

      const me = session.user.id;
      const { data, error } = await (supa as any)
        .from("connections")
        .select("*")
        .in("status", ["pending", "accepted"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("useMyConnections error:", error.message);
        return [];
      }
      if (!data) return [];

      const otherIds = Array.from(new Set(
        data.map((c: any) => (c.requester_id === me ? c.recipient_id : c.requester_id))
      ));
      let profMap = new Map<string, any>();
      if (otherIds.length > 0) {
        const { data: profs } = await (supa as any)
          .from("profiles")
          .select("id, alias, avatar_url")
          .in("id", otherIds);
        profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
      }

      return data.map((c: any) => {
        const otherId = c.requester_id === me ? c.recipient_id : c.requester_id;
        return {
          ...c,
          other: profMap.get(otherId) ?? null,
          direction: c.requester_id === me ? "outgoing" : "incoming",
        };
      });
    },
  });
}

/** Get the current connection state between the signed-in user and another user. */
export function useConnectionWith(otherUserId: string | null | undefined) {
  return useQuery({
    queryKey: ["connections", "with", otherUserId],
    enabled: !!otherUserId,
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa || !otherUserId) return null;
      const { data: { session } } = await supa.auth.getSession();
      if (!session) return null;

      const me = session.user.id;
      const { data } = await (supa as any)
        .from("connections")
        .select("*")
        .or(
          `and(requester_id.eq.${me},recipient_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},recipient_id.eq.${me})`
        )
        .in("status", ["pending", "accepted"])
        .maybeSingle();

      if (!data) return null;
      return {
        ...data,
        direction: data.requester_id === me ? "outgoing" : "incoming",
      } as Connection;
    },
  });
}

export function useSendConnectionRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipientId, message }: { recipientId: string; message?: string }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { data, error } = await (supa as any).from("connections").insert({
        requester_id: session.user.id,
        recipient_id: recipientId,
        message: message?.trim() || null,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["connections", "with", vars.recipientId] });
    },
  });
}

export function useAcceptConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { error } = await (supa as any)
        .from("connections")
        .update({ status: "accepted", responded_at: new Date().toISOString() })
        .eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeclineConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { error } = await (supa as any)
        .from("connections")
        .update({ status: "declined", responded_at: new Date().toISOString() })
        .eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connections"] });
    },
  });
}
