-- 018_admin_and_cleanup.sql
-- 1) Ensure deleting an auth.users row cascades to all their data, so admin
--    deletions in the Supabase dashboard properly clean up the public schema
--    (profile, prompts, media, posts, messages, etc).
-- 2) Migrate existing profiles.country values from short codes ('GB', 'US')
--    to full country names ('United Kingdom', 'United States') so the new
--    searchable picker can roundtrip cleanly.
-- 3) Admin-friendly view 'profiles_overview' that shows email + status
--    (active / deactivated / incomplete) at a glance.
-- 4) account_email_queue table so the app can record an email to send on
--    deactivation / deletion (actual SMTP / Resend / SendGrid integration
--    happens in an Edge Function — this just queues the request).

-- ─────────────────────────────────────────────────────────────
-- 1) Cascade deletes everywhere that references auth.users(id)
-- ─────────────────────────────────────────────────────────────
do $$
declare r record;
begin
  for r in
    select tc.table_name, tc.constraint_name, kcu.column_name
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on tc.constraint_name = kcu.constraint_name
       and tc.table_schema   = kcu.table_schema
      join information_schema.referential_constraints rc
        on tc.constraint_name = rc.constraint_name
       and tc.table_schema   = rc.constraint_schema
      join information_schema.constraint_column_usage ccu
        on rc.unique_constraint_name = ccu.constraint_name
       and rc.unique_constraint_schema = ccu.table_schema
     where tc.constraint_type = 'FOREIGN KEY'
       and tc.table_schema = 'public'
       and ccu.table_schema = 'auth'
       and ccu.table_name  = 'users'
       and rc.delete_rule <> 'CASCADE'
  loop
    execute format(
      'alter table public.%I drop constraint %I',
      r.table_name, r.constraint_name
    );
    execute format(
      'alter table public.%I add constraint %I foreign key (%I) references auth.users(id) on delete cascade',
      r.table_name, r.constraint_name, r.column_name
    );
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 2) Country code → full name migration
-- ─────────────────────────────────────────────────────────────
update public.profiles set country = case country
  when 'GB' then 'United Kingdom'
  when 'US' then 'United States'
  when 'CA' then 'Canada'
  when 'NG' then 'Nigeria'
  when 'GH' then 'Ghana'
  when 'JM' then 'Jamaica'
  when 'ZA' then 'South Africa'
  when 'KE' then 'Kenya'
  when 'ZW' then 'Zimbabwe'
  when 'OT' then 'Other'
  else country
end
where country in ('GB','US','CA','NG','GH','JM','ZA','KE','ZW','OT');

-- ─────────────────────────────────────────────────────────────
-- 3) Admin overview view
-- ─────────────────────────────────────────────────────────────
create or replace view public.profiles_overview as
select
  p.id,
  u.email,
  p.alias,
  p.country,
  p.created_at,
  p.onboarding_completed_at,
  p.deactivated_at,
  case
    when p.deactivated_at is not null then 'deactivated'
    when p.onboarding_completed_at is null then 'incomplete'
    else 'active'
  end as status,
  exists (select 1 from public.account_deletion_requests adr where adr.user_id = p.id and adr.processed_at is null) as pending_deletion_request
from public.profiles p
left join auth.users u on u.id = p.id
order by p.created_at desc;

comment on view public.profiles_overview is
  'Admin-only view of all profiles with email + status column. Query in the Supabase dashboard to triage incomplete / deactivated / deletion-requested accounts. Restricted to service role; the JS client cannot SELECT this.';

-- The view inherits permissions from its base tables; revoke broad access
-- so only service_role can read it. (Useful in the Supabase dashboard.)
revoke all on public.profiles_overview from anon, authenticated;
grant  select on public.profiles_overview to service_role;

-- ─────────────────────────────────────────────────────────────
-- 4) Email queue (for deactivation / deletion confirmation emails)
--    Real SMTP integration is a follow-up Edge Function.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.account_email_queue (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  to_email    text not null,
  template    text not null check (template in (
    'account_deactivated',
    'account_reactivated',
    'deletion_requested',
    'deletion_completed'
  )),
  payload     jsonb not null default '{}'::jsonb,
  sent_at     timestamptz,
  attempts    smallint not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists account_email_queue_pending
  on public.account_email_queue (created_at)
  where sent_at is null;

alter table public.account_email_queue enable row level security;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='account_email_queue' loop
    execute format('drop policy if exists %I on public.account_email_queue', pol.policyname);
  end loop;
end $$;

-- Users can queue an email about themselves (deactivation / deletion request).
-- No one can SELECT the queue except service_role (admins).
create policy "queue_insert_self"
  on public.account_email_queue for insert
  to authenticated
  with check (user_id = auth.uid());

grant insert on public.account_email_queue to authenticated;
