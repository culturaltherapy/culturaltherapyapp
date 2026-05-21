-- 005_tribe_requests.sql
-- The initial migration created a simpler tribe_requests table (requester_id,
-- no initiated_by). We need the dual-direction model so the same table covers
-- both "I want to join" and "I'm inviting X". Safest path: drop the old one
-- and create fresh, since no real tribes exist yet.

-- ────────────────────────────────────────────────────────────────────────────
-- Drop old version + helpers (in case a prior 005 attempt got partway)
-- ────────────────────────────────────────────────────────────────────────────
drop table if exists public.tribe_requests cascade;
drop function if exists public.accept_tribe_request(uuid);
drop function if exists public.decline_tribe_request(uuid);
drop function if exists public.create_tribe(text, text, text, text);

-- ────────────────────────────────────────────────────────────────────────────
-- Recreate cleanly
-- ────────────────────────────────────────────────────────────────────────────
create table public.tribe_requests (
  id            uuid primary key default gen_random_uuid(),
  tribe_id      uuid not null references public.tribes(id) on delete cascade,
  user_id       uuid not null references auth.users(id)    on delete cascade, -- prospective member
  initiated_by  uuid not null references auth.users(id)    on delete cascade, -- who created the request
  message       text,
  status        text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at    timestamptz not null default now()
);

create unique index tribe_requests_unique_pending
  on public.tribe_requests (tribe_id, user_id) where status = 'pending';

create index tribe_requests_user_idx  on public.tribe_requests (user_id, status);
create index tribe_requests_tribe_idx on public.tribe_requests (tribe_id, status);

alter table public.tribe_requests enable row level security;

-- ────────────────────────────────────────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────────────────────────────────────────
create policy "tribe_requests_select"
  on public.tribe_requests for select
  to authenticated
  using (
    user_id = auth.uid()
    or initiated_by = auth.uid()
    or exists (
      select 1 from public.tribes
       where tribes.id = tribe_requests.tribe_id
         and tribes.owner_id = auth.uid()
    )
  );

create policy "tribe_requests_insert"
  on public.tribe_requests for insert
  to authenticated
  with check (
    initiated_by = auth.uid()
    and (
      user_id = auth.uid()
      or public.is_tribe_member(tribe_id)
    )
  );

create policy "tribe_requests_update"
  on public.tribe_requests for update
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.tribes
       where tribes.id = tribe_requests.tribe_id
         and tribes.owner_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- Helpers
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.accept_tribe_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tribe_id uuid;
  v_user_id uuid;
  v_owner_id uuid;
  v_caller uuid := auth.uid();
begin
  select tribe_id, user_id
    into v_tribe_id, v_user_id
    from public.tribe_requests
   where id = p_request_id and status = 'pending';

  if v_tribe_id is null then
    raise exception 'Request not found or already actioned';
  end if;

  select owner_id into v_owner_id from public.tribes where id = v_tribe_id;

  if not (v_owner_id = v_caller or v_user_id = v_caller) then
    raise exception 'Not authorized to accept this request';
  end if;

  update public.tribe_requests set status = 'accepted' where id = p_request_id;

  insert into public.tribe_members (tribe_id, user_id, role)
  values (v_tribe_id, v_user_id, 'member')
  on conflict do nothing;
end;
$$;

grant execute on function public.accept_tribe_request(uuid) to authenticated;

create or replace function public.decline_tribe_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tribe_id uuid;
  v_user_id uuid;
  v_owner_id uuid;
  v_caller uuid := auth.uid();
begin
  select tribe_id, user_id
    into v_tribe_id, v_user_id
    from public.tribe_requests
   where id = p_request_id and status = 'pending';

  if v_tribe_id is null then return; end if;

  select owner_id into v_owner_id from public.tribes where id = v_tribe_id;

  if not (v_owner_id = v_caller or v_user_id = v_caller) then
    raise exception 'Not authorized to decline this request';
  end if;

  update public.tribe_requests set status = 'declined' where id = p_request_id;
end;
$$;

grant execute on function public.decline_tribe_request(uuid) to authenticated;

create or replace function public.create_tribe(
  p_name  text,
  p_blurb text default null,
  p_color text default '#2f4a32',
  p_motif text default 'Ubuntu'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tribe_id uuid;
  v_caller uuid := auth.uid();
begin
  if v_caller is null then raise exception 'Not signed in'; end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Tribe name is required';
  end if;

  insert into public.tribes (name, blurb, color, motif, owner_id)
  values (trim(p_name), nullif(trim(p_blurb), ''), p_color, p_motif, v_caller)
  returning id into v_tribe_id;

  insert into public.tribe_members (tribe_id, user_id, role)
  values (v_tribe_id, v_caller, 'owner');

  return v_tribe_id;
end;
$$;

grant execute on function public.create_tribe(text, text, text, text) to authenticated;
