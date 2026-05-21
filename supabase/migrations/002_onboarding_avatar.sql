-- 002_onboarding_avatar.sql
-- Adds explicit onboarding completion tracking, stops the auto-trigger from
-- guessing an alias from email, and creates the avatars storage bucket.

-- ────────────────────────────────────────────────────────────────────────────
-- 1) Track onboarding completion explicitly (don't infer from alias presence)
-- ────────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz default null;

-- ────────────────────────────────────────────────────────────────────────────
-- 2) Fix the new-user trigger so it stops setting alias from email prefix.
--    Now it ONLY creates the row with the user's id — every other field is
--    null/default until onboarding fills it in.
-- ────────────────────────────────────────────────────────────────────────────
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
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────────────────────
-- 3) Relax the NOT NULL constraint on alias so the trigger can insert rows
--    without one. Alias is set during onboarding step 2; until then it stays null.
-- ────────────────────────────────────────────────────────────────────────────
alter table public.profiles
  alter column alias drop not null;

-- Reset any auto-generated aliases on profiles that haven't completed
-- onboarding yet (so the gate redirects existing email-prefix profiles
-- back through onboarding).
update public.profiles
   set alias = null
 where onboarding_completed_at is null;

-- ────────────────────────────────────────────────────────────────────────────
-- 4) Avatars storage bucket — public read, owner-only write/update/delete.
--    Files are stored under {user_id}/avatar.{ext}
-- ────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,                                  -- 5 MB cap
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Drop existing policies (in case this migration re-runs)
drop policy if exists "Avatars are publicly readable" on storage.objects;
drop policy if exists "Users can upload their own avatar"  on storage.objects;
drop policy if exists "Users can update their own avatar"  on storage.objects;
drop policy if exists "Users can delete their own avatar"  on storage.objects;

create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
