-- 023_fix_mod_reports_insert_rls.sql
-- Hotfix. The original mod_reports INSERT policy (migration 001, named
-- "mod_reports: anyone can insert" with the colon in the name) was either
-- not applied or has been dropped at some point. End-users hit
-- "new row violates row-level security policy for table 'mod_reports'"
-- when trying to file a report.
--
-- This migration drops every policy on the table and re-creates a clean
-- set:
--   - INSERT: any signed-in user can file a report against themselves
--   - SELECT / UPDATE: moderators only (re-asserted from migration 022)
--
-- Safe to re-run; entirely idempotent.

alter table public.mod_reports enable row level security;

do $$ declare pol record; begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'mod_reports'
  loop
    execute format('drop policy if exists %I on public.mod_reports', pol.policyname);
  end loop;
end $$;

-- Reporters can file their own reports.
create policy "mod_reports_insert_self"
  on public.mod_reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

-- Moderators read everything.
create policy "mod_reports_select_moderator"
  on public.mod_reports for select
  to authenticated
  using (public.is_moderator(auth.uid()));

-- Moderators update status / notes.
create policy "mod_reports_update_moderator"
  on public.mod_reports for update
  to authenticated
  using (public.is_moderator(auth.uid()))
  with check (public.is_moderator(auth.uid()));

-- Make sure the authenticated role has the underlying table grants. In
-- Supabase these are usually set automatically, but if the table was
-- created via raw SQL the grants might not be there.
grant insert, select, update on public.mod_reports to authenticated;
