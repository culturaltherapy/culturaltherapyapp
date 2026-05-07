"use client";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { crisisResources as mockResources } from "@/lib/mock-data";

export function useCrisisResources(countryCode: string) {
  return useQuery({
    queryKey: ["crisis_resources", countryCode],
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return mockResources[countryCode as keyof typeof mockResources] ?? [];

      const { data, error } = await supa
        .from("crisis_resources")
        .select("*")
        .eq("country_code", countryCode);

      if (error || !data?.length) {
        return mockResources[countryCode as keyof typeof mockResources] ?? [];
      }
      return data.map((r) => ({
        name: r.name,
        phone: r.phone ?? "",
        url: r.url ?? "#",
        hours: r.hours ?? ""
      }));
    },
    staleTime: 5 * 60_000
  });
}
