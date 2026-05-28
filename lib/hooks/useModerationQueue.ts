"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type {
  ReportReason,
  ReportSeverity,
  ReportTargetKind,
} from "./useReports";

export type ReportStatus = "open" | "triaged" | "actioned" | "dismissed";

export type ModReport = {
  id: string;
  reporter_id: string;
  target_kind: ReportTargetKind;
  target_table: string | null;
  target_id: string;
  reason: ReportReason;
  severity: ReportSeverity;
  status: ReportStatus;
  notes: string | null;
  created_at: string;
  reporter?: { id: string; alias: string | null; avatar_url: string | null } | null;
};

/**
 * Live moderation queue. Reads `mod_reports` (moderator-only RLS) and
 * hydrates reporter alias + avatar. Subscribes to realtime so new reports
 * appear without a manual refetch.
 */
export function useModerationQueue() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["moderation_queue"],
    queryFn: async (): Promise<ModReport[]> => {
      const supa = getSupabaseBrowser();
      if (!supa) return [];

      const { data, error } = await (supa as any)
        .from("mod_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // RLS will reject non-moderators — surface so the dashboard can
        // show the access-denied stub gracefully.
        throw new Error(error.message ?? "Could not load reports.");
      }
      if (!data || data.length === 0) return [];

      const reporterIds = Array.from(new Set(data.map((r: any) => r.reporter_id).filter(Boolean)));
      let profMap = new Map<string, any>();
      if (reporterIds.length > 0) {
        const { data: profs } = await (supa as any)
          .from("profiles")
          .select("id, alias, avatar_url")
          .in("id", reporterIds);
        profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
      }

      return data.map((r: any) => ({
        ...r,
        reporter: profMap.get(r.reporter_id) ?? null,
      }));
    },
    // 30 s polling as a fallback if realtime is disabled
    refetchInterval: 30_000,
  });

  // Realtime: re-fetch on INSERT or UPDATE
  React.useEffect(() => {
    const supa = getSupabaseBrowser();
    if (!supa) return;
    const channel = (supa as any)
      .channel("moderation_queue_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "mod_reports" }, () => {
        qc.invalidateQueries({ queryKey: ["moderation_queue"] });
      })
      .subscribe();
    return () => {
      (supa as any).removeChannel(channel);
    };
  }, [qc]);

  return query;
}

/** Set status (and optional notes) on a report via the RPC. */
export function useSetReportStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reportId,
      status,
      notes,
    }: { reportId: string; status: ReportStatus; notes?: string | null }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { error } = await (supa as any).rpc("mod_set_report_status", {
        p_report_id: reportId,
        p_status:    status,
        p_notes:     notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["moderation_queue"] });
      qc.invalidateQueries({ queryKey: ["moderation_audit"] });
    },
  });
}

/** Hide / restore a content row via the RPC. */
export function useHideContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      table,
      rowId,
      hide,
    }: { table: string; rowId: string; hide: boolean }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { error } = await (supa as any).rpc("mod_hide_content", {
        p_table:  table,
        p_row_id: rowId,
        p_hide:   hide,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["moderation_queue"] });
      qc.invalidateQueries({ queryKey: ["moderation_audit"] });
    },
  });
}
