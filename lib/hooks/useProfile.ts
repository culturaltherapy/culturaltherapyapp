"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

export function useProfile(id: string) {
  return useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return null;
      const { data } = await supa.from("profiles").select("*").eq("id", id).single();
      return data as Profile | null;
    },
    enabled: !!id
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Profile> }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data, error } = await supa
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["profile", data.id] });
    }
  });
}
