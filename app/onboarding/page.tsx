"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Select } from "@/components/ui/Field";
import { Chip } from "@/components/ui/Chip";
import { Sankofa, Ubuntu, Pyramid, EyeOfHorus, Dwennimmen, Funtunfunefu } from "@/components/motifs/Motifs";
import { Icon } from "@/components/ui/Icon";
import {
  codeOfConduct,
  experienceTagPool,
  promptLibrary,
  HERITAGE_OPTIONS,
  CITIES_BY_COUNTRY,
} from "@/lib/mock-data";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { LanguagePicker } from "@/components/ui/LanguagePicker";
import { TagPicker } from "@/components/ui/TagPicker";
import { MediaUploader } from "@/components/media/MediaUploader";
import { MediaGallery } from "@/components/media/MediaGallery";
import { useProfileMedia } from "@/lib/hooks/useProfileMedia";
import { useSession } from "@/lib/hooks/useSession";
import {
  validateMeaningful,
  validateShortLabel,
  getPromptValidationRule,
} from "@/lib/validation";

type State = {
  realName: string;
  alias: string;              // public username
  pronouns: string;
  birthYear: string;          // kept as string for the input; parsed on save
  bio: string;
  descent: string[];
  languages: string[];
  languagesUnderstood: string[];
  country: string;
  city: string;
  shareCity: boolean;
  experienceTags: string[];
  diagnosis: string;
  diagnosisVisible: boolean;
  prompts: { question: string; answer: string }[];
  avatar: string | null;
  idStatus: "idle" | "verifying" | "verified";
  cocVisited: Record<string, boolean>;
  cocAccepted: boolean;
};

// Step map:
// 0  Create account (email/password or Google — skipped if already signed in)
// 1  Welcome
// 2  Identity (alias / pronouns)
// 3  Roots (descent / languages)
// 4  Location
// 5  Experience tags
// 6  Diagnosis (optional)
// 7  Prompts
// 8  Avatar
// 9  ID Verification (simulated placeholder — real vendor wired later)
// 10 Code of Conduct
// 11 Done
// Step 11 (the celebration "you're in" screen) was removed — finish now
// routes users straight to /profile so they see what others see.
const TOTAL = 10;

