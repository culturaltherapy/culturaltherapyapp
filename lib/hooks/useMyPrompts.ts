"use client";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type PromptAnswer = {
  id: string;
  question: string;
  answer: string;
  visibility: string;
};

// Fetches prompt answers for a given user. Pass null to skip the query.
export function useUserPrompts(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["profile_prompts", userId],
    enabled: !!userId,
    queryFn: async (): Promise<PromptAnswer[]> => {
      const supa = getSupabaseBrowser();
      if (!supa || !userId) return [];

      const { data, error } = await (supa as any)
        .from("profile_prompts")
        .select("id, question, answer, visibility")
        .eq("user_id", userId)
        .order("prompt_id", { ascending: true });

      if (error) {
        console.error("useUserPrompts error:", error.message);
        return [];
      }
      return (data ?? []).map((p: any) => ({
        id: p.id,
        question: p.question ?? "Prompt",
        answer: p.answer ?? "",
        visibility: p.visibility ?? "tribe",
      }));
    },
  });
}
