"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/useSession";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";

export default function SettingsPage() {
  const router = useRouter();
  const { userId, profile, loading } = useSession();
  const [email, setEmail] = React.useState<string | null>(null);
  const [emailLoaded, setEmailLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const supa = getSupabaseBrowser();
      if (!supa) return;
      const { data: { session } } = await supa.auth.getSession();
      setEmail(session?.user?.email ?? null);
      setEmailLoaded(true);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  async function signOut() {
    const supa = getSupabaseBrowser();
    if (supa) await supa.auth.signOut();
    router.push("/signin");
  }

  return (
    <div className="max-w-3xl mx-auto">
      <header>
        <p className="eyebrow">Account settings</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-tight">
          Your account.
        </h1>
        <p className="text-ink2 mt-2">
          Sign-in details, privacy, and account closure live here.
          For profile content (bio, photos, prompts) head to{" "}
          <Link href="/profile/edit" className="text-terracotta hover:underline">Edit profile</Link>.
        </p>
      </header>

      <div className="mt-8 space-y-6">
        {/* Account */}
        <section className="surface p-6">
          <h2 className="font-display text-2xl">Account</h2>
          <p className="text-ink3 text-sm mt-1">Sign-in email and password.</p>

          <div className="mt-5 space-y-5">
            <Field label="Email" hint="To change your email, you'll get a confirmation link sent to the new address.">
              <Input value={email ?? ""} disabled />
            </Field>
            <ChangeEmailForm />
            <ChangePasswordForm />
          </div>

          <div className="mt-6 pt-5 border-t border-line">
            <Button variant="outline" onClick={signOut} size="sm">
              <Icon name="arrowLeft" size={14} /> Sign out
            </Button>
          </div>
        </section>

        {/* Danger zone */}
        <section className="surface p-6 border border-crisis/30">
          <h2 className="font-display text-2xl text-crisis">Closing your account</h2>
          <p className="text-ink2 text-sm mt-2 max-w-prose">
            You can deactivate your account at any time — your profile is hidden
            from the network and from Tribes, but your data is retained for 30
            days in case you change your mind. If you want your data permanently
            deleted after that, request it below and we'll process it manually
            within 30 days.
          </p>

          <DeactivateAccount
            userId={userId}
            deactivatedAt={(profile as any)?.deactivated_at ?? null}
          />

          <div className="mt-6 pt-5 border-t border-line">
            <DeleteAccountRequest userId={userId} email={email} />
          </div>
        </section>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Email change
// ──────────────────────────────────────────────────────────────────
function ChangeEmailForm() {
  const [open, setOpen] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null); setErr(null);
    try {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { error } = await supa.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      setMsg("Check both your old and new inboxes — Supabase sends a confirmation link.");
      setOpen(false);
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't update email.");
    } finally { setBusy(false); }
  }

  if (!open) {
    return (
      <>
        <button onClick={() => setOpen(true)} className="text-sm text-terracotta hover:underline">
          Change email
        </button>
        {msg && <p className="text-sm text-forest mt-1">{msg}</p>}
      </>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-line p-3 space-y-3">
      <Field label="New email">
        <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
      </Field>
      {err && <p className="text-sm text-crisis">{err}</p>}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => setOpen(false)} type="button">Cancel</Button>
        <Button size="sm" type="submit" disabled={busy || newEmail.trim().length < 5}>
          {busy ? "Sending…" : "Send confirmation"}
        </Button>
      </div>
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────
// Password change
// ──────────────────────────────────────────────────────────────────
function ChangePasswordForm() {
  const [open, setOpen] = React.useState(false);
  const [pass, setPass] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pass !== confirm) { setErr("Passwords don't match."); return; }
    if (pass.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setBusy(true); setMsg(null); setErr(null);
    try {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { error } = await supa.auth.updateUser({ password: pass });
      if (error) throw error;
      setMsg("Password updated.");
      setPass(""); setConfirm(""); setOpen(false);
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't update password.");
    } finally { setBusy(false); }
  }

  if (!open) {
    return (
      <>
        <button onClick={() => setOpen(true)} className="text-sm text-terracotta hover:underline">
          Change password
        </button>
        {msg && <p className="text-sm text-forest mt-1">{msg}</p>}
      </>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-line p-3 space-y-3">
      <Field label="New password" hint="At least 8 characters">
        <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} minLength={8} required />
      </Field>
      <Field label="Confirm new password">
        <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </Field>
      {err && <p className="text-sm text-crisis">{err}</p>}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => setOpen(false)} type="button">Cancel</Button>
        <Button size="sm" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Update password"}
        </Button>
      </div>
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────
// Deactivate
// ──────────────────────────────────────────────────────────────────
function DeactivateAccount({ userId, deactivatedAt }: { userId: string | null; deactivatedAt: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const isDeactivated = !!deactivatedAt;

  async function toggle() {
    if (!userId) return;
    setBusy(true); setErr(null);
    try {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const next = isDeactivated ? null : new Date().toISOString();
      const { error } = await supa.from("profiles").update({ deactivated_at: next }).eq("id", userId);
      if (error) throw error;
      if (!isDeactivated) {
        // Just deactivated — sign out and go to landing
        await supa.auth.signOut();
        router.push("/");
      } else {
        router.refresh();
      }
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't update account.");
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-5">
      <h3 className="font-display text-lg">{isDeactivated ? "Reactivate account" : "Deactivate account"}</h3>
      <p className="text-sm text-ink2 mt-1">
        {isDeactivated
          ? "Your account is currently hidden from the network. Reactivate to make your profile visible again."
          : "Hides your profile from the network and from other members. You can come back any time within 30 days to reactivate."}
      </p>
      {err && <p className="text-sm text-crisis mt-2">{err}</p>}
      <div className="mt-3">
        <Button
          variant={isDeactivated ? "primary" : "outline"}
          size="sm"
          onClick={toggle}
          disabled={busy}
        >
          {busy ? "Working…" : isDeactivated ? "Reactivate account" : "Deactivate account"}
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Request permanent deletion
// ──────────────────────────────────────────────────────────────────
function DeleteAccountRequest({ userId, email }: { userId: string | null; email: string | null }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function submit() {
    if (!userId) return;
    setBusy(true); setErr(null);
    try {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { error } = await (supa as any).from("account_deletion_requests").insert({
        user_id: userId,
        email,
        reason: reason.trim() || null,
      });
      if (error) throw error;
      setDone(true);
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't submit request.");
    } finally { setBusy(false); }
  }

  if (done) {
    return (
      <div className="rounded-md bg-forest/10 border border-forest/30 px-4 py-3 text-sm">
        <strong>Request received.</strong> We'll process your permanent deletion
        within 30 days. You'll get an email confirmation once it's complete.
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display text-lg text-crisis">Request permanent deletion</h3>
      <p className="text-sm text-ink2 mt-1">
        This will queue your account for permanent removal. We'll keep your data
        for up to 30 days in case you change your mind, then delete it from our
        systems. Some data may be retained where legally required (e.g.
        safeguarding records).
      </p>

      {open ? (
        <div className="mt-3 rounded-md border border-line p-3 space-y-3">
          <Field label="Why are you leaving? (optional)" hint="Helps us understand what to improve.">
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
            />
          </Field>
          {err && <p className="text-sm text-crisis">{err}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" variant="danger" onClick={submit} disabled={busy}>
              {busy ? "Submitting…" : "Confirm deletion request"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Request permanent deletion
          </Button>
        </div>
      )}
    </div>
  );
}
