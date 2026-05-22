-- 015_profile_visibility_audit.sql
-- Make sure every profile-display-relevant table has proper SELECT policies
-- so visiting a member's profile shows everything they've chosen to share.
--
-- Tables covered:
--   profiles         — alias, bio, avatar, location, descent, languages,
--                      tags, social links, accepts_*, etc. (real_name is in
--                      this table but app code never surfaces it; admin-only
--                      access still relies on the service role for now)
--   profile_prompts  — answers with per-row visibility (public/tribe/private)
--   profile_media    — photos & videos
--   posts (wall)     — left UNCHANGED; visibility is the user's per-post
--                      choice and should remain restrictive (migration 006)

-- ─────────────────────────────────────────────────────────────
-- profiles — anyone signed in can read any profile row
-- ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

do $$ declare pol record; begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', pol.policyname);
  end loop;
end $$;

create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- (no delete policy — users don't delete their own profile via the app)

-- ─────────────────────────────────────────────────────────────
-- profile_prompts — owner always, others when visibility is public/tribe
-- ─────────────────────────────────────────────────────────────
alter table public.profile_prompts enable row level security;

do $$ declare pol record; begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'profile_prompts'
  loop
    execute format('drop policy if exists %I on public.profile_prompts', pol.policyname);
  end loop;
end $$;

create policy "profile_prompts_select"
  on public.profile_prompts for select
  to authenticated
  using (
    user_id = auth.uid()
    or visibility in ('public', 'tribe')
  );

create policy "profile_prompts_insert"
  on public.profile_prompts for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "profile_prompts_update"
  on public.profile_prompts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "profile_prompts_delete"
  on public.profile_prompts for delete
  to authenticated
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- profile_media — open SELECT (everyone signed in can see gallery items)
-- Owner-only mutate. Flagged items hidden in the app via the hook filter.
-- ─────────────────────────────────────────────────────────────
alter table public.profile_media enable row level security;

do $$ declare pol record; begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'profile_media'
  loop
    execute format('drop policy if exists %I on public.profile_media', pol.policyname);
  end loop;
end $$;

create policy "profile_media_select"
  on public.profile_media for select
  to authenticated
  using (true);

create policy "profile_media_insert"
  on public.profile_media for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "profile_media_update"
  on public.profile_media for update
  to authenticated
  using (owner_id = auth.uid());

create policy "profile_media_delete"
  on public.profile_media for delete
  to authenticated
  using (owner_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- NOTE: wall posts (public.posts) intentionally NOT touched.
-- Each post has a per-row visibility that the user chose at compose time
-- (public / tribe / private). The policies in migration 006 already
-- enforce that correctly and changing them would override user intent.
-- ─────────────────────────────────────────────────────────────
