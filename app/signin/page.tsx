"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Sankofa } from "@/components/motifs/Motifs";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "magic" | "reset";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  // Show banner if user completed onboarding before confirming email
  const hasPendingProfile = typeof window !== "undefined" && !!localStorage.getItem("ct_pending_profile");

  const heading: Record<Mode, string> = {
    signin: "Welcome back.",
    signup: "Make a space here.",
    magic: "Email me a sign-in link.",
    reset: "Reset your password."
  };

  const sub: Record<Mode, string> = {
    signin: "Pick up where you left off.",
    signup: "We'll walk you through onboarding next.",
    magic: "We'll send a one-tap link to your inbox.",
    reset: "We'll email you a reset link."
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);

    const supa = getSupabaseBrowser();

    // Demo path when Supabase isn't configured yet — let users explore
    if (!supa) {
      setBusy(false);
      if (mode === "signup") {
        router.push("/onboarding");
      } else {
        router.push("/home");
      }
      return;
    }

    try {
      if (mode === "signin") {
        const { error } = await supa.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/home");
      } else if (mode === "signup") {
        const { data, error } = await supa.auth.signUp({ email, password });
        if (error) throw error;
        // If session is null, Supabase requires email confirmation first
        if (!data.session) {
          setMsg("Check your inbox — confirm your email, then sign in.");
          setBusy(false);
          return;
        }
        router.push("/onboarding");
      } else if (mode === "magic") {
        const { error } = await supa.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/home` }
        });
        if (error) throw error;
        setMsg("Check your inbox — link sent.");
      } else if (mode === "reset") {
        const { error } = await supa.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/signin`
        });
        if (error) throw error;
        setMsg("Reset link sent. Check your inbox.");
      }
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "apple") {
    const supa = getSupabaseBrowser();
    if (!supa) {
      // Demo path
      router.push("/home");
      return;
    }
    await supa.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/home` }
    });
  }

  return (
    <div className="min-h-dvh bg-parchment text-ink flex flex-col">
      <header className="border-b border-line">
        <div className="mx-auto max-w-shell px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo size={26} />
          </Link>
          <Link href="/" className="text-sm text-ink3 hover:text-ink">
            Back home
          </Link>
        </div>
      </header>

      <main className="flex-1 grid lg:grid-cols-2">
        {/* Left — form */}
        <section className="relative px-6 py-10 sm:py-16 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <p className="eyebrow">B.L.E.S.S</p>
            <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-tight">
              {heading[mode]}
            </h1>
            <p className="text-ink2 mt-2">{sub[mode]}</p>

            {hasPendingProfile && (
              <div className="mt-4 rounded-md bg-forest/10 border border-forest/20 px-4 py-3 text-sm text-forest">
                Your onboarding answers are saved. Sign in to apply them to your profile.
              </div>
            )}

            {/* OAuth */}
            {(mode === "signin" || mode === "signup") && (
              <div className="mt-7 space-y-2.5">
                <button
                  onClick={() => oauth("google")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-line bg-bone px-4 py-2.5 text-[15px] font-medium hover:bg-ink/5"
                >
                  <GoogleIcon /> Continue with Google
                </button>
                <button
                  onClick={() => oauth("apple")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-ink text-bone px-4 py-2.5 text-[15px] font-medium hover:bg-ink2"
                >
                  <AppleIcon /> Continue with Apple
                </button>
                <div className="my-4 flex items-center gap-3 text-xs text-ink3">
                  <span className="h-px bg-line flex-1" />
                  or with email
                  <span className="h-px bg-line flex-1" />
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Email" required>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                />
              </Field>

              {(mode === "signin" || mode === "signup") && (
                <Field label="Password" required hint={mode === "signin" ? undefined : "8+ characters"}>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    minLength={8}
                    placeholder="••••••••"
                  />
                </Field>
              )}

              {err && (
                <p className="text-sm text-crisis bg-crisis/5 border border-crisis/30 rounded-md px-3 py-2">
                  {err}
                </p>
              )}
              {msg && (
                <p className="text-sm text-forest bg-forest/5 border border-forest/30 rounded-md px-3 py-2">
                  {msg}
                </p>
              )}

              <Button type="submit" full size="lg" disabled={busy}>
                {busy
                  ? "Working…"
                  : mode === "signin"
                  ? "Sign in"
                  : mode === "signup"
                  ? "Create account"
                  : mode === "magic"
                  ? "Send magic link"
                  : "Send reset link"}
              </Button>
            </form>

            {/* Mode switcher */}
            <div className="mt-6 space-y-2 text-sm">
              {mode === "signin" && (
                <>
                  <button
                    onClick={() => setMode("magic")}
                    className="text-terracotta hover:underline"
                  >
                    Email me a magic link instead
                  </button>
                  <div className="text-ink3">
                    No account yet?{" "}
                    <button
                      onClick={() => setMode("signup")}
                      className="text-ink underline-offset-2 hover:underline"
                    >
                      Create one
                    </button>
                  </div>
                  <div className="text-ink3">
                    Forgot password?{" "}
                    <button
                      onClick={() => setMode("reset")}
                      className="text-ink underline-offset-2 hover:underline"
                    >
                      Reset it
                    </button>
                  </div>
                </>
              )}
              {mode === "signup" && (
                <div className="text-ink3">
                  Already a member?{" "}
                  <button
                    onClick={() => setMode("signin")}
                    className="text-ink underline-offset-2 hover:underline"
                  >
                    Sign in
                  </button>
                </div>
              )}
              {(mode === "magic" || mode === "reset") && (
                <button
                  onClick={() => setMode("signin")}
                  className="text-terracotta hover:underline"
                >
                  ← Back to sign-in
                </button>
              )}
            </div>

            <p className="mt-8 text-xs text-ink3 leading-relaxed">
              By continuing you agree to our{" "}
              <a href="#" className="underline">Code of Conduct</a>,{" "}
              <a href="#" className="underline">Terms</a> and{" "}
              <a href="#" className="underline">Privacy Policy</a>. ID
              verification is required before posting publicly — we'll set
              that up during onboarding.
            </p>
          </div>
        </section>

        {/* Right — hero panel (desktop only) */}
        <aside className="relative hidden lg:flex bg-ink text-bone p-12 overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-20 text-terracotta">
            <Sankofa size={520} />
          </div>
          <div className="relative z-10 flex flex-col justify-end">
            <p className="eyebrow text-bone/70">A note from us</p>
            <p className="font-display text-3xl mt-3 max-w-md leading-tight">
              "We were missing each other for a long time. This is the room we
              built so we'd stop missing each other."
            </p>
            <p className="mt-4 text-bone/70 text-sm">
              — The Cultural Therapy founding circle
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5Z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7Z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.5 35 26.9 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.4 39.6 16.2 44 24 44Z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4 5.6l6.2 5.2C41.6 36 44 30.5 44 24c0-1.3-.1-2.4-.4-3.5Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.4 12.3a4.5 4.5 0 0 1 2.2-3.8 4.7 4.7 0 0 0-3.7-2c-1.6-.2-3 .9-3.8.9-.8 0-2-.9-3.4-.8a4.9 4.9 0 0 0-4.1 2.5C2 12.4 3.3 17.6 5 20.4c.8 1.4 1.8 3 3.1 3 1.3 0 1.8-.8 3.4-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.4 3.1-2.8.6-1 1.1-2.1 1.4-3.2-.2-.1-2.7-1-3-3.1ZM14 5.6c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5Z" />
    </svg>
  );
}
