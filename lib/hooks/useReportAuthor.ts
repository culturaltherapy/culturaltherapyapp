"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Author = { id: string; alias: string | null; avatar_url: string | null } | null;

/**
 * Given a (target_table, target_id) pair from mod_reports, figure out who
 * authored / owns the reported row so a moderator can call them.
 * Returns null when there isn't a clear single author (e.g. DM threads).
 */
export function useReportAuthor(
  targetTable: string | null,
  targetId: string | null,
) {
  return useQuery({
    queryKey: ["report_author", targetTable, targetId],
    enabled: !!targetTable && !!targetId,
    staleTime: 30_000,
    queryFn: async (): Promise<Author> => {
      const supa = getSupabaseBrowser();
      if (!supa || !targetTable || !targetId) return null;

      const authorIdField = (() => {
        switch (targetTable) {
          case "profiles":          return "id";          // the row IS the author
          case "posts":             return "owner_id";
          case "post_comments":     return "author_id";
          case "profile_prompts":   return "user_id";
          case "prompt_comments":   return "author_id";
          case "profile_media":     return "owner_id";
          case "media_comments":    return "author_id";
          case "discussion_posts":  return "author_id";
          default:                  return null;          // no single author
        }
      })();

      if (!authorIdField) return null;

      const { data: row } = await (supa as any)
        .from(targetTable)
        .select(authorIdField)
        .eq("id", targetId)
        .maybeSingle();

      const authorId = row?.[authorIdField] as string | undefined;
      if (!authorId) return null;

      const { data: prof } = await (supa as any)
        .from("profiles")
        .select("id, alias, avatar_url")
        .eq("id", authorId)
        .maybeSingle();

      return prof ?? null;
    },
  });
}
