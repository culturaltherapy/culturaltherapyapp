-- 014_profile_prompts_visibility_rls.sql
-- profile_prompts SELECT was locked to the owner (the default RLS from
-- migration 001). That hides prompts from other members, which breaks the
-- whole "prompts are the main thing visitors see" intent.
--
-- New model — owners always see their own; everyone else sees prompts
-- with visibility 'public' or 'tribe'. ('private' stays owner-only.)

alter table public.profile_prompts enable row level security;

do $$ declare pol record; begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'profile_prompts'
  loop
    execute format('drop policy if exists %I on public.profile_prompts', pol.policyname);
  end loop;
end $$;

-- Read: owner always; everyone else only if visibility allows
create policy "profile_prompts_select"
  on public.profile_prompts for select
  to authenticated
  using (
    user_id = auth.uid()
    or visibility in ('public', 'tribe')
  );

-- Insert / update / delete remain owner-only
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
