"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/useSession";
import { useUserPrompts } from "@/lib/hooks/useMyPrompts";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { experienceTagPool, promptLibrary } from "@/lib/mock-data";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Select } from "@/components/ui/Field";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

type SectionKey =
  | "avatar"
  | "identity"
  | "roots"
  | "experience"
  | "diagnosis"
  | "prompts"
  | "contact";

const DESCENT_OPTIONS = [
  "Ghanaian", "Nigerian", "Jamaican", "Trinidadian", "Kenyan",
  "Zimbabwean", "South African", "Ethiopian", "Somali", "Sudanese",
  "Senegalese", "British", "American", "Brazilian", "Other"
];

const LANGUAGE_OPTIONS = [
  "English", "Twi", "Yoruba", "Igbo", "Patois",
  "Swahili", "French", "Portuguese", "Arabic", "Amharic"
];

const COUNTRY_OPTIONS = [
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "NG", label: "Nigeria" },
  { value: "GH", label: "Ghana" },
  { value: "JM", label: "Jamaica" },
  { value: "ZA", label: "South Africa" },
  { value: "KE", label: "Kenya" },
  { value: "ZW", label: "Zimbabwe" },
  { value: "OT", label: "Other" }
];

export default function EditProfile() {
  const router = useRouter();
  const { userId, profile, loading } = useSession();
  const { data: prompts = [], refetch: refetchPrompts } = useUserPrompts(userId);
  const [openSection, setOpenSection] = React.useState<SectionKey | null>(null);
  const [, forceRefresh] = React.useReducer((x) => x + 1, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!userId || !profile) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-xl">Not signed in.</p>
        <Link href="/signin" className="mt-3 inline-block text-terracotta hover:underline">Sign in</Link>
      </div>
    );
  }

  function toggle(s: SectionKey) {
    setOpenSection((cur) => (cur === s ? null : s));
  }

  async function reload() {
    // Force the session/profile to refetch — easiest is a soft route refresh
    router.refresh();
    await refetchPrompts();
    forceRefresh();
  }

  return (
    <div>
      <Link href="/profile" className="text-sm text-ink3 hover:text-ink inline-flex items-center gap-1.5">
        <Icon name="arrowLeft" size={14} /> Back to my profile
      </Link>

      <header className="mt-3">
        <p className="eyebrow">Editing profile</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-1 leading-tight max-w-[20ch]">
          What do you want others to see?
        </h1>
        <p className="text-ink2 mt-2 max-w-prose">
          Each section saves on its own. Open one, make a change, save.
        </p>
      </header>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        <SectionCard
          title="Avatar"
          summary={(profile as any).avatar_url ? "Photo set" : "No photo yet"}
          open={openSection === "avatar"}
          onToggle={() => toggle("avatar")}
        >
          <AvatarEditor userId={userId} profile={profile} onSaved={reload} />
        </SectionCard>

        <SectionCard
          title="Identity"
          summary={[profile.alias, (profile as any).pronouns, [profile.city, profile.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
          open={openSection === "identity"}
          onToggle={() => toggle("identity")}
        >
          <IdentityEditor userId={userId} profile={profile} onSaved={reload} />
        </SectionCard>

        <SectionCard
          title="Roots"
          summary={`${((profile as any).descent ?? []).length} heritage · ${((profile as any).languages ?? []).length} languages`}
          open={openSection === "roots"}
          onToggle={() => toggle("roots")}
        >
          <RootsEditor userId={userId} profile={profile} onSaved={reload} />
        </SectionCard>

        <SectionCard
          title="Lived experience"
          summary={`${((profile as any).experience_tags ?? []).length} tags`}
          open={openSection === "experience"}
          onToggle={() => toggle("experience")}
        >
          <ExperienceEditor userId={userId} profile={profile} onSaved={reload} />
        </SectionCard>

        <SectionCard
          title="Self-description"
          summary={(profile as any).diagnosis ? `${(profile as any).diagnosis} · ${(profile as any).diagnosis_visibility ?? "private"}` : "Optional · private by default"}
          open={openSection === "diagnosis"}
          onToggle={() => toggle("diagnosis")}
        >
          <DiagnosisEditor userId={userId} profile={profile} onSaved={reload} />
        </SectionCard>

        <SectionCard
          title="Prompts"
          summary={`${prompts.length} answered`}
          open={openSection === "prompts"}
          onToggle={() => toggle("prompts")}
        >
          <PromptsEditor userId={userId} existing={prompts} onSaved={reload} />
        </SectionCard>

        <SectionCard
          title="Contact preferences"
          summary={[
            (profile as any).accepts_tribe_requests !== false && "Tribe",
            (profile as any).accepts_dms !== false && "DMs"
          ].filter(Boolean).join(" · ") || "All off"}
          open={openSection === "contact"}
          onToggle={() => toggle("contact")}
        >
          <ContactEditor userId={userId} profile={profile} onSaved={reload} />
        </SectionCard>
      </ul>
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────

function SectionCard({
  title, summary, open, onToggle, children,
}: {
  title: string; summary: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <li className={`surface p-5 ${open ? "sm:col-span-2" : ""}`}>
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl">{title}</h2>
          <span className="text-terracotta text-sm">
            {open ? "Close" : "Edit →"}
          </span>
        </div>
        <p className="text-ink2 text-sm mt-1 truncate">{summary || "—"}</p>
      </button>
      {open && (
        <div className="mt-4 pt-4 border-t border-line">
          {children}
        </div>
      )}
    </li>
  );
}

// ── Editors ──────────────────────────────────────────────────────────────────

function AvatarEditor({ userId, profile, onSaved }: { userId: string; profile: any; onSaved: () => void }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const currentUrl = profile.avatar_url ?? null;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supa.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supa.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      const { error: updateError } = await supa.from("profiles")
        .update({ avatar_url: url })
        .eq("id", userId);
      if (updateError) throw updateError;
      onSaved();
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-5">
        <Avatar
          name={profile.alias ?? "?"}
          color={(profile as any).avatar_color}
          src={currentUrl}
          size={96}
        />
        <label className="inline-flex items-center gap-2 rounded-md border border-line bg-bone px-4 py-2.5 text-sm cursor-pointer hover:bg-ink/5">
          <Icon name="camera" size={16} />
          {currentUrl ? "Replace photo" : "Choose photo"}
          <input type="file" accept="image/*" className="hidden" onChange={onPick} disabled={busy} />
        </label>
      </div>
      {busy && <p className="mt-3 text-sm text-ink3">Uploading…</p>}
      {err && <p className="mt-3 text-sm text-crisis">{err}</p>}
    </div>
  );
}

function IdentityEditor({ userId, profile, onSaved }: { userId: string; profile: any; onSaved: () => void }) {
  const [alias, setAlias] = React.useState(profile.alias ?? "");
  const [pronouns, setPronouns] = React.useState(profile.pronouns ?? "");
  const [country, setCountry] = React.useState(profile.country ?? "GB");
  const [city, setCity] = React.useState(profile.city ?? "");
  return (
    <SaveForm
      userId={userId}
      patch={{
        alias: alias.trim(),
        pronouns: pronouns.trim() || null,
        country,
        city: city.trim() || null,
      }}
      onSaved={onSaved}
      disabled={alias.trim().length < 2}
    >
      <Field label="Alias" required>
        <Input value={alias} onChange={(e) => setAlias(e.target.value)} maxLength={24} />
      </Field>
      <Field label="Pronouns (optional)">
        <Input value={pronouns} onChange={(e) => setPronouns(e.target.value)} />
      </Field>
      <Field label="Country">
        <Select value={country} onChange={(e) => setCountry(e.target.value)}>
          {COUNTRY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
      </Field>
      <Field label="City (optional)">
        <Input value={city} onChange={(e) => setCity(e.target.value)} />
      </Field>
    </SaveForm>
  );
}

function RootsEditor({ userId, profile, onSaved }: { userId: string; profile: any; onSaved: () => void }) {
  const [descent, setDescent] = React.useState<string[]>(profile.descent ?? []);
  const [languages, setLanguages] = React.useState<string[]>(profile.languages ?? []);

  function toggle(arr: string[], v: string, setter: (a: string[]) => void) {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  return (
    <SaveForm userId={userId} patch={{ descent, languages }} onSaved={onSaved} disabled={descent.length === 0}>
      <Field label="Heritage / descent" required>
        <div className="flex flex-wrap gap-2">
          {DESCENT_OPTIONS.map((d) => (
            <Chip key={d} as="button" active={descent.includes(d)} onClick={() => toggle(descent, d, setDescent)}>
              {d}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Languages">
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((l) => (
            <Chip key={l} as="button" active={languages.includes(l)} onClick={() => toggle(languages, l, setLanguages)}>
              {l}
            </Chip>
          ))}
        </div>
      </Field>
    </SaveForm>
  );
}

function ExperienceEditor({ userId, profile, onSaved }: { userId: string; profile: any; onSaved: () => void }) {
  const [tags, setTags] = React.useState<string[]>(profile.experience_tags ?? []);
  function toggle(v: string) {
    setTags((cur) => cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  }
  return (
    <SaveForm userId={userId} patch={{ experience_tags: tags }} onSaved={onSaved}>
      <Field label="Touchpoints" hint="Pick what you want a Tribe to recognise.">
        <div className="flex flex-wrap gap-2">
          {experienceTagPool.map((t) => (
            <Chip key={t} as="button" active={tags.includes(t)} onClick={() => toggle(t)}>{t}</Chip>
          ))}
        </div>
      </Field>
    </SaveForm>
  );
}

function DiagnosisEditor({ userId, profile, onSaved }: { userId: string; profile: any; onSaved: () => void }) {
  const [diagnosis, setDiagnosis] = React.useState(profile.diagnosis ?? "");
  const [visible, setVisible] = React.useState(profile.diagnosis_visibility === "tribe");
  return (
    <SaveForm
      userId={userId}
      patch={{
        diagnosis: diagnosis.trim() || null,
        diagnosis_visibility: visible ? "tribe" : "private",
      }}
      onSaved={onSaved}
    >
      <Field label="Diagnosis (optional)">
        <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
      </Field>
      <label className="mt-2 inline-flex items-center gap-2 text-sm text-ink2">
        <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="accent-terracotta" />
        Show this to my Tribe
      </label>
    </SaveForm>
  );
}

function ContactEditor({ userId, profile, onSaved }: { userId: string; profile: any; onSaved: () => void }) {
  const [tribe, setTribe] = React.useState(profile.accepts_tribe_requests !== false);
  const [dms, setDms] = React.useState(profile.accepts_dms !== false);
  return (
    <SaveForm
      userId={userId}
      patch={{ accepts_tribe_requests: tribe, accepts_dms: dms }}
      onSaved={onSaved}
    >
      <label className="flex items-center gap-2 text-sm text-ink2">
        <input type="checkbox" checked={tribe} onChange={(e) => setTribe(e.target.checked)} className="accent-terracotta" />
        Accept Tribe requests
      </label>
      <label className="flex items-center gap-2 text-sm text-ink2 mt-2">
        <input type="checkbox" checked={dms} onChange={(e) => setDms(e.target.checked)} className="accent-terracotta" />
        Accept direct messages
      </label>
    </SaveForm>
  );
}

function PromptsEditor({ userId, existing, onSaved }: {
  userId: string;
  existing: { id: string; question: string; answer: string }[];
  onSaved: () => void;
}) {
  const allQuestions = [...promptLibrary.light, ...promptLibrary.medium, ...promptLibrary.heavy];
  type Draft = { question: string; answer: string };

  const initial: Draft[] = existing.length > 0
    ? existing.map((p) => ({ question: p.question, answer: p.answer }))
    : [{ question: allQuestions[0], answer: "" }];

  const [drafts, setDrafts] = React.useState<Draft[]>(initial);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  function update(i: number, patch: Partial<Draft>) {
    setDrafts((cur) => cur.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function add() {
    setDrafts((cur) => [...cur, { question: allQuestions[cur.length % allQuestions.length], answer: "" }]);
  }
  function remove(i: number) {
    setDrafts((cur) => cur.filter((_, idx) => idx !== i));
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const filled = drafts.filter((d) => d.answer.trim());

      // Wipe and re-insert — keeps things simple and avoids stale prompts
      const { error: delError } = await supa.from("profile_prompts").delete().eq("user_id", userId);
      if (delError) throw delError;

      if (filled.length > 0) {
        const { error: insError } = await supa.from("profile_prompts").insert(
          filled.map((d, i) => ({
            user_id: userId,
            prompt_id: `prompt_${i}`,
            question: d.question,
            answer: d.answer.trim(),
            visibility: "tribe" as const,
          }))
        );
        if (insError) throw insError;
      }
      onSaved();
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't save prompts.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {drafts.map((d, i) => (
        <div key={i} className="border border-line rounded-lg p-3">
          <div className="flex items-baseline justify-between gap-2">
            <Field label={`Prompt ${i + 1}`}>
              <Select value={d.question} onChange={(e) => update(i, { question: e.target.value })}>
                {allQuestions.map((q) => <option key={q} value={q}>{q}</option>)}
              </Select>
            </Field>
            {drafts.length > 1 && (
              <button onClick={() => remove(i)} className="text-xs text-ink3 hover:text-crisis whitespace-nowrap mt-6">
                Remove
              </button>
            )}
          </div>
          <Field label="Your answer">
            <Textarea
              rows={2}
              value={d.answer}
              onChange={(e) => update(i, { answer: e.target.value })}
              maxLength={280}
              placeholder="Take your time."
            />
          </Field>
        </div>
      ))}

      <button onClick={add} className="text-sm text-terracotta hover:underline">+ Add another prompt</button>

      {err && <p className="text-sm text-crisis">{err}</p>}
      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save prompts"}
        </Button>
      </div>
    </div>
  );
}

// ── Reusable save form ───────────────────────────────────────────────────────

function SaveForm({
  userId,
  patch,
  onSaved,
  disabled,
  children,
}: {
  userId: string;
  patch: Record<string, any>;
  onSaved: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { error } = await supa.from("profiles").update(patch).eq("id", userId);
      if (error) throw error;
      setSavedAt(Date.now());
      onSaved();
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {children}
      {err && <p className="text-sm text-crisis">{err}</p>}
      <div className="flex items-center gap-3 pt-2">
        <Button size="sm" onClick={save} disabled={busy || disabled}>
          {busy ? "Saving…" : "Save"}
        </Button>
        {savedAt && !busy && <span className="text-xs text-forest">✓ Saved</span>}
      </div>
    </div>
  );
}
