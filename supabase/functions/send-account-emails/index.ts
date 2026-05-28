// Supabase Edge Function — sends queued account emails via Resend.
//
// Deploy with:
//   supabase functions deploy send-account-emails --no-verify-jwt
//
// Set secrets:
//   supabase secrets set RESEND_API_KEY=<your-resend-key>
//   supabase secrets set EMAIL_FROM="Cultural Therapy <hello@yourverifieddomain.com>"
//
// Until you verify a domain in Resend, EMAIL_FROM can stay unset and we'll
// use Resend's free dev sender (onboarding@resend.dev). Once you verify
// culturaltherapyapp.com (or another domain), set EMAIL_FROM to the
// verified address so emails come from your brand.

// deno-lint-ignore-file no-explicit-any
// @ts-nocheck — runs in Deno on Supabase Edge, not in the Next.js build.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FROM = Deno.env.get("EMAIL_FROM") ?? "Cultural Therapy <onboarding@resend.dev>";
const APP_URL = Deno.env.get("APP_URL") ?? "https://culturaltherapyapp.vercel.app";

const BRAND = {
  parchment: "#f4ece1",
  bone:      "#faf5ec",
  ink:       "#1c1612",
  ink2:      "#3d342c",
  ink3:      "#7a6a5d",
  terracotta:"#b3563a",
  forest:    "#2f4a32",
  line:      "#e6dcce",
};

function shell(title: string, body: string, cta?: { label: string; href: string }) {
  return `<!doctype html>
<html><head><meta charset="utf-8" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:${BRAND.parchment};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${BRAND.ink};">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="background:${BRAND.bone};border:1px solid ${BRAND.line};border-radius:16px;padding:32px 28px;">
      <h1 style="font-family:'DM Serif Display',Georgia,serif;font-size:28px;line-height:1.15;margin:0 0 16px 0;color:${BRAND.ink};">${title}</h1>
      <div style="font-size:15px;line-height:1.6;color:${BRAND.ink2};">${body}</div>
      ${cta ? `
        <div style="margin-top:28px;">
          <a href="${cta.href}" style="display:inline-block;background:${BRAND.ink};color:${BRAND.bone};text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px;">${cta.label}</a>
        </div>
      ` : ""}
    </div>
    <p style="text-align:center;color:${BRAND.ink3};font-size:12px;margin:20px 0 0 0;">
      Cultural Therapy · B.L.E.S.S — Building Lived Experience Support Systems<br/>
      <a href="${APP_URL}" style="color:${BRAND.terracotta};">${APP_URL.replace(/^https?:\/\//, "")}</a>
    </p>
  </div>
</body></html>`;
}

type Tpl = { subject: string | ((p: any) => string); html: (payload: any) => string };

