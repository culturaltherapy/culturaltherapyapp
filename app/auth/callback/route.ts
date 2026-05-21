import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

// Handles OAuth redirects (Google, Apple) and magic-link sign-ins.
// Supabase redirects here with ?code=... after the provider flow.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  if (code) {
    const supabase = await getSupabaseServer();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.session) {
        // Check if user has completed onboarding (explicit timestamp).
        // If not, send them to /onboarding regardless of what `next` says.
        const { data: profile } = await (supabase as any)
          .from("profiles")
          .select("onboarding_completed_at")
          .eq("id", data.session.user.id)
          .maybeSingle();

        const onboardingDone = profile?.onboarding_completed_at != null;
        const destination = onboardingDone ? next : "/onboarding";
        return NextResponse.redirect(`${origin}${destination}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth_failed`);
}
