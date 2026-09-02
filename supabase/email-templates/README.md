# Supabase Auth email templates

Reskinned versions of Supabase's built-in auth emails (confirm signup,
reset password, magic link) so they match the branded look of the
Resend-sent emails in `supabase/functions/send-account-emails`. These are
**not** sent through Resend directly — Supabase's Auth service sends them
itself, using whatever SMTP settings and template HTML you configure in
the dashboard. There's no code path for these; it's all dashboard config.

## 1. Point Supabase's Auth SMTP at Resend

By default Supabase uses its own rate-limited (2/hour) built-in mailer,
fine for local dev but not for real users. Switch to your Resend account:

**Dashboard → Project Settings → Authentication → SMTP Settings**

- Enable custom SMTP
- Host: `smtp.resend.com`
- Port: `465` (or `587`)
- Username: `resend`
- Password: your `RESEND_API_KEY` (same one used by the Edge Function)
- Sender email / name: same verified address as `EMAIL_FROM` in the Edge
  Function secrets (e.g. `hello@culturaltherapyapp.com`) — must be on a
  domain you've verified in Resend, or sends will fail

## 2. Paste in the branded templates

**Dashboard → Authentication → Email Templates**

| Template            | File                    |
| -------------------- | ------------------------ |
| Confirm signup        | `confirm-signup.html`   |
| Reset Password         | `reset-password.html`   |
| Magic Link              | `magic-link.html`       |

For each: open the file, copy the full HTML, paste it into the
"Message body" field for that template, save. Leave the Subject field as
whatever you want it to read (Supabase doesn't take the subject from the
HTML).

`{{ .ConfirmationURL }}` and `{{ .SiteURL }}` are Supabase's own template
variables — leave them exactly as-is, don't rename them.

## Templates intentionally not included

`Invite user`, `Change Email Address`, and `Reauthentication` aren't used
anywhere in the app yet (no invite flow, no email-change UI, no MFA
reauth). If you add one of those flows later, copy the pattern from
`reset-password.html` — same brand colors, same shell.