const TEMPLATES: Record<string, Tpl> = {
  account_deactivated: {
    subject: "Your Cultural Therapy account is deactivated",
    html: (_p) =>
      shell(
        "Your account is deactivated.",
        `<p>You've deactivated your Cultural Therapy account. Your profile is now hidden from the network, your Tribes, and other members.</p>
         <p><strong>Your data is kept for 30 days</strong> in case you change your mind. To come back, just sign in and we'll reactivate your account immediately.</p>
         <p>If you didn't do this, sign in straight away to reactivate — and consider changing your password from <em>Account settings → Change password</em>.</p>`,
        { label: "Come back when you're ready", href: `${APP_URL}/signin` }
      ),
  },
  account_reactivated: {
    subject: "Welcome back to Cultural Therapy",
    html: (_p) =>
      shell(
        "Welcome back.",
        `<p>Your account has been reactivated. Your profile is visible to the network again, and you can pick up where you left off.</p>
         <p>If you didn't do this, please contact us straight away.</p>`,
        { label: "Open Cultural Therapy", href: `${APP_URL}/home` }
      ),
  },
  deletion_requested: {
    subject: "We've received your deletion request",
    html: (p) =>
      shell(
        "We've received your request.",
        `<p>You've asked us to permanently delete your Cultural Therapy account.</p>
         <p>We'll keep your data for up to <strong>30 days</strong> so you can change your mind. After that, we'll permanently delete your profile, photos, prompts, wall posts, comments, messages, and connections from our systems. Some safeguarding-related records may be retained where legally required.</p>
         ${p?.reason ? `<p style="margin-top:18px;background:${BRAND.parchment};border-left:3px solid ${BRAND.terracotta};padding:10px 14px;border-radius:6px;"><strong>You told us:</strong><br/>${escapeHtml(p.reason)}</p>` : ""}
         <p style="margin-top:18px;">If you change your mind, just sign in and your account will be restored automatically — no action needed beyond signing back in within 30 days.</p>`,
        { label: "Sign back in to cancel", href: `${APP_URL}/signin` }
      ),
  },
  deletion_completed: {
    subject: "Your Cultural Therapy account has been deleted",
    html: (_p) =>
      shell(
        "Your account is deleted.",
        `<p>As requested, your Cultural Therapy account and associated data have been permanently deleted from our systems.</p>
         <p>Thank you for being part of this community, however briefly. We wish you well.</p>
         <p style="color:${BRAND.ink3};font-size:13px;margin-top:24px;">If you ever want to come back, you're always welcome to sign up again with a fresh account.</p>`,
        undefined
      ),
  },
  direct_message: {
    subject: (p) => `You have a new message from ${p?.sender_alias ?? "a member"}`,
    html: (p) => {
      const alias = escapeHtml(p?.sender_alias ?? "A member");
      const excerpt = escapeHtml(p?.excerpt ?? "");
      const threadId = p?.thread_id;
      const href = threadId ? `${APP_URL}/messages/${threadId}` : `${APP_URL}/messages`;
      return shell(
        `${alias} sent you a message.`,
        `<p>You've got a new direct message on Cultural Therapy.</p>
         ${excerpt ? `<p style="margin-top:14px;background:${BRAND.parchment};border-left:3px solid ${BRAND.terracotta};padding:10px 14px;border-radius:6px;font-style:italic;">${excerpt}</p>` : ""}
         <p style="color:${BRAND.ink3};font-size:13px;margin-top:24px;">You can switch these emails off any time in <em>Profile → Edit → Contact preferences</em>.</p>`,
        { label: `Reply to ${alias}`, href }
      );
    },
  },
  report_crisis: {
    subject: (_p) => `🚨 Crisis-severity report on Cultural Therapy`,
    html: (p) => {
      const targetKind = escapeHtml(String(p?.target_kind ?? "content"));
      const targetTable = escapeHtml(String(p?.target_table ?? ""));
      const reason = escapeHtml(String(p?.reason ?? "crisis"));
      const notes = escapeHtml(String(p?.notes ?? ""));
      const href = `${APP_URL}/admin/moderation`;
      return shell(
        "A crisis-severity report just came in.",
        `<p>A member has filed a <strong>crisis-severity</strong> report on Cultural Therapy. This needs a moderator to look at it within 15 minutes.</p>
         <ul style="margin-top:14px;padding:0 0 0 18px;color:${BRAND.ink2};">
           <li><strong>Target:</strong> ${targetKind}${targetTable ? ` (<code style="font-family:monospace;font-size:13px;">${targetTable}</code>)` : ""}</li>
           <li><strong>Reason:</strong> ${reason}</li>
         </ul>
         ${notes ? `<p style="margin-top:14px;background:${BRAND.parchment};border-left:3px solid ${BRAND.terracotta};padding:10px 14px;border-radius:6px;font-style:italic;">${notes}</p>` : ""}
         <p style="color:${BRAND.ink3};font-size:13px;margin-top:24px;">You're receiving this because you're listed as a moderator on Cultural Therapy.</p>`,
        { label: "Open the moderation queue", href }
      );
    },
  },
};

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

Deno.serve(async (req: Request) => {
  if (!RESEND_API_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing RESEND_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Drain up to 25 unsent rows
  const { data: emails, error: selErr } = await supabase
    .from("account_email_queue")
    .select("id, to_email, template, payload, attempts")
    .is("sent_at", null)
    .lt("attempts", 5)
    .order("created_at", { ascending: true })
    .limit(25);

  if (selErr) {
    return new Response(JSON.stringify({ error: selErr.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  if (!emails || emails.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: { "content-type": "application/json" },
    });
  }

  let sent = 0;
  const failures: { id: string; reason: string }[] = [];

  for (const e of emails) {
    const tpl = TEMPLATES[e.template];
    if (!tpl) {
      failures.push({ id: e.id, reason: `unknown template '${e.template}'` });
      await supabase
        .from("account_email_queue")
        .update({ attempts: (e.attempts ?? 0) + 1 })
        .eq("id", e.id);
      continue;
    }

    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${RESEND_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: e.to_email,
          subject: typeof tpl.subject === "function" ? tpl.subject(e.payload ?? {}) : tpl.subject,
          html: tpl.html(e.payload ?? {}),
        }),
      });

      if (r.ok) {
        await supabase
          .from("account_email_queue")
          .update({ sent_at: new Date().toISOString() })
          .eq("id", e.id);
        sent++;
      } else {
        const errText = await r.text().catch(() => "");
        failures.push({ id: e.id, reason: `resend ${r.status} ${errText}` });
        await supabase
          .from("account_email_queue")
          .update({ attempts: (e.attempts ?? 0) + 1 })
          .eq("id", e.id);
      }
    } catch (err: any) {
      failures.push({ id: e.id, reason: err?.message ?? "throw" });
      await supabase
        .from("account_email_queue")
        .update({ attempts: (e.attempts ?? 0) + 1 })
        .eq("id", e.id);
    }
  }

  return new Response(JSON.stringify({ processed: emails.length, sent, failures }), {
    headers: { "content-type": "application/json" },
  });
});
