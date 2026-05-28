"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/** Matches the public.target_kind enum from migration 001. */
export type ReportTargetKind = "profile" | "post" | "comment" | "message" | "thread";
export type ReportReason = "safety" | "abuse" | "spam" | "crisis" | "other";
export type ReportSeverity = "normal" | "high" | "crisis";

type FileReportInput = {
  targetKind: ReportTargetKind;
  /** Precise table name in `public.*` so moderators know what to act on. */
  targetTable: string;
  targetId: string;
  reason: ReportReason;
  severity: ReportSeverity;
  notes?: string | null;
};

/**
 * Insert a new row in `public.mod_reports`. The DB trigger fans out an
 * in-app notification to every moderator and queues an email for
 * crisis-severity reports.
 */
export function useFileReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: FileReportInput) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");

      // Use the SECURITY DEFINER RPC so reporter_id is set server-side
      // from auth.uid() — sidesteps any client-side header edge cases that
      // could otherwise make the INSERT RLS reject the row.
      const { data, error } = await (supa as any).rpc("file_mod_report", {
        p_target_kind:  input.targetKind,
        p_target_table: input.targetTable,
        p_target_id:    input.targetId,
        p_reason:       input.reason,
        p_severity:     input.severity,
        p_notes:        input.notes ?? null,
      });

      if (error) throw error;
      return { id: data };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["moderation_queue"] });
    },
  });
}