export default function Onboarding() {
  const router = useRouter();
  // Step 0 = account creation gate; 1–11 = profile steps
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [saveErr, setSaveErr] = React.useState<string | null>(null);
  // Detected session email for step 0 "already signed in" variant
  const [sessionEmail, setSessionEmail] = React.useState<string | null>(null);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [s, setS] = React.useState<State>({
    realName: "",
    alias: "",
    pronouns: "",
    birthYear: "",
    bio: "",
    descent: [],
    languages: [],
    languagesUnderstood: [],
    country: "GB",
    city: "",
    shareCity: true,
    experienceTags: [],
    diagnosis: "",
    diagnosisVisible: false,
    prompts: [],
    avatar: null,
    idStatus: "idle",
    cocVisited: {},
    cocAccepted: false,
  });

  function patch(p: Partial<State>) {
    setS((prev) => ({ ...prev, ...p }));
  }

  // ─────────────────────────────────────────────────────────────
  // Restore from localStorage on mount so back-button / accidental
  // refresh doesn't lose what the user already entered
  // ─────────────────────────────────────────────────────────────
  const STORAGE_KEY = "ct_onboarding_state_v1";
  const STEP_KEY = "ct_onboarding_step_v1";
  const restoredRef = React.useRef(false);

  React.useEffect(() => {
    if (restoredRef.current) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setS((prev) => ({ ...prev, ...saved }));
      }
      const savedStep = localStorage.getItem(STEP_KEY);
      if (savedStep) {
        const n = parseInt(savedStep, 10);
        if (Number.isFinite(n) && n >= 1 && n <= 10) setStep(n);
      }
    } catch {}
    restoredRef.current = true;
  }, []);

  // Save state to localStorage on every change after restore
  React.useEffect(() => {
    if (!restoredRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {}
  }, [s]);

  // Save step too
  React.useEffect(() => {
    if (!restoredRef.current) return;
    try { localStorage.setItem(STEP_KEY, String(step)); } catch {}
  }, [step]);

  // Check auth state — always show step 0, but adapt its content
  React.useEffect(() => {
    const supa = getSupabaseBrowser();
    if (!supa) { setAuthChecked(true); return; }
    supa.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setSessionEmail(session.user.email);
      setAuthChecked(true);
    });
  }, []);

  function next() { setStep((n) => Math.min(TOTAL, n + 1)); }
  function prev() { setStep((n) => Math.max(1, n - 1)); }

  const canContinue = React.useMemo(() => {
    switch (step) {
      case 0:  return false; // step 0 navigates itself on auth success
      case 1:  return true;
      case 2:  return (
        validateShortLabel(s.realName, { min: 2, max: 80, label: "Real name" }).ok
        && validateShortLabel(s.alias, { min: 2, max: 24, label: "Username" }).ok
      );
      case 3:  return s.descent.length > 0;
      case 4:  {
        if (s.country.length < 2) return false;
        // If a city is set, it must match the country list (or country is 'Other')
        if (!s.city) return true;
        if (s.country === "OT") return true;
        const cities = CITIES_BY_COUNTRY[s.country] ?? [];
        if (cities.length === 0) return true; // no curated list — allow anything
        return cities.includes(s.city);
      }
      case 5:  return s.experienceTags.length >= 1;
      case 6:  return true;
      case 7:  return s.prompts.filter((p) => {
        const rule = getPromptValidationRule(p.question, promptLibrary);
        return validateMeaningful(p.answer, rule).ok;
      }).length >= 2;
      case 8:  return true;
      case 9:  return s.idStatus === "verified";
      case 10: return s.cocAccepted;
      default: return false;
    }
  }, [step, s]);

  async function finish() {
    setSaving(true);
    setSaveErr(null);
    try {
      const supa = getSupabaseBrowser();
      if (supa) {
        const { data: { session } } = await supa.auth.getSession();
        if (session) {
          // ── Upload avatar to Storage if one was chosen ────────────────────
          let avatarUrl: string | null = null;
          if (s.avatar && s.avatar.startsWith("data:")) {
            try {
              const blob = dataURLToBlob(s.avatar);
              const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
              const path = `${session.user.id}/avatar.${ext}`;
              const { error: uploadError } = await supa.storage
                .from("avatars")
                .upload(path, blob, { upsert: true, contentType: blob.type });
              if (uploadError) {
                console.error("Avatar upload error:", uploadError.message);
              } else {
                const { data } = supa.storage.from("avatars").getPublicUrl(path);
                // Add a cache-buster so the new image shows immediately
                avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
              }
            } catch (e: any) {
              console.error("Avatar conversion failed:", e?.message);
            }
          }

          // Parse birth year — empty / invalid → null
          const parsedBirthYear = (() => {
            const n = parseInt(s.birthYear, 10);
            return Number.isFinite(n) && n >= 1900 && n <= new Date().getFullYear()
              ? n
              : null;
          })();

          // ── Upsert profile (creates row if trigger didn't) ────────────────
          const bioTrimmed = s.bio.trim();
          const bioValidation = bioTrimmed.length === 0
            ? { ok: true as const }
            : validateMeaningful(bioTrimmed, { minChars: 30, minWords: 8 });

          // Save real_name to the restricted profiles_private table
          if (s.realName.trim().length > 0) {
            await (supa as any).from("profiles_private").upsert(
              { user_id: session.user.id, real_name: s.realName.trim() },
              { onConflict: "user_id" }
            );
          }

          const { error: profileError } = await supa.from("profiles").upsert({
            id: session.user.id,
            alias: s.alias.trim(),
            avatar_url: avatarUrl,
            pronouns: s.pronouns || null,
            bio: bioValidation.ok && bioTrimmed.length > 0 ? bioTrimmed : null,
            birth_year: parsedBirthYear,
            descent: s.descent,
            languages: s.languages,
            languages_understood: s.languagesUnderstood,
            country: s.country,
            city: s.shareCity ? s.city || null : null,
            experience_tags: s.experienceTags,
            diagnosis: s.diagnosis || null,
            diagnosis_visibility: s.diagnosisVisible ? "tribe" : "private",
            id_verified: true,       // auto-verified at onboarding completion
            accepts_tribe_requests: true,
            accepts_dms: true,
            onboarding_completed_at: new Date().toISOString(),
          }, { onConflict: "id" });

          if (profileError) {
            console.error("Profile upsert error:", profileError.message);
            setSaveErr(profileError.message);
          }

          // Save prompt answers. First clear any existing onboarding prompts
          // (so re-running onboarding doesn't pile up stale ones), then insert
          // only the ones that pass meaningfulness validation.
          const filledPrompts = s.prompts.filter((p) =>
            validateMeaningful(p.answer, { minChars: 8, minWords: 2 }).ok
          );
          await supa.from("profile_prompts")
            .delete()
            .eq("user_id", session.user.id);
          if (filledPrompts.length > 0) {
            await supa.from("profile_prompts").insert(
              filledPrompts.map((p, i) => ({
                user_id: session.user.id,
                prompt_id: `onboarding_${i}`,
                question: p.question,
                answer: p.answer.trim(),
                visibility: "tribe" as const,
              }))
            );
          }

          setSaving(false);
          // Clear restored state — onboarding is complete
          try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STEP_KEY);
            localStorage.removeItem("ct_pending_profile");
          } catch {}
          router.push("/profile");
          return;
        }
      }

      // No Supabase or no session — stash to localStorage, send to sign-in
      localStorage.setItem("ct_pending_profile", JSON.stringify(s));
      setSaving(false);
      // If not signed in, send them to sign in so they can complete the save
      router.push("/signin?next=/home&reason=onboarding");
    } catch (e: any) {
      console.error("Onboarding finish error:", e?.message);
      setSaveErr(e?.message ?? "Something went wrong. You can edit your profile later.");
      setSaving(false);
      // Still navigate — don't trap the user
      router.push("/profile");
    }
  }

  return (
    <div className="min-h-dvh bg-parchment text-ink flex flex-col">
      <header className="border-b border-line">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/"><Logo size={26} withWordmark={false} /></Link>
          <div className="text-xs text-ink3 font-mono">
            {step === 0 ? "Create account" : `Step ${step} of ${TOTAL}`}
          </div>
          {step === 0
            ? <Link href="/signin" className="text-sm text-ink3 hover:text-ink">Sign in instead</Link>
            : <div className="w-20" />
          }
        </div>
        <div className="h-1 w-full bg-line">
          <div
            className="h-1 bg-terracotta transition-all duration-300"
            style={{ width: step === 0 ? "0%" : `${(step / TOTAL) * 100}%` }}
          />
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          {step === 0  && (
            authChecked
              ? <StepCreateAccount onSuccess={() => setStep(1)} existingEmail={sessionEmail} />
              : <div className="flex justify-center py-20"><div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" /></div>
          )}
          {step === 1  && <StepWelcome />}
          {step === 2  && <StepIdentity s={s} patch={patch} />}
          {step === 3  && <StepRoots s={s} patch={patch} />}
          {step === 4  && <StepLocation s={s} patch={patch} />}
          {step === 5  && <StepExperience s={s} patch={patch} />}
          {step === 6  && <StepDiagnosis s={s} patch={patch} />}
          {step === 7  && <StepPrompts s={s} patch={patch} />}
          {step === 8  && <StepAvatar s={s} patch={patch} />}
          {step === 9  && <StepID s={s} patch={patch} />}
          {step === 10 && <StepCoC s={s} patch={patch} />}
        </div>
      </main>

      {step > 0 && (
        <footer
          className="border-t border-line bg-parchment/95 sticky bottom-0"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto max-w-2xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <button
              onClick={prev}
              disabled={step === 1}
              className="text-sm text-ink2 disabled:text-ink3 inline-flex items-center gap-1"
            >
              <Icon name="arrowLeft" size={14} /> Back
            </button>
            {step < TOTAL ? (
              <Button onClick={next} disabled={!canContinue} size="md">
                Continue <Icon name="arrow" size={14} />
              </Button>
            ) : (
              <Button onClick={finish} size="md" disabled={saving}>
                {saving ? "Saving…" : "Finish and see my profile"} <Icon name="arrow" size={14} />
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}

// ── Step components ────────────────────────────────────────────────────────────

function StepHeader({ kicker, title, body }: { kicker: string; title: string; body?: string }) {
  return (
    <div className="mb-6">
      <p className="eyebrow">{kicker}</p>
      <h1 className="font-display text-3xl sm:text-4xl mt-2 leading-tight">{title}</h1>
      {body && <p className="text-ink2 mt-2 max-w-prose">{body}</p>}
    </div>
  );
}

function StepCreateAccount({ onSuccess, existingEmail }: { onSuccess: () => void; existingEmail: string | null }) {
  // All hooks must come before any conditional return
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  // Already signed in — show a confirmation rather than a sign-up form
  if (existingEmail) {
    return (
      <div>
        <div className="text-forest mb-4"><Sankofa size={48} /></div>
        <p className="eyebrow">Account ready</p>
        <h1 className="font-display text-3xl sm:text-4xl mt-2 leading-tight">
          You're already signed in.
        </h1>
        <p className="text-ink2 mt-2">
          Signed in as <strong>{existingEmail}</strong>. Ready to set up your profile?
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={onSuccess}>
            Set up my profile →
          </Button>
          <button
            onClick={async () => {
              const supa = getSupabaseBrowser();
              if (supa) await supa.auth.signOut();
              window.location.reload();
            }}
            className="text-sm text-ink3 hover:text-ink underline self-center"
          >
            Sign out and use a different account
          </button>
        </div>
      </div>
    );
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const supa = getSupabaseBrowser();
    if (!supa) { onSuccess(); return; }
    try {
      const { data, error } = await supa.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.session) {
        // Email confirmation required — Supabase is configured with confirmations on
        setMsg("Check your inbox and confirm your email, then come back to continue.");
        setBusy(false);
        return;
      }
      onSuccess();
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const supa = getSupabaseBrowser();
    if (!supa) { onSuccess(); return; }
    // Redirect back to /onboarding after OAuth so the flow continues
    await supa.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`
      }
    });
    // Page will navigate away — no need to setBusy(false)
  }

  return (
    <div>
      <div className="text-terracotta mb-4"><Sankofa size={48} /></div>
      <p className="eyebrow">Join B.L.E.S.S</p>
      <h1 className="font-display text-3xl sm:text-4xl mt-2 leading-tight">
        Create your account first.
      </h1>
      <p className="text-ink2 mt-2">
        Your real name stays private — we use an alias. Takes 30 seconds.
      </p>

      {/* Google */}
      <button
        onClick={handleGoogle}
        disabled={busy}
        className="mt-7 w-full inline-flex items-center justify-center gap-3 rounded-md border border-line bg-bone px-4 py-3 text-[15px] font-medium hover:bg-ink/5 disabled:opacity-50"
      >
        <GoogleIcon /> Continue with Google
      </button>

      <div className="mt-5 flex items-center gap-3 text-xs text-ink3">
        <span className="flex-1 h-px bg-line" />or create with email<span className="flex-1 h-px bg-line" />
      </div>

      {/* Email form */}
      <form onSubmit={handleEmail} className="mt-5 space-y-4">
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Password" hint="At least 8 characters">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a strong password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        {err && <p className="text-sm text-crisis">{err}</p>}
        {msg && <p className="text-sm text-forest bg-forest/10 rounded-md px-3 py-2">{msg}</p>}
        <Button type="submit" size="lg" full disabled={busy}>
          {busy ? "Creating account…" : "Create account & continue →"}
        </Button>
      </form>

      <p className="mt-4 text-xs text-ink3 text-center">
        Already have an account?{" "}
        <Link href="/signin" className="text-terracotta hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

function StepWelcome() {
  return (
    <div>
      <div className="text-terracotta mb-3"><Sankofa size={56} /></div>
      <StepHeader
        kicker="Welcome to B.L.E.S.S"
        title="Take a breath. We'll go step by step."
        body="Onboarding takes about five minutes. Everything you share has a privacy setting — you choose what others see."
      />
      <ul className="mt-6 space-y-2.5 text-ink2 text-[15px]">
        <li className="flex items-start gap-2">
          <Icon name="check" size={18} className="text-forest mt-0.5" />
          Your real name stays private. We use an alias.
        </li>
        <li className="flex items-start gap-2">
          <Icon name="check" size={18} className="text-forest mt-0.5" />
          You choose what your Tribe sees.
        </li>
        <li className="flex items-start gap-2">
          <Icon name="check" size={18} className="text-forest mt-0.5" />
          Crisis support is on every screen.
        </li>
      </ul>
    </div>
  );
}

function StepIdentity({ s, patch }: { s: State; patch: (p: Partial<State>) => void }) {
  const thisYear = new Date().getFullYear();

  const realNameValid = s.realName.trim().length === 0
    ? { ok: true as const }
    : validateShortLabel(s.realName, { min: 2, max: 80, label: "Real name" });

  const usernameValid = s.alias.trim().length === 0
    ? { ok: true as const }
    : validateShortLabel(s.alias, { min: 2, max: 24, label: "Username" });

  const bioValid = s.bio.trim().length === 0
    ? { ok: true as const }
    : validateMeaningful(s.bio, { minChars: 30, minWords: 8, label: "Bio" });

  return (
    <div>
      <StepHeader
        kicker="Step 2 · Identity"
        title="Who are you, really?"
        body="Your real name is for our records only — it's never shown publicly. Your username is what other members see."
      />
      <div className="space-y-5">
        <Field label="Real name" required hint="Private — only Cultural Therapy admins can see this. Used for safeguarding." error={realNameValid.ok ? undefined : realNameValid.reason}>
          <Input
            value={s.realName}
            onChange={(e) => patch({ realName: e.target.value })}
            placeholder="e.g. Gerald Bonsu"
            autoComplete="name"
            maxLength={80}
          />
        </Field>

        <Field label="Username" required hint="Public — 2–24 characters. This is what others will see." error={usernameValid.ok ? undefined : usernameValid.reason}>
          <Input
            value={s.alias}
            onChange={(e) => patch({ alias: e.target.value })}
            placeholder="e.g. yaa.o or Yaa O."
            autoComplete="nickname"
            maxLength={24}
          />
        </Field>

        <Field label="Pronouns (optional)">
          <Input
            value={s.pronouns}
            onChange={(e) => patch({ pronouns: e.target.value })}
            placeholder="she/her, they/them, etc."
          />
        </Field>

        <Field label="Year of birth (optional)" hint="We display age, not date. You can hide this later in profile settings.">
          <Input
            type="number"
            inputMode="numeric"
            value={s.birthYear}
            onChange={(e) => patch({ birthYear: e.target.value.replace(/\D/g, "").slice(0, 4) })}
            placeholder={`e.g. ${thisYear - 28}`}
            min={1900}
            max={thisYear}
          />
        </Field>

        <Field
          label="Short bio (optional)"
          hint="A few sentences about who you are. 30–400 characters."
          error={bioValid.ok ? undefined : bioValid.reason}
        >
          <Textarea
            rows={4}
            value={s.bio}
            onChange={(e) => patch({ bio: e.target.value })}
            placeholder="e.g. Therapist-in-training, second-gen Ghanaian, still figuring out home. Sundays are sacred."
            maxLength={400}
          />
          <div className="mt-1 text-xs text-ink3 text-right">{s.bio.length}/400</div>
        </Field>
      </div>
    </div>
  );
}

function StepRoots({ s, patch }: { s: State; patch: (p: Partial<State>) => void }) {
  return (
    <div>
      <div className="text-forest mb-3"><Ubuntu size={48} /></div>
      <StepHeader
        kicker="Step 3 · Roots"
        title="Where are your people from?"
        body="Pick everything that feels like you — multiple heritages are welcome, and you can type your own if it's not listed."
      />
      <Field label="Heritage / descent" required hint="Add as many as feel right. Mixed heritage is a first-class option here.">
        <TagPicker
          value={s.descent}
          onChange={(v) => patch({ descent: v })}
          options={HERITAGE_OPTIONS}
          placeholder="Type to search — e.g. Ghanaian, Trinidadian, Mixed heritage…"
          itemLabel="Heritage"
        />
      </Field>

      <div className="h-6" />

      <Field label="Languages you speak" hint="The ones you can hold a conversation in.">
        <LanguagePicker
          value={s.languages}
          onChange={(v) => patch({ languages: v })}
          placeholder="Type to search — e.g. Twi, Patois, Arabic…"
        />
      </Field>

      <div className="h-5" />

      <Field label="Languages you understand (but don't speak)" hint="Languages you can follow even if you'd struggle to reply.">
        <LanguagePicker
          value={s.languagesUnderstood}
          onChange={(v) => patch({ languagesUnderstood: v })}
          placeholder="Type to search…"
        />
      </Field>
    </div>
  );
}

function countryLabelFromCode(code: string): string {
  const map: Record<string, string> = {
    GB: "United Kingdom", US: "United States", CA: "Canada",
    NG: "Nigeria", GH: "Ghana", JM: "Jamaica", ZA: "South Africa",
    KE: "Kenya", ZW: "Zimbabwe", OT: "the chosen country",
  };
  return map[code] ?? code;
}

function StepLocation({ s, patch }: { s: State; patch: (p: Partial<State>) => void }) {
  const citiesForCountry = CITIES_BY_COUNTRY[s.country] ?? [];
  const cityIsValid = !s.city
    || citiesForCountry.includes(s.city)
    || s.country === "OT"; // 'Other / prefer not to say' allows free text

  function onCountryChange(newCountry: string) {
    // Reset city if it doesn't belong to the new country (and the new country has a list)
    const validCities = CITIES_BY_COUNTRY[newCountry] ?? [];
    const stillValid = s.city && validCities.includes(s.city);
    patch({
      country: newCountry,
      city: stillValid ? s.city : "",
    });
  }

  return (
    <div>
      <StepHeader
        kicker="Step 4 · Where you are now"
        title="Country, and a city if you want to share."
        body="Country is shown on your card. City is optional — if you live somewhere small, we recommend keeping it private."
      />
      <Field label="Country" required>
        <Select value={s.country} onChange={(e) => onCountryChange(e.target.value)}>
          <option value="GB">United Kingdom</option>
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="NG">Nigeria</option>
          <option value="GH">Ghana</option>
          <option value="JM">Jamaica</option>
          <option value="ZA">South Africa</option>
          <option value="KE">Kenya</option>
          <option value="ZW">Zimbabwe</option>
          <option value="OT">Other / prefer not to say</option>
        </Select>
      </Field>
      <div className="h-5" />
      <Field
        label="City (optional)"
        hint={
          citiesForCountry.length > 0
            ? "Pick from the list — these match your selected country."
            : "Type your city."
        }
        error={!cityIsValid ? `That city doesn't appear to be in ${countryLabelFromCode(s.country)}.` : undefined}
      >
        {citiesForCountry.length > 0 ? (
          <Select value={s.city} onChange={(e) => patch({ city: e.target.value })}>
            <option value="">— Choose your city (optional) —</option>
            {citiesForCountry.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </Select>
        ) : (
          <Input value={s.city} onChange={(e) => patch({ city: e.target.value })} placeholder="e.g. London" />
        )}
      </Field>
      <label className="mt-3 inline-flex items-center gap-2 text-sm text-ink2">
        <input
          type="checkbox"
          checked={s.shareCity}
          onChange={(e) => patch({ shareCity: e.target.checked })}
          className="accent-terracotta"
        />
        Show my city on my profile
      </label>
    </div>
  );
}

function StepExperience({ s, patch }: { s: State; patch: (p: Partial<State>) => void }) {
  const [custom, setCustom] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  function toggle(v: string) {
    patch({
      experienceTags: s.experienceTags.includes(v)
        ? s.experienceTags.filter((x) => x !== v)
        : [...s.experienceTags, v]
    });
  }

  function addCustom() {
    const v = custom.trim();
    const result = validateShortLabel(v, { min: 2, max: 40, label: "Tag" });
    if (!result.ok) { setErr(result.reason); return; }
    if (s.experienceTags.some((t) => t.toLowerCase() === v.toLowerCase())) {
      setErr("Already added."); return;
    }
    setErr(null);
    patch({ experienceTags: [...s.experienceTags, v] });
    setCustom("");
  }

  // Tags that aren't in the predefined pool (user-added)
  const customTags = s.experienceTags.filter(
    (t) => !experienceTagPool.includes(t)
  );

  return (
    <div>
      <div className="text-terracotta mb-3"><Sankofa size={48} /></div>
      <StepHeader
        kicker="Step 5 · What you've lived through"
        title="Choose what you'd like a Tribe to recognise."
        body="Pick at least one. These are touchpoints, not diagnoses."
      />

      {customTags.length > 0 && (
        <div className="mb-3">
          <p className="eyebrow mb-2">Your own</p>
          <div className="flex flex-wrap gap-2">
            {customTags.map((t) => (
              <Chip key={t} as="button" active onClick={() => toggle(t)}>
                {t} <span className="ml-1 opacity-70">×</span>
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {experienceTagPool.map((t) => (
          <Chip key={t} as="button" active={s.experienceTags.includes(t)} onClick={() => toggle(t)}>{t}</Chip>
        ))}
      </div>

      <div className="mt-5">
        <Field label="Other (add your own)" hint="Something not listed? Add it as a tag.">
          <div className="flex gap-2">
            <Input
              value={custom}
              onChange={(e) => { setCustom(e.target.value); setErr(null); }}
              placeholder="e.g. Adopted, Late-diagnosed ADHD, Returnee…"
              maxLength={40}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
            />
            <Button size="sm" variant="outline" onClick={addCustom} disabled={custom.trim().length < 2}>
              Add
            </Button>
          </div>
        </Field>
        {err && <p className="mt-2 text-sm text-crisis">{err}</p>}
      </div>
    </div>
  );
}

function StepDiagnosis({ s, patch }: { s: State; patch: (p: Partial<State>) => void }) {
  return (
    <div>
      <StepHeader
        kicker="Step 6 · Self-description"
        title="If you have a diagnosis, you can name it here. (Optional.)"
        body="We never display this by default. It exists only if you want a Tribe to know."
      />
      <Field label="Diagnosis (optional)">
        <Input
          value={s.diagnosis}
          onChange={(e) => patch({ diagnosis: e.target.value })}
          placeholder="e.g. Bipolar II, c-PTSD"
        />
      </Field>
      <label className="mt-3 inline-flex items-center gap-2 text-sm text-ink2">
        <input
          type="checkbox"
          checked={s.diagnosisVisible}
          onChange={(e) => patch({ diagnosisVisible: e.target.checked })}
          className="accent-terracotta"
        />
        Show this to my Tribe (default: private)
      </label>
    </div>
  );
}

function StepPrompts({ s, patch }: { s: State; patch: (p: Partial<State>) => void }) {
  // Group prompts by depth — users can pick which ones speak to them.
  const groups = [
    { title: "Light", prompts: promptLibrary.light },
    { title: "Deeper", prompts: promptLibrary.medium },
    { title: "Heavy — only if it feels right", prompts: promptLibrary.heavy },
  ];

  function setAnswer(q: string, v: string) {
    const next = s.prompts.filter((p) => p.question !== q);
    if (v.trim()) next.push({ question: q, answer: v });
    patch({ prompts: next });
  }
  function get(q: string) { return s.prompts.find((p) => p.question === q)?.answer ?? ""; }
  const answered = s.prompts.filter((p) => {
    const rule = getPromptValidationRule(p.question, promptLibrary);
    return validateMeaningful(p.answer, rule).ok;
  }).length;

  return (
    <div>
      <div className="text-terracotta mb-3"><Funtunfunefu size={48} /></div>
      <StepHeader
        kicker="Step 7 · Prompts"
        title="Answer at least two."
        body="These are how Tribes find you. Skip any that don't fit — honest, specific answers travel further than polished ones."
      />

      <div className="space-y-8">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="eyebrow mb-3">{g.title}</p>
            <div className="space-y-4">
              {g.prompts.map((q) => {
                const answer = get(q);
                const hasText = answer.trim().length > 0;
                const rule = getPromptValidationRule(q, promptLibrary);
                const validation = hasText
                  ? validateMeaningful(answer, rule)
                  : { ok: true as const };
                const hint =
                  rule.minWords === 1 ? "A word or two is fine." :
                  rule.minWords === 2 ? "At least a short sentence." :
                  "Take a moment — a few sentences works best.";
                return (
                  <Field
                    key={q}
                    label={q}
                    hint={hint}
                    error={validation.ok ? undefined : validation.reason}
                  >
                    <Textarea
                      rows={2}
                      value={answer}
                      onChange={(e) => setAnswer(q, e.target.value)}
                      placeholder="Take your time. Skip if it doesn't fit."
                      maxLength={500}
                    />
                  </Field>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-ink3 sticky bottom-2 bg-parchment/90 rounded-md py-1 px-2 inline-block">
        {answered} meaningful answer{answered === 1 ? "" : "s"} · 2 required to continue
      </p>
    </div>
  );
}

function StepAvatar({ s, patch }: { s: State; patch: (p: Partial<State>) => void }) {
  const { userId } = useSession();
  const { data: media = [] } = useProfileMedia(userId);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => patch({ avatar: reader.result as string });
    reader.readAsDataURL(f);
  }
  return (
    <div>
      <StepHeader
        kicker="Step 8 · Photos & videos"
        title="A face for the room — and a glimpse of your world."
        body="Pick a profile photo first. You can also add a few photos or videos to your gallery now (or skip and add later)."
      />

      {/* Avatar */}
      <p className="eyebrow mb-3">Profile photo</p>
      <div className="flex items-center gap-5">
        <div
          className="h-24 w-24 rounded-full overflow-hidden border border-line flex items-center justify-center"
          style={{ background: s.avatar ? undefined : "var(--ct-rust)", color: "var(--ct-bone)" }}
        >
          {s.avatar
            ? <img src={s.avatar} alt="Your avatar" className="h-full w-full object-cover" />
            : <span className="font-mono uppercase">{(s.alias || "Y").slice(0, 2)}</span>
          }
        </div>
        <label className="inline-flex items-center gap-2 rounded-md border border-line bg-bone px-4 py-2.5 text-sm cursor-pointer hover:bg-ink/5">
          <Icon name="camera" size={16} />
          {s.avatar ? "Replace photo" : "Choose photo"}
          <input type="file" accept="image/*" capture="user" className="hidden" onChange={onPick} />
        </label>
      </div>

      {/* Gallery */}
      {userId && (
        <div className="mt-10">
          <p className="eyebrow mb-3">Gallery (optional)</p>
          <p className="text-sm text-ink2 mb-3 max-w-prose">
            Add a few photos or short videos that say something about you — a
            view from your window, a meal that means something, a place that
            grounds you. Up to 20 items.
          </p>
          <MediaUploader existing={media} ownerId={userId} />
          {media.length > 0 && (
            <div className="mt-5">
              <p className="eyebrow mb-2">Your gallery so far</p>
              <MediaGallery items={media} ownerId={userId} canEdit />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepID({ s, patch }: { s: State; patch: (p: Partial<State>) => void }) {
  function start() {
    patch({ idStatus: "verifying" });
    // Simulated verification — replace this block with a real Persona/Onfido SDK call
    setTimeout(() => patch({ idStatus: "verified" }), 1800);
  }
  return (
    <div>
      <div className="text-terracotta mb-3"><EyeOfHorus size={48} /></div>
      <StepHeader
        kicker="Step 9 · ID verification"
        title="One quick check. Then you're in."
        body="We verify ID through a third-party (Persona). They store the document — we only see a 'verified' flag. This is required before you can post publicly, and it keeps the network safer."
      />
      {s.idStatus === "idle" && (
        <Button onClick={start} size="lg">Start verification</Button>
      )}
      {s.idStatus === "verifying" && (
        <div className="surface p-5 inline-flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-ochre animate-pulse" />
          Verifying… don't close this tab.
        </div>
      )}
      {s.idStatus === "verified" && (
        <div className="surface p-5 inline-flex items-center gap-3 text-forest">
          <Icon name="check" size={20} /> ID verified. You're cleared to post.
        </div>
      )}
      <p className="mt-4 text-xs text-ink3">Your document is never stored on our servers.</p>
    </div>
  );
}

function StepCoC({ s, patch }: { s: State; patch: (p: Partial<State>) => void }) {
  const allVisited = codeOfConduct.every((c) => s.cocVisited[c.id]);
  return (
    <div>
      <div className="text-forest mb-3"><Dwennimmen size={48} /></div>
      <StepHeader
        kicker="Step 10 · Code of conduct"
        title="Read each clause. Then accept."
        body="Tap each one to expand it. Mods enforce these."
      />
      <ul className="space-y-2">
        {codeOfConduct.map((c, i) => {
          const open = !!s.cocVisited[c.id];
          return (
            <li key={c.id} className="surface overflow-hidden">
              <button
                onClick={() => patch({ cocVisited: { ...s.cocVisited, [c.id]: true } })}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`h-6 w-6 rounded-full inline-flex items-center justify-center text-xs font-mono ${open ? "bg-forest text-bone" : "bg-line text-ink3"}`}>
                    {open ? "✓" : i + 1}
                  </span>
                  <strong className="text-ink">{c.title}</strong>
                </div>
                <Icon name="arrow" size={16} className={open ? "rotate-90 transition" : "transition"} />
              </button>
              {open && <p className="px-4 pb-4 text-ink2 text-[15px]">{c.body}</p>}
            </li>
          );
        })}
      </ul>
      <label className={`mt-5 flex items-start gap-3 text-[15px] ${allVisited ? "text-ink" : "text-ink3"}`}>
        <input
          type="checkbox"
          disabled={!allVisited}
          checked={s.cocAccepted}
          onChange={(e) => patch({ cocAccepted: e.target.checked })}
          className="mt-1 accent-terracotta"
        />
        <span>
          I've read each clause and I accept the Code of Conduct.
          {!allVisited && <span className="block text-xs mt-0.5">Tap each clause above to enable this checkbox.</span>}
        </span>
      </label>
    </div>
  );
}

function StepDone({ s, onFinish, saving, saveErr }: {
  s: State;
  onFinish: () => void;
  saving: boolean;
  saveErr: string | null;
}) {
  return (
    <div>
      <div className="text-terracotta mb-3"><Pyramid size={56} /></div>
      <StepHeader
        kicker="Step 11 · You're in"
        title={`Welcome, ${s.alias || "friend"}.`}
        body="We've set you up. Your next step is to find a Tribe — start with the Lived Experience grid."
      />
      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <Link href="/network" className="surface p-5 hover:shadow-soft transition">
          <p className="eyebrow">First stop</p>
          <h3 className="font-display text-xl mt-1">Find your Tribe</h3>
          <p className="text-ink2 text-sm mt-1">Browse the network and send your first request.</p>
        </Link>
        <Link href="/academy" className="surface p-5 hover:shadow-soft transition">
          <p className="eyebrow">Or learn first</p>
          <h3 className="font-display text-xl mt-1">Open the Academy</h3>
          <p className="text-ink2 text-sm mt-1">Train as a peer supporter, in your own time.</p>
        </Link>
      </div>

      {saveErr && (
        <p className="mt-4 text-sm text-crisis bg-crisis/10 rounded-md px-3 py-2">
          Profile couldn't save right now — you can update it in Settings later. ({saveErr})
        </p>
      )}

      <div className="mt-6">
        <Button size="lg" onClick={onFinish} disabled={saving}>
          {saving ? "Saving your profile…" : "Enter the network →"}
        </Button>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

// Convert a base64 data URL (from FileReader.readAsDataURL) into a Blob
// so it can be uploaded to Supabase Storage.
function dataURLToBlob(dataURL: string): Blob {
  const [header, base64] = dataURL.split(",");
  const mimeMatch = header.match(/data:([^;]+);base64/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}
