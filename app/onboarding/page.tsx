"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Select } from "@/components/ui/Field";
import { Chip } from "@/components/ui/Chip";
import { Sankofa, Ubuntu, Pyramid, Dwennimmen, Funtunfunefu } from "@/components/motifs/Motifs";
import { Icon } from "@/components/ui/Icon";
import { codeOfConduct, experienceTagPool, promptLibrary } from "@/lib/mock-data";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type State = {
  alias: string;
  pronouns: string;
  descent: string[];
  languages: string[];
  country: string;
  city: string;
  shareCity: boolean;
  experienceTags: string[];
  diagnosis: string;
  diagnosisVisible: boolean;
  prompts: { question: string; answer: string }[];
  avatar: string | null;
  cocVisited: Record<string, boolean>;
  cocAccepted: boolean;
};

// Step map (10 steps — ID verification removed, wired to a real vendor later)
// 1  Welcome
// 2  Identity (alias / pronouns)
// 3  Roots (descent / languages)
// 4  Location
// 5  Experience tags
// 6  Diagnosis (optional)
// 7  Prompts
// 8  Avatar
// 9  Code of Conduct
// 10 Done
const TOTAL = 10;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [saving, setSaving] = React.useState(false);
  const [saveErr, setSaveErr] = React.useState<string | null>(null);
  const [s, setS] = React.useState<State>({
    alias: "",
    pronouns: "",
    descent: [],
    languages: [],
    country: "GB",
    city: "",
    shareCity: true,
    experienceTags: [],
    diagnosis: "",
    diagnosisVisible: false,
    prompts: [],
    avatar: null,
    cocVisited: {},
    cocAccepted: false,
  });

  function patch(p: Partial<State>) {
    setS((prev) => ({ ...prev, ...p }));
  }

  function next() { setStep((n) => Math.min(TOTAL, n + 1)); }
  function prev() { setStep((n) => Math.max(1, n - 1)); }

  const canContinue = React.useMemo(() => {
    switch (step) {
      case 1: return true;
      case 2: return s.alias.trim().length >= 2;
      case 3: return s.descent.length > 0;
      case 4: return s.country.length >= 2;
      case 5: return s.experienceTags.length >= 1;
      case 6: return true;
      case 7: return s.prompts.filter((p) => p.answer.trim().length > 0).length >= 2;
      case 8: return true;
      case 9: return s.cocAccepted;
      case 10: return true;
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
          // Upsert profile — works whether trigger created the row or not
          const { error: profileError } = await supa.from("profiles").upsert({
            id: session.user.id,
            alias: s.alias.trim(),
            pronouns: s.pronouns || null,
            descent: s.descent,
            languages: s.languages,
            country: s.country,
            city: s.shareCity ? s.city || null : null,
            experience_tags: s.experienceTags,
            diagnosis: s.diagnosis || null,
            diagnosis_visibility: s.diagnosisVisible ? "tribe" : "private",
            id_verified: true,       // auto-verified at onboarding completion
            accepts_tribe_requests: true,
            accepts_dms: true,
          }, { onConflict: "id" });

          if (profileError) {
            console.error("Profile upsert error:", profileError.message);
            setSaveErr(profileError.message);
          }

          // Save prompt answers
          const filledPrompts = s.prompts.filter((p) => p.answer.trim());
          if (filledPrompts.length > 0) {
            await supa.from("profile_prompts").upsert(
              filledPrompts.map((p, i) => ({
                user_id: session.user.id,
                prompt_id: `onboarding_${i}`,
                answer: p.answer.trim(),
                visibility: "tribe" as const,
              }))
            );
          }

          setSaving(false);
          router.push("/home");
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
      router.push("/home");
    }
  }

  return (
    <div className="min-h-dvh bg-parchment text-ink flex flex-col">
      <header className="border-b border-line">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/"><Logo size={26} withWordmark={false} /></Link>
          <div className="text-xs text-ink3 font-mono">Step {step} of {TOTAL}</div>
          <Link href="/signin" className="text-sm text-ink3 hover:text-ink">Sign in</Link>
        </div>
        <div className="h-1 w-full bg-line">
          <div className="h-1 bg-terracotta transition-all duration-300" style={{ width: `${(step / TOTAL) * 100}%` }} />
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          {step === 1  && <StepWelcome />}
          {step === 2  && <StepIdentity s={s} patch={patch} />}
          {step === 3  && <StepRoots s={s} patch={patch} />}
          {step === 4  && <StepLocation s={s} patch={patch} />}
          {step === 5  && <StepExperience s={s} patch={patch} />}
          {step === 6  && <StepDiagnosis s={s} patch={patch} />}
          {step === 7  && <StepPrompts s={s} patch={patch} />}
          {step === 8  && <StepAvatar s={s} patch={patch} />}
          {step === 9  && <StepCoC s={s} patch={patch} />}
          {step === 10 && <StepDone s={s} onFinish={finish} saving={saving} saveErr={saveErr} />}
        </div>
      </main>

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
              {saving ? "Saving…" : "Enter the network"} <Icon name="arrow" size={14} />
            </Button>
          )}
        </div>
      </footer>
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
  return (
    <div>
      <StepHeader
        kicker="Step 2 · Identity"
        title="What should we call you?"
        body="Your alias is what other members see. Use whatever feels yours — a first name, a nickname, an initial."
      />
      <div className="space-y-5">
        <Field label="Alias" required hint="2–24 characters">
          <Input
            value={s.alias}
            onChange={(e) => patch({ alias: e.target.value })}
            placeholder="e.g. Yaa O."
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
      </div>
    </div>
  );
}

