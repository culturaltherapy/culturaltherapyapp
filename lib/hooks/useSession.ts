"use client";
import * as React from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

type SessionState = {
  userId: string | null;
  profile: Profile | null;
  loading: boolean;
};

export function useSession(): SessionState {
  const [state, setState] = React.useState<SessionState>({
    userId: null,
    profile: null,
    loading: true
  });

  React.useEffect(() => {
    const supa = getSupabaseBrowser();
    if (!supa) {
      setState({ userId: null, profile: null, loading: false });
      return;
    }

    async function load() {
      if (!supa) return;
      const { data: { session } } = await supa.auth.getSession();
      if (!session) {
        setState({ userId: null, profile: null, loading: false });
        return;
      }
      const { data: profile } = await supa
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setState({ userId: session.user.id, profile: profile ?? null, loading: false });
    }

    load();

    const { data: { subscription } } = supa.auth.onAuthStateChange(() => {
      load();
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
