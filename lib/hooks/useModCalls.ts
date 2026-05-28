"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { newRoomName } from "@/lib/jitsi";

export type ModCallStatus = "ringing" | "accepted" | "declined" | "missed" | "ended";
export type ModCallKind = "audio" | "video";

export type ModCall = {
  id: string;
  initiator_id: string;
  recipient_id: string;
  report_id: string | null;
  room_name: string;
  kind: ModCallKind;
  status: ModCallStatus;
  created_at: string;
  accepted_at: string | null;
  ended_at: string | null;
  initiator?: { id: string; alias: string | null; avatar_url: string | null } | null;
};

/**
 * The recipient-side hook: subscribes to any ringing call for the
 * signed-in user via Supabase Realtime + a short-poll fallback. Returns
 * the active incoming call (if any) so the UI can pop an IncomingCallModal.
 */
export function useIncomingCall(currentUserId: string | null | undefined): ModCall | null {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["mod_calls", "incoming", currentUserId],
    enabled: !!currentUserId,
    queryFn: async (): Promise<ModCall[]> => {
      const supa = getSupabaseBrowser();
      if (!supa || !currentUserId) return [];

      const { data: calls, error } = await (supa as any)
        .from("mod_calls")
        .select("*")
        .eq("recipient_id", currentUserId)
        .eq("status", "ringing")
        // Only consider rings from the last 60 s — anything older is dead.
        .gt("created_at", new Date(Date.now() - 60_000).toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error("useIncomingCall error:", error.message);
        return [];
      }
      if (!calls || calls.length === 0) return [];

      const initiatorIds = Array.from(new Set(calls.map((c: any) => c.initiator_id)));
      const { data: profiles } = await (supa as any)
        .from("profiles")
        .select("id, alias, avatar_url")
        .in("id", initiatorIds);
      const profMap = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));

      return calls.map((c: any) => ({ ...c, initiator: profMap.get(c.initiator_id) ?? null }));
    },
    // Fall-back: re-fetch every 10s in case realtime drops the row.
    refetchInterval: 10_000,
  });

  // Realtime: push refresh on any change to mod_calls where I'm the recipient
  React.useEffect(() => {
    if (!currentUserId) return;
    const supa = getSupabaseBrowser();
    if (!supa) return;
    const channel = (supa as any)
      .channel(`mod_calls_for_${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mod_calls",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["mod_calls", "incoming", currentUserId] });
        }
      )
      .subscribe();
    return () => { (supa as any).removeChannel(channel); };
  }, [currentUserId, qc]);

  return query.data?.[0] ?? null;
}

/**
 * Initiate a call as the moderator. Inserts a mod_calls row with
 * status='ringing'. Returns the row (including the room_name) so the
 * caller can open the Jitsi iframe.
 */
export function useInitiateModCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recipientId,
      reportId,
      kind,
    }: { recipientId: string; reportId?: string | null; kind: ModCallKind }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");

      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Sign in first.");

      const room = newRoomName();

      const { data, error } = await (supa as any)
        .from("mod_calls")
        .insert({
          initiator_id: session.user.id,
          recipient_id: recipientId,
          report_id:    reportId ?? null,
          room_name:    room,
          kind,
          status:       "ringing",
        })
        .select()
        .single();

      if (error) throw error;
      return data as ModCall;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mod_calls"] });
    },
  });
}

/** Update the status of an in-progress call (accept / decline / end). */
export function useUpdateCallStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      callId,
      status,
    }: { callId: string; status: ModCallStatus }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");

      const patch: Record<string, any> = { status };
      if (status === "accepted") patch.accepted_at = new Date().toISOString();
      if (status === "ended" || status === "declined" || status === "missed") {
        patch.ended_at = new Date().toISOString();
      }

      const { error } = await (supa as any)
        .from("mod_calls")
        .update(patch)
        .eq("id", callId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mod_calls"] });
    },
  });
}
