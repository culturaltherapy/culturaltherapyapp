"use client";

import * as React from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Select } from "@/components/ui/Field";
import { validateMeaningful, validateShortLabel } from "@/lib/validation";

type Role = "lived_experience" | "accredited_peer_supporter" | "other";

export function PeerSupporterSignupForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Role>("lived_experience");
  const [organisation, setOrganisation] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const nameValid = validateShortLabel(name, { min: 2, max: 80, label: "Name" });
  const emailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? { ok: true as const }
      : { ok: false as const, reason: "Enter a valid email." };
  const messageValid = message.trim().length === 0
    ? { ok: true as const }
    : validateMeaningful(message, { minChars: 20, minWords: 4, label: "Message" });
  const canSubmit = nameValid.ok && emailValid.ok && messageValid.ok && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    try {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { error } = await (supa as any).from("peer_supporter_signups").insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        organisation: organisation.trim() || null,
        message: message.trim() || null,
      });
      if (error) throw error;
      setDone(true);
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't submit. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="surface p-6 sm:p-8 text-center">
        <p className="text-terracotta font-mono text-xs uppercase tracking-widest">Thank you</p>
        <h3 className="font-display text-2xl sm:text-3xl mt-2">We'll be in touch.</h3>
        <p className="text-ink2 text-sm mt-3 max-w-md mx-auto">
          Your details are with us. We'll reach out as we build the Academy
          curriculum — likely with a short call to hear what you'd want from
          peer-support training.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="surface p-6 sm:p-8 space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <Field
          label="Your name"
          required
          error={name.trim() && !nameValid.ok ? nameValid.reason : undefined}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="e.g. Adwoa Mensah"
            maxLength={80}
          />
        </Field>
        <Field
          label="Email"
          required
          error={email.trim() && !emailValid.ok ? emailValid.reason : undefined}
        >
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={200}
          />
        </Field>
      </div>

      <Field label="Your role" required>
        <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="lived_experience">I have lived experience and want to help shape this</option>
          <option value="accredited_peer_supporter">I'm an accredited peer supporter (via another organisation)</option>
          <option value="other">Other</option>
        </Select>
      </Field>

      <Field label="Organisation (optional)">
        <Input
          value={organisation}
          onChange={(e) => setOrganisation(e.target.value)}
          placeholder="e.g. Mind, NHS Talking Therapies, freelance…"
          maxLength={120}
        />
      </Field>

      <Field
        label="Why you'd be a good fit (optional)"
        hint="A short paragraph — what you'd bring."
        error={messageValid.ok ? undefined : messageValid.reason}
      >
        <Textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={800}
          placeholder="e.g. I've trained 40+ peer supporters at Mind and would love to help shape culturally rooted curriculum…"
        />
      </Field>

      {err && <p className="text-sm text-crisis">{err}</p>}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={!canSubmit}>
          {busy ? "Sending…" : "Sign me up"}
        </Button>
      </div>
    </form>
  );
}
