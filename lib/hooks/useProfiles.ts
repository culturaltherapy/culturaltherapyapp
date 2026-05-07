"use client";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { profiles as mockProfiles } from "@/lib/mock-data";

export function useProfiles(q?: string) {
  return useQuery({
    queryKey: ["profiles", q],
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return mockProfiles;

      let query = supa
        .from("profiles")
        .select("id, alias, avatar_url, city, country, descent, experience_tags, id_verified")
        .limit(50);

      if (q?.trim()) {
        query = query.or(
          `alias.ilike.%${q}%,city.ilike.%${q}%`
        );
      }

      const { data, error } = await query;
      if (error || !data?.length) return mockProfiles;

      // Shape to match MockProfile for the UI
      return data.map((p) => ({
        id: p.id,
        alias: p.alias,
        avatarColor: "var(--ct-rust)",
        city: p.city ?? "",
        country: p.country ?? "",
        distanceKm: 0,
        matchPct: Math.floor(60 + Math.random() * 40),
        descent: p.descent ?? [],
        experienceTags: p.experience_tags ?? [],
        prompt: { question: "What anchors you?", answer: "" },
        idVerified: p.id_verified ?? false,
        src: p.avatar_url
      }));
    },
    staleTime: 30_000
  });
}
