"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type PrivateProfile = {
  user_id: string;
  real_name: string | null;
  created_at: string;
  updated_at: string;
};

/** Fetches the signed-in user's private profile row (real_name etc).
 *  RLS only ever returns the caller's own row. */
export function useMyPrivateProfile() {
  return useQuery({
    queryKey: ["profiles_private", "mine"],
    queryFn: async (): Promise<PrivateProfile | null> => {
      const supa = getSupabaseBrowser();
      if (!supa) return null;
      const { data: { session } } = await supa.auth.getSession();
      if (!session) return null;

      const { data, error } = await (supa as any)
        .from("profiles_private")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("useMyPrivateProfile error:", error.message);
        return null;
      }
      return data as PrivateProfile | null;
    },
  });
}

export function useUpdatePrivateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<PrivateProfile, "real_name">>) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { error } = await (supa as any)
        .from("profiles_private")
        .upsert(
          { user_id: session.user.id, ...patch },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles_private", "mine"] });
    },
  });
}
