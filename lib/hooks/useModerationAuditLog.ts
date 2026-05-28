"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type AuditEntry = {
  id: string;
  actor_id: string | null;
  action: string;
  target_kind: string | null;
  target_id: string | null;
  meta: Record<string, any> | null;
  at: string;
  actor?: { id: string; alias: string | null; avatar_url: string | null } | null;
};

/** Read the most recent N rows from public.audit_log (RLS-gated to moderators). */
export function useModerationAuditLog(limit = 30) {
  return useQuery({
    queryKey: ["moderation_audit", limit],
    queryFn: async (): Promise<AuditEntry[]> => {
      const supa = getSupabaseBrowser();
      if (!supa) return [];

      const { data, error } = await (supa as any)
        .from("audit_log")
        .select("*")
        .order("at", { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message ?? "Could not load audit log.");
      if (!data || data.length === 0) return [];

      const actorIds = Array.from(new Set(data.map((r: any) => r.actor_id).filter(Boolean)));
      let profMap = new Map<string, any>();
      if (actorIds.length > 0) {
        const { data: profs } = await (supa as any)
          .from("profiles")
          .select("id, alias, avatar_url")
          .in("id", actorIds);
        profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
      }

      return data.map((r: any) => ({
        ...r,
        actor: r.actor_id ? profMap.get(r.actor_id) ?? null : null,
      }));
    },
    refetchInterval: 30_000,
  });
}