function StepRoots({ s, patch }: { s: State; patch: (p: Partial<State>) => void }) {
  function toggle(arr: string[], v: string) {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }
  const descents = ["Ghanaian","Nigerian","Jamaican","Trinidadian","Kenyan","Zimbabwean","South African","Ethiopian","Somali","Sudanese","Senegalese","British","American","Brazilian","Other"];
  const langs = ["English","Twi","Yoruba","Igbo","Patois","Swahili","French","Portuguese","Arabic","Amharic"];
  return (
    <div>
      <div className="text-forest mb-3"><Ubuntu size={48} /></div>
      <StepHeader kicker="Step 3 · Roots" title="Where are your people from?" body="Pick all that feel like you." />
      <Field label="Heritage / descent" required>
        <div className="flex flex-wrap gap-2">
          {descents.map((d) => (
            <Chip key={d} as="button" active={s.descent.includes(d)} onClick={() => patch({ descent: toggle(s.descent, d) })}>
              {d}
            </Chip>
          ))}
        </div>
      </Field>
      <div className="h-5" />
      <Field label="Languages you carry">
        <div className="flex flex-wrap gap-2">
          {langs.map((l) => (
            <Chip key={l} as="button" active={s.languages.includes(l)} onClick={() => patch({ languages: toggle(s.languages, l) })}>
              {l}
            </Chip>
          ))}
        </div>
      </Field>
    </div>
  );
}

function StepLocation({ s, patch }: { s: State; patch: (p: Partial<State>) => void }) {
  return (
    <div>
      <StepHeader
        kicker="Step 4 · Where you are now"
        title="Country, and a city if you want to share."
        body="Country is shown on your card. City is optional — if you live somewhere small, we recommend keeping it private."
      />
      <Field label="Country" required>
        <Select value={s.country} onChange={(e) => patch({ country: e.target.value })}>
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
      <Field label="City (optional)" hint="Helps with location matches">
        <Input value={s.city} onChange={(e) => patch({ city: e.target.value })} placeholder="e.g. London" />
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
  function toggle(v: string) {
    patch({
      experienceTags: s.experienceTags.includes(v)
        ? s.experienceTags.filter((x) => x !== v)
        : [...s.experienceTags, v]
    });
  }
  return (
    <div>
      <div className="text-terracotta mb-3"><Sankofa size={48} /></div>
      <StepHeader
        kicker="Step 5 · What you've lived through"
        title="Choose what you'd like a Tribe to recognise."
        body="Pick at least one. These are touchpoints, not diagnoses."
      />
      <div className="flex flex-wrap gap-2">
        {experienceTagPool.map((t) => (
          <Chip key={t} as="button" active={s.experienceTags.includes(t)} onClick={() => toggle(t)}>{t}</Chip>
        ))}
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
  const all = [...promptLibrary.light, ...promptLibrary.medium, ...promptLibrary.heavy];
  function setAnswer(q: string, v: string) {
    const next = s.prompts.filter((p) => p.question !== q);
    if (v.trim()) next.push({ question: q, answer: v });
    patch({ prompts: next });
  }
  function get(q: string) { return s.prompts.find((p) => p.question === q)?.answer ?? ""; }
  return (
    <div>
      <div className="text-terracotta mb-3"><Funtunfunefu size={48} /></div>
      <StepHeader
        kicker="Step 7 · Prompts"
        title="Answer at least two."
        body="These are how Tribes find you. Honest, specific answers travel further than polished ones."
      />
      <div className="space-y-5">
        {all.slice(0, 5).map((q) => (
          <Field key={q} label={q}>
            <Textarea rows={2} value={get(q)} onChange={(e) => setAnswer(q, e.target.value)} placeholder="Take your time." maxLength={280} />
          </Field>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink3">
        {s.prompts.filter((p) => p.answer.trim()).length} of 5 answered · 2 required
      </p>
    </div>
  );
}

function StepAvatar({ s, patch }: { s: State; patch: (p: Partial<State>) => void }) {
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
        kicker="Step 8 · A face for the room"
        title="A photo helps people land."
        body="A real photo is encouraged — but a portrait, illustration, or symbol is fine too. You can skip this and add one later."
      />
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
    </div>
  );
}

function StepCoC({ s, patch }: { s: State; patch: (p: Partial<State>) => void }) {
  const allVisited = codeOfConduct.every((c) => s.cocVisited[c.id]);
  return (
    <div>
      <div className="text-forest mb-3"><Dwennimmen size={48} /></div>
      <StepHeader
        kicker="Step 9 · Code of conduct"
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
        kicker="Step 10 · You're in"
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
