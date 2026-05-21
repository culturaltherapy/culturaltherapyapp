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
        // Check if user has completed onboarding (profile.alias set).
        // If not, send them to /onboarding regardless of what `next` says.
        const { data: profile } = await (supabase as any)
          .from("profiles")
          .select("alias")
          .eq("id", data.session.user.id)
          .maybeSingle();

        const alias = profile?.alias;
        const aliasIsSet =
          alias != null && String(alias).trim().length > 0;

        const destination = aliasIsSet ? next : "/onboarding";
        return NextResponse.redirect(`${origin}${destination}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth_failed`);
}
