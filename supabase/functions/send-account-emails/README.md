# `send-account-emails` Edge Function

Sends queued rows from `public.account_email_queue` via Resend.

## One-time setup

You need the Supabase CLI installed:

```bash
npm install -g supabase
```

Then from the repo root:

```bash
# 1. Log in
supabase login

# 2. Link this directory to your project (you only do this once)
supabase link --project-ref euwkeoktvdfqkwftkxxl

# 3. Set the Resend API key and (optionally) the From address
supabase secrets set RESEND_API_KEY=<your-resend-key>

# Until you verify a domain in Resend, leave EMAIL_FROM unset. It will
# fall back to Resend's free dev sender (onboarding@resend.dev).
# Once you verify culturaltherapyapp.com (or another domain), set it:
# supabase secrets set EMAIL_FROM="Cultural Therapy <hello@culturaltherapyapp.com>"

# 4. Deploy the function. --no-verify-jwt so the app's anon client can invoke it.
supabase functions deploy send-account-emails --no-verify-jwt
```

## How it works

- The app inserts a row into `public.account_email_queue` (via
  `lib/email-queue.ts`) and immediately calls `supabase.functions.invoke(...)`
- The function selects up to 25 unsent rows (`sent_at IS NULL AND attempts < 5`),
  formats each based on `template`, and POSTs to Resend's API
- Successful sends mark `sent_at = now()`; failures increment `attempts`
- Rows that hit 5 failed attempts are skipped (admin can inspect and retry)

## Templates currently supported

- `account_deactivated`
- `account_reactivated`
- `deletion_requested`
- `deletion_completed` (sent by admin when manually fulfilling a request)

## Manually drain the queue

If you ever want to flush pending emails outside of a user action (e.g. after
deploying for the first time, or recovering from an outage), hit the function
URL directly:

```bash
curl -X POST https://euwkeoktvdfqkwftkxxl.supabase.co/functions/v1/send-account-emails \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>"
```

## Optional — schedule it for safety

If you want pending emails to drain automatically even when the app isn't
running, enable `pg_cron` in the Supabase dashboard and schedule:

```sql
select cron.schedule(
  'drain-account-emails',
  '* * * * *', -- every minute
  $$
  select net.http_post(
    url := 'https://euwkeoktvdfqkwftkxxl.supabase.co/functions/v1/send-account-emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

For v1 the in-app invoke is enough — only enable cron if you want the safety net.

## Verifying a domain in Resend (later)

Once Cultural Therapy has a domain you want emails to come from:

1. In the Resend dashboard → **Domains** → **Add domain**
2. Add the DNS records they show you to your domain registrar (SPF, DKIM)
3. Wait for verification to flip to "Verified"
4. Update the secret:
   ```bash
   supabase secrets set EMAIL_FROM="Cultural Therapy <hello@culturaltherapyapp.com>"
   ```
5. Re-deploy: `supabase functions deploy send-account-emails --no-verify-jwt`

Until then, emails come from `onboarding@resend.dev` — they'll deliver fine
but may land in spam for some recipients.
