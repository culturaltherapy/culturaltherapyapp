"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/useSession";
import { useUserPrompts } from "@/lib/hooks/useMyPrompts";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import {
  experienceTagPool,
  promptLibrary,
  LANGUAGE_OPTIONS,
  SOCIAL_PLATFORMS,
} from "@/lib/mock-data";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Select } from "@/components/ui/Field";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { LanguagePicker } from "@/components/ui/LanguagePicker";
import { validateMeaningful, validateShortLabel } from "@/lib/validation";

type SectionKey =
  | "avatar"
  | "identity"
  | "roots"
  | "experience"
  | "diagnosis"
  | "prompts"
  | "social"
  | "contact";

const DESCENT_OPTIONS = [
  "Ghanaian", "Nigerian", "Jamaican", "Trinidadian", "Kenyan",
  "Zimbabwean", "South African", "Ethiopian", "Somali", "Sudanese",
  "Senegalese", "British", "American", "Brazilian", "Other"
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
          summary={[
            profile.alias,
            (profile as any).pronouns,
            (profile as any).birth_year ? `${new Date().getFullYear() - (profile as any).birth_year}` : null,
            [profile.city, profile.country].filter(Boolean).join(", "),
          ].filter(Boolean).join(" · ")}
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
          title="Social links"
          summary={`${((profile as any).social_links ?? []).length} linked`}
          open={openSection === "social"}
          onToggle={() => toggle("social")}
        >
          <SocialLinksEditor userId={userId} profile={profile} onSaved={reload} />
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
  const thisYear = new Date().getFullYear();
  const [alias, setAlias] = React.useState(profile.alias ?? "");
  const [pronouns, setPronouns] = React.useState(profile.pronouns ?? "");
  const [birthYear, setBirthYear] = React.useState<string>(
    profile.birth_year != null ? String(profile.birth_year) : "",
  );
  const [country, setCountry] = React.useState(profile.country ?? "GB");
  const [city, setCity] = React.useState(profile.city ?? "");

  const parsedBirthYear = (() => {
    const n = parseInt(birthYear, 10);
    return Number.isFinite(n) && n >= 1900 && n <= thisYear ? n : null;
  })();

  return (
    <SaveForm
      userId={userId}
      patch={{
        alias: alias.trim(),
        pronouns: pronouns.trim() || null,
        birth_year: parsedBirthYear,
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
      <Field label="Year of birth (optional)" hint="We display age, not date.">
        <Input
          type="number"
          inputMode="numeric"
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
          min={1900}
          max={thisYear}
          placeholder={`e.g. ${thisYear - 28}`}
        />
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
  const [languagesUnderstood, setLanguagesUnderstood] = React.useState<string[]>(
    profile.languages_understood ?? []
  );

  function toggle(arr: string[], v: string, setter: (a: string[]) => void) {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  return (
    <SaveForm
      userId={userId}
      patch={{ descent, languages, languages_understood: languagesUnderstood }}
      onSaved={onSaved}
      disabled={descent.length === 0}
    >
      <Field label="Heritage / descent" required>
        <div className="flex flex-wrap gap-2">
          {DESCENT_OPTIONS.map((d) => (
            <Chip key={d} as="button" active={descent.includes(d)} onClick={() => toggle(descent, d, setDescent)}>
              {d}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Languages you speak" hint="The ones you can hold a conversation in.">
        <LanguagePicker
          value={languages}
          onChange={setLanguages}
          placeholder="Type to search — e.g. Twi, Patois…"
        />
      </Field>

      <Field label="Languages you understand (but don't speak)" hint="Languages you can follow even if you'd struggle to reply.">
        <LanguagePicker
          value={languagesUnderstood}
          onChange={setLanguagesUnderstood}
          placeholder="Type to search…"
        />
      </Field>
    </SaveForm>
  );
}

function SocialLinksEditor({ userId, profile, onSaved }: { userId: string; profile: any; onSaved: () => void }) {
  type Link = { platform: string; url: string };
  const [links, setLinks] = React.useState<Link[]>(
    Array.isArray(profile.social_links) ? profile.social_links : [],
  );
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  function update(i: number, patch: Partial<Link>) {
    setLinks((cur) => cur.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function add() {
    setLinks((cur) => [...cur, { platform: "instagram", url: "" }]);
  }
  function remove(i: number) {
    setLinks((cur) => cur.filter((_, idx) => idx !== i));
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const cleaned = links
        .map((l) => ({
          platform: l.platform,
          url: l.url.trim(),
        }))
        .filter((l) => l.url.length > 0);

      // Auto-prepend https:// if user typed a bare domain
      const normalized = cleaned.map((l) => ({
        ...l,
        url: /^https?:\/\//i.test(l.url) ? l.url : `https://${l.url}`,
      }));

      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { error } = await supa.from("profiles").update({ social_links: normalized }).eq("id", userId);
      if (error) throw error;
      setLinks(normalized);
      setSavedAt(Date.now());
      onSaved();
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {links.length === 0 && (
        <p className="text-sm text-ink3">
          Add links to where else you exist online — Instagram, TikTok, your own site.
        </p>
      )}

      {links.map((l, i) => (
        <div key={i} className="flex gap-2 items-end">
          <div className="w-36">
            <Field label={i === 0 ? "Platform" : ""}>
              <Select value={l.platform} onChange={(e) => update(i, { platform: e.target.value })}>
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex-1">
            <Field label={i === 0 ? "URL or @handle" : ""}>
              <Input
                value={l.url}
                onChange={(e) => update(i, { url: e.target.value })}
                placeholder="e.g. instagram.com/yaa.o or @yaa.o"
              />
            </Field>
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-xs text-ink3 hover:text-crisis whitespace-nowrap pb-3"
          >
            Remove
          </button>
        </div>
      ))}

      <button type="button" onClick={add} className="text-sm text-terracotta hover:underline">
        + Add a link
      </button>

      {err && <p className="text-sm text-crisis">{err}</p>}
      <div className="flex items-center gap-3 pt-2">
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save links"}
        </Button>
        {savedAt && !busy && <span className="text-xs text-forest">✓ Saved</span>}
      </div>
    </div>
  );
}

function ExperienceEditor({ userId, profile, onSaved }: { userId: string; profile: any; onSaved: () => void }) {
  const [tags, setTags] = React.useState<string[]>(profile.experience_tags ?? []);
  const [custom, setCustom] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  function toggle(v: string) {
    setTags((cur) => cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  }

  function addCustom() {
    const v = custom.trim();
    const r = validateShortLabel(v, { min: 2, max: 40, label: "Tag" });
    if (!r.ok) { setErr(r.reason); return; }
    if (tags.some((t) => t.toLowerCase() === v.toLowerCase())) {
      setErr("Already added."); return;
    }
    setErr(null);
    setTags([...tags, v]);
    setCustom("");
  }

  const customTags = tags.filter((t) => !experienceTagPool.includes(t));

  return (
    <SaveForm userId={userId} patch={{ experience_tags: tags }} onSaved={onSaved}>
      <Field label="Touchpoints" hint="Pick what you want a Tribe to recognise.">
        {customTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {customTags.map((t) => (
              <Chip key={t} as="button" active onClick={() => toggle(t)}>{t} ×</Chip>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {experienceTagPool.map((t) => (
            <Chip key={t} as="button" active={tags.includes(t)} onClick={() => toggle(t)}>{t}</Chip>
          ))}
        </div>
      </Field>
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
        {err && <p className="mt-2 text-xs text-crisis">{err}</p>}
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
  const [calls, setCalls] = React.useState(profile.accepts_calls === true);
  const [video, setVideo] = React.useState(profile.accepts_video === true);
  const isPeerSupporter = profile.is_peer_supporter === true;

  return (
    <SaveForm
      userId={userId}
      patch={{
        accepts_tribe_requests: tribe,
        accepts_dms: dms,
        accepts_calls: isPeerSupporter ? calls : false,
        accepts_video: isPeerSupporter ? video : false,
      }}
      onSaved={onSaved}
    >
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-ink2">
          <input type="checkbox" checked={tribe} onChange={(e) => setTribe(e.target.checked)} className="accent-terracotta" />
          Accept Tribe requests
        </label>
        <label className="flex items-center gap-2 text-sm text-ink2">
          <input type="checkbox" checked={dms} onChange={(e) => setDms(e.target.checked)} className="accent-terracotta" />
          Accept direct messages
        </label>
      </div>

      <div className="mt-5 pt-4 border-t border-line">
        <p className="eyebrow mb-2">Voice and video — peer-supporter only</p>
        <p className="text-sm text-ink2 mb-3">
          For safeguarding reasons, voice and video calls are only available
          between members who've completed the Peer Support Academy. Phone numbers
          and home addresses should never be shared in chat or calls — if you
          spot someone sharing or asking for that, report it from the message
          menu.
        </p>

        {!isPeerSupporter ? (
          <div className="rounded-md bg-ochre/10 border border-ochre/30 px-3 py-3 text-sm">
            <p className="text-ink2">
              To turn these on, complete the{" "}
              <Link href="/academy" className="text-terracotta hover:underline">Peer Support Academy</Link>.
              Once you're accredited, you'll be able to accept voice and video
              calls from members you've connected with.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-ink2">
              <input type="checkbox" checked={calls} onChange={(e) => setCalls(e.target.checked)} className="accent-terracotta" />
              Accept voice calls (from connected members)
            </label>
            <label className="flex items-center gap-2 text-sm text-ink2">
              <input type="checkbox" checked={video} onChange={(e) => setVideo(e.target.checked)} className="accent-terracotta" />
              Accept video calls (from connected members)
            </label>
          </div>
        )}
      </div>
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
      const filled = drafts.filter((d) =>
        validateMeaningful(d.answer, { minChars: 8, minWords: 2 }).ok
      );

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
          {(() => {
            const hasText = d.answer.trim().length > 0;
            const v = hasText ? validateMeaningful(d.answer, { minChars: 8, minWords: 2 }) : { ok: true as const };
            return (
              <Field label="Your answer" error={v.ok ? undefined : v.reason}>
                <Textarea
                  rows={2}
                  value={d.answer}
                  onChange={(e) => update(i, { answer: e.target.value })}
                  maxLength={500}
                  placeholder="Take your time."
                />
              </Field>
            );
          })()}
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
