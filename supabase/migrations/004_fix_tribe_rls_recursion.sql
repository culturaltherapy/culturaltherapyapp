-- 004_fix_tribe_rls_recursion.sql
-- The tribe_members RLS policies in migration 001 self-reference
-- (a SELECT policy that subqueries tribe_members), which Postgres detects
-- as infinite recursion. We replace them with a SECURITY DEFINER helper
-- function that bypasses RLS for the membership check.

-- ────────────────────────────────────────────────────────────────────────────
-- Helper: returns true if a user is a member of a given tribe.
-- SECURITY DEFINER means RLS is bypassed inside the function body, so
-- calling it from within a tribe_members RLS policy does NOT recurse.
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.is_tribe_member(
  p_tribe_id uuid,
  p_user_id  uuid default auth.uid()
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
      from public.tribe_members
     where tribe_id = p_tribe_id
       and user_id  = p_user_id
  );
$$;

grant execute on function public.is_tribe_member(uuid, uuid) to anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- Drop all existing policies on tribe_members so we can recreate cleanly.
-- (Names from migration 001 may vary — we drop common ones defensively.)
-- ────────────────────────────────────────────────────────────────────────────
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'tribe_members'
  loop
    execute format('drop policy if exists %I on public.tribe_members', pol.policyname);
  end loop;
end $$;

-- ────────────────────────────────────────────────────────────────────────────
-- Recreate policies using the helper. No subquery on tribe_members from
-- inside a tribe_members policy, so no recursion.
-- ────────────────────────────────────────────────────────────────────────────

-- You can see your own memberships, plus the membership rows of any tribe
-- you're already in (so "view all members of this tribe" works).
create policy "tribe_members_select"
  on public.tribe_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_tribe_member(tribe_id)
  );

-- You can only insert a row that puts YOU into a tribe.
-- Owners/mods accepting requests is handled elsewhere via service-role.
create policy "tribe_members_insert_self"
  on public.tribe_members for insert
  to authenticated
  with check (user_id = auth.uid());

-- You can only remove your own membership (leave a tribe).
create policy "tribe_members_delete_self"
  on public.tribe_members for delete
  to authenticated
  using (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- While we're here, make sure the tribes table policies also don't recurse.
-- A tribe should be visible if the user is a member OR the owner.
-- We rebuild the SELECT policy on tribes to use the same helper.
-- ────────────────────────────────────────────────────────────────────────────
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'tribes'
  loop
    execute format('drop policy if exists %I on public.tribes', pol.policyname);
  end loop;
end $$;

create policy "tribes_select"
  on public.tribes for select
  to authenticated
  using (
    owner_id = auth.uid()
    or public.is_tribe_member(id)
  );

create policy "tribes_insert_owner"
  on public.tribes for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "tribes_update_owner"
  on public.tribes for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "tribes_delete_owner"
  on public.tribes for delete
  to authenticated
  using (owner_id = auth.uid());
