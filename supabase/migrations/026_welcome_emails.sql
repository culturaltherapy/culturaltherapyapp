-- 026_welcome_emails.sql
-- Two new "welcome" emails sent through the existing Resend queue:
--   welcome_signup      — lightweight ack the moment an account is created
--                          (email/password OR Google — fires from the
--                          auth.users trigger so it doesn't depend on a
--                          session existing yet)
--   welcome_onboarding  — fuller welcome once onboarding_completed_at is set

-- ─────────────────────────────────────────────────────────────
-- 1) Allow the two new template values
-- ─────────────────────────────────────────────────────────────
alter table public.account_email_queue
  drop constraint if exists account_email_queue_template_check;

alter table public.account_email_queue
  add constraint account_email_queue_template_check
  check (template in (
    'account_deactivated',
    'account_reactivated',
    'deletion_requested',
    'deletion_completed',
    'direct_message',
    'report_crisis',
    'welcome_signup',
    'welcome_onboarding'
  ));

-- ─────────────────────────────────────────────────────────────
-- 2) Queue welcome_signup the moment auth.users gets a new row.
--    security definer so it bypasses account_email_queue RLS — a fresh
--    email/password signup has no session yet (confirmation pending), so
--    it couldn't insert into the queue itself.
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  if new.email is not null then
    insert into public.account_email_queue (user_id, to_email, template)
    values (new.id, new.email, 'welcome_signup');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
