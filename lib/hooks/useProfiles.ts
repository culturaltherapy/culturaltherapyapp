"use client";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { profiles as mockProfiles } from "@/lib/mock-data";

// Returns real profiles from Supabase, excluding the current signed-in user.
// Only falls back to mock data when Supabase isn't configured (local dev).
export function useProfiles(q?: string) {
  return useQuery({
    queryKey: ["profiles", q],
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return mockProfiles; // dev fallback only

      // Find current user so we don't show them their own card
      const { data: { session } } = await supa.auth.getSession();
      const currentUserId = session?.user?.id;

      let query = supa
        .from("profiles")
        .select("id, alias, avatar_url, city, country, descent, experience_tags, id_verified")
        // Only return profiles that have completed onboarding AND have an alias
        // AND aren't deactivated. Partial / abandoned onboardings stay hidden
        // from the network until the user finishes.
        .not("alias", "is", null)
        .not("onboarding_completed_at", "is", null)
        .is("deactivated_at", null)
        .limit(50);

      if (currentUserId) {
        query = query.neq("id", currentUserId);
      }

      if (q?.trim()) {
        query = query.or(`alias.ilike.%${q}%,city.ilike.%${q}%,country.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error("useProfiles error:", error.message);
        return [];
      }
      if (!data) return [];

      // Shape to match MockProfile for the UI
      return data.map((p: any) => ({
        id: p.id,
        alias: p.alias ?? "Member",
        avatarColor: "var(--ct-rust)",
        city: p.city ?? "",
        country: p.country ?? "",
        distanceKm: 0,
        matchPct: Math.floor(60 + Math.random() * 40), // TODO: real matching algorithm
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
