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
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth_failed`);
}
