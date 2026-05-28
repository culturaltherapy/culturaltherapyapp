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

      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Sign in to file a report.");

      const { data, error } = await (supa as any)
        .from("mod_reports")
        .insert({
          reporter_id:  session.user.id,
          target_kind:  input.targetKind,
          target_table: input.targetTable,
          target_id:    input.targetId,
          reason:       input.reason,
          severity:     input.severity,
          notes:        input.notes ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["moderation_queue"] });
    },
  });
}
