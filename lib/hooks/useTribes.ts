"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { tribes as mockTribes } from "@/lib/mock-data";

// ─────────────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────────────

export function useMyTribes() {
  return useQuery({
    queryKey: ["tribes", "mine"],
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return mockTribes;

      const { data: { session } } = await supa.auth.getSession();
      if (!session) return [];

      const { data, error } = await (supa as any)
        .from("tribe_members")
        .select("tribe_id, role, tribes(id, name, blurb, color, motif, owner_id)")
        .eq("user_id", session.user.id);

      if (error) {
        console.error("useMyTribes error:", error.message);
        return [];
      }
      return (data ?? []).map((m: any) => m.tribes).filter(Boolean);
    }
  });
}

export function useTribe(id: string) {
  return useQuery({
    queryKey: ["tribe", id],
    enabled: !!id,
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return mockTribes.find((t) => t.id === id) ?? mockTribes[0];

      // 1. Fetch the tribe itself. Use maybeSingle so 0 rows returns null
      //    instead of erroring (which single() does).
      const { data: tribe, error } = await (supa as any)
        .from("tribes")
        .select("id, name, blurb, color, motif, owner_id, created_at")
        .eq("id", id)
        .maybeSingle();

      if (error) console.error("useTribe error:", error.message);
      if (!tribe) return null;

      // 2. Fetch members separately so RLS on tribe_members doesn't break
      //    the parent tribe load. Non-members will see empty here.
      const { data: members } = await (supa as any)
        .from("tribe_members")
        .select("user_id, role")
        .eq("tribe_id", id);

      const memberIds: string[] = (members ?? []).map((m: any) => m.user_id);

      // 3. Look up profiles for any member ids we can see.
      let profiles: any[] = [];
      if (memberIds.length > 0) {
        const { data: profs } = await (supa as any)
          .from("profiles")
          .select("id, alias, avatar_url, avatar_color")
          .in("id", memberIds);
        profiles = profs ?? [];
      }

      const profileMap = new Map(profiles.map((p: any) => [p.id, p]));
      const tribe_members = (members ?? []).map((m: any) => ({
        user_id: m.user_id,
        role: m.role,
        profiles: profileMap.get(m.user_id) ?? null,
      }));

      return { ...tribe, tribe_members };
    }
  });
}

export function useVillageThreads(tribeId: string) {
  return useQuery({
    queryKey: ["village_threads", tribeId],
    enabled: !!tribeId,
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return [];

      const { data } = await (supa as any)
        .from("village_threads")
        .select("*, profiles(alias, avatar_url)")
        .eq("tribe_id", tribeId)
        .order("created_at", { ascending: false })
        .limit(50);

      return data ?? [];
    }
  });
}

/** Public-ish list of tribes the user is not in — for the "Discover" section. */
export function useDiscoverTribes() {
  return useQuery({
    queryKey: ["tribes", "discover"],
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return [];

      const { data: { session } } = await supa.auth.getSession();
      if (!session) return [];

      // Get tribes user is already in
      const { data: myMemberships } = await (supa as any)
        .from("tribe_members")
        .select("tribe_id")
        .eq("user_id", session.user.id);

      const myTribeIds: string[] = (myMemberships ?? []).map((m: any) => m.tribe_id);

      // All tribes I'm not already in
      let q = (supa as any).from("tribes").select("*").limit(30);
      if (myTribeIds.length > 0) {
        q = q.not("id", "in", `(${myTribeIds.join(",")})`);
      }
      const { data, error } = await q;
      if (error) {
        console.error("useDiscoverTribes error:", error.message);
        return [];
      }
      return data ?? [];
    }
  });
}

/** Pending tribe_requests visible to the current user (theirs + ones for tribes they own). */
export function usePendingTribeRequests() {
  return useQuery({
    queryKey: ["tribe_requests", "pending"],
    queryFn: async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return [];

      const { data: { session } } = await supa.auth.getSession();
      if (!session) return [];

      const { data, error } = await (supa as any)
        .from("tribe_requests")
        .select(`
          id, tribe_id, user_id, initiated_by, message, status, created_at,
          tribes(id, name, blurb, color, motif, owner_id),
          requester:profiles!tribe_requests_user_id_fkey(id, alias, avatar_url, avatar_color, city, country)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("usePendingTribeRequests error:", error.message);
        return [];
      }
      // Filter client-side to be defensive (RLS does this server-side too)
      return (data ?? []).filter((r: any) =>
        r.user_id === session.user.id ||
        r.initiated_by === session.user.id ||
        r.tribes?.owner_id === session.user.id
      );
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Writes
// ─────────────────────────────────────────────────────────────────────────────

export function useCreateTribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, blurb, color, motif }: {
      name: string; blurb?: string; color?: string; motif?: string;
    }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data, error } = await (supa as any).rpc("create_tribe", {
        p_name: name,
        p_blurb: blurb ?? null,
        p_color: color ?? "#2f4a32",
        p_motif: motif ?? "Ubuntu",
      });
      if (error) throw error;
      return data as string; // new tribe id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tribes", "mine"] });
      qc.invalidateQueries({ queryKey: ["tribes", "discover"] });
    }
  });
}

export function usePostThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tribeId, title, body }: {
      tribeId: string; title: string; body: string;
    }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { data, error } = await (supa as any).from("village_threads").insert({
        tribe_id: tribeId,
        author_id: session.user.id,
        title,
        body,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { tribeId }) => {
      qc.invalidateQueries({ queryKey: ["village_threads", tribeId] });
    }
  });
}

/** Send a join-request OR invitation. If targetUserId is omitted, it's a self-join. */
export function useSendTribeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tribeId, targetUserId, message }: {
      tribeId: string;
      targetUserId?: string;
      message?: string;
    }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const payload = {
        tribe_id: tribeId,
        user_id: targetUserId ?? session.user.id,
        initiated_by: session.user.id,
        message: message?.trim() || null,
      };
      const { data, error } = await (supa as any)
        .from("tribe_requests")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tribe_requests", "pending"] });
      qc.invalidateQueries({ queryKey: ["tribes", "discover"] });
    }
  });
}

export function useAcceptTribeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { error } = await (supa as any).rpc("accept_tribe_request", {
        p_request_id: requestId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tribe_requests", "pending"] });
      qc.invalidateQueries({ queryKey: ["tribes", "mine"] });
    }
  });
}

export function useDeclineTribeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { error } = await (supa as any).rpc("decline_tribe_request", {
        p_request_id: requestId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tribe_requests", "pending"] });
    }
  });
}
