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

      // Flush any pending onboarding data saved before email confirmation
      const pending = localStorage.getItem("ct_pending_profile");
      if (pending) {
        try {
          const s = JSON.parse(pending);
          await supa.from("profiles").upsert({
            id: session.user.id,
            alias: s.alias?.trim() || null,
            pronouns: s.pronouns || null,
            descent: s.descent,
            languages: s.languages,
            country: s.country,
            city: s.shareCity ? s.city || null : null,
            experience_tags: s.experienceTags,
            diagnosis: s.diagnosis || null,
            diagnosis_visibility: s.diagnosisVisible ? "tribe" : "private",
            id_verified: true,
            accepts_tribe_requests: true,
            accepts_dms: true
          }, { onConflict: "id" });
          localStorage.removeItem("ct_pending_profile");
        } catch (_) {}
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
