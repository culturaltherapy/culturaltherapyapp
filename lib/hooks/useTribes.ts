"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { tribes as mockTribes } from "@/lib/mock-data";

export function useMyTribes() {
  return useQuery({
    queryKey: ["tribes", "mine"],
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return mockTribes; // dev fallback only

      const { data: { session } } = await supa.auth.getSession();
      if (!session) return [];

      const { data, error } = await supa
        .from("tribe_members")
        .select("tribe_id, role, tribes(id, name, blurb, color, motif, owner_id)")
        .eq("user_id", session.user.id);

      if (error) {
        console.error("useMyTribes error:", error.message);
        return [];
      }
      if (!data) return [];
      return data.map((m: any) => m.tribes).filter(Boolean);
    }
  });
}

export function useTribe(id: string) {
  return useQuery({
    queryKey: ["tribe", id],
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return mockTribes.find((t) => t.id === id) ?? mockTribes[0];

      const { data } = await supa
        .from("tribes")
        .select("*, tribe_members(user_id, role, profiles(id, alias, avatar_url))")
        .eq("id", id)
        .single();

      return data ?? mockTribes[0];
    },
    enabled: !!id
  });
}

export function useVillageThreads(tribeId: string) {
  return useQuery({
    queryKey: ["village_threads", tribeId],
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return [];

      const { data } = await supa
        .from("village_threads")
        .select("*, profiles(alias, avatar_url)")
        .eq("tribe_id", tribeId)
        .order("created_at", { ascending: false })
        .limit(20);

      return data ?? [];
    },
    enabled: !!tribeId
  });
}

export function usePostThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tribeId, title, body }: { tribeId: string; title: string; body: string }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { data, error } = await supa.from("village_threads").insert({
        tribe_id: tribeId,
        author_id: session.user.id,
        title,
        body
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { tribeId }) => {
      qc.invalidateQueries({ queryKey: ["village_threads", tribeId] });
    }
  });
}
