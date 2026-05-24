-- 017_v2_feedback.sql
-- Schema updates for the v2 feedback pass:
--   - peer_supporter_signups.phone (required at app level; nullable at DB
--     level so existing rows aren't broken)
--   - profiles.deactivated_at for soft-delete
--   - account_deletion_requests for the "please permanently delete me" flow

alter table public.peer_supporter_signups
  add column if not exists phone text;

alter table public.profiles
  add column if not exists deactivated_at timestamptz;

-- ─────────────────────────────────────────────────────────────
-- Hide deactivated profiles from network queries
-- (we update the existing profiles SELECT policy to filter them out
-- for non-owners; owners still see their own row so they can reactivate)
-- ─────────────────────────────────────────────────────────────
do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='profiles' and cmd='SELECT' loop
    execute format('drop policy if exists %I on public.profiles', pol.policyname);
  end loop;
end $$;

create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (deactivated_at is null or id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- Account deletion request queue
-- ─────────────────────────────────────────────────────────────
create table if not exists public.account_deletion_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  email       text,
  reason      text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (user_id) -- one pending request per user
);

alter table public.account_deletion_requests enable row level security;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='account_deletion_requests' loop
    execute format('drop policy if exists %I on public.account_deletion_requests', pol.policyname);
  end loop;
end $$;

-- Owners can see and create their own request; service role handles fulfillment
create policy "deletion_requests_select_self"
  on public.account_deletion_requests for select to authenticated
  using (user_id = auth.uid());

create policy "deletion_requests_insert_self"
  on public.account_deletion_requests for insert to authenticated
  with check (user_id = auth.uid());

create policy "deletion_requests_delete_self"
  on public.account_deletion_requests for delete to authenticated
  using (user_id = auth.uid() and processed_at is null);
