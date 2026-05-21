-- 006_post_rls.sql
-- RLS for the posts table — wall posts on a user's profile.
-- Visibility model:
--   public  — anyone signed in can read
--   tribe   — only people who share at least one tribe with the owner
--   village — tied to a specific village_id (column), only that village's members
--   private — only the owner

alter table public.posts enable row level security;

-- Clean slate for posts policies
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'posts'
  loop
    execute format('drop policy if exists %I on public.posts', pol.policyname);
  end loop;
end $$;

-- Owner can always see their own posts
create policy "posts_select_own"
  on public.posts for select
  to authenticated
  using (owner_id = auth.uid());

-- Anyone signed in can see public posts
create policy "posts_select_public"
  on public.posts for select
  to authenticated
  using (visibility = 'public');

-- Tribe-visibility posts: viewer must share at least one tribe with the owner
create policy "posts_select_tribe"
  on public.posts for select
  to authenticated
  using (
    visibility = 'tribe'
    and exists (
      select 1
        from public.tribe_members tm_owner
        join public.tribe_members tm_viewer
          on tm_owner.tribe_id = tm_viewer.tribe_id
       where tm_owner.user_id  = posts.owner_id
         and tm_viewer.user_id = auth.uid()
    )
  );

-- Village-visibility posts: only members of the post's village
create policy "posts_select_village"
  on public.posts for select
  to authenticated
  using (
    visibility = 'village'
    and village_id is not null
    and public.is_tribe_member(village_id)
  );

-- You can only insert posts as yourself
create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (owner_id = auth.uid());

-- You can only update your own posts (and update sets edited_at)
create policy "posts_update_own"
  on public.posts for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- You can only delete your own posts
create policy "posts_delete_own"
  on public.posts for delete
  to authenticated
  using (owner_id = auth.uid());
