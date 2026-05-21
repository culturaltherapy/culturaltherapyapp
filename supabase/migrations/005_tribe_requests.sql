-- 005_tribe_requests.sql
-- Tribe membership requests / invitations. The same table covers both:
--   - "User asks to join a tribe":   user_id == initiated_by
--   - "Existing member invites X":   user_id != initiated_by

-- ────────────────────────────────────────────────────────────────────────────
-- Table
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.tribe_requests (
  id            uuid primary key default gen_random_uuid(),
  tribe_id      uuid not null references public.tribes(id) on delete cascade,
  user_id       uuid not null references auth.users(id)    on delete cascade, -- prospective member
  initiated_by  uuid not null references auth.users(id)    on delete cascade, -- who created the request
  message       text,
  status        text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at    timestamptz not null default now()
);

-- Only one pending request per (tribe, user) at a time
create unique index if not exists tribe_requests_unique_pending
  on public.tribe_requests (tribe_id, user_id) where status = 'pending';

create index if not exists tribe_requests_user_idx     on public.tribe_requests (user_id, status);
create index if not exists tribe_requests_tribe_idx    on public.tribe_requests (tribe_id, status);

alter table public.tribe_requests enable row level security;

-- ────────────────────────────────────────────────────────────────────────────
-- RLS — uses the same is_tribe_member helper from migration 004.
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "tribe_requests_select" on public.tribe_requests;
drop policy if exists "tribe_requests_insert" on public.tribe_requests;
drop policy if exists "tribe_requests_update" on public.tribe_requests;

-- See requests that involve you OR are for a tribe you own
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

-- Insert allowed if:
--  - you're requesting to join yourself (user_id = me, initiated_by = me), OR
--  - you're already a member inviting someone else
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

-- Update allowed if you're the user being invited OR the tribe owner
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
-- Helper: accept_tribe_request — flips status + inserts membership in one tx.
-- SECURITY DEFINER so the membership insert isn't blocked by tribe_members RLS.
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
   where id = p_request_id
     and status = 'pending';

  if v_tribe_id is null then
    raise exception 'Request not found or already actioned';
  end if;

  select owner_id into v_owner_id from public.tribes where id = v_tribe_id;

  -- Owner accepts join-request, OR invitee accepts invitation
  if not (v_owner_id = v_caller or v_user_id = v_caller) then
    raise exception 'Not authorized to accept this request';
  end if;

  update public.tribe_requests
     set status = 'accepted'
   where id = p_request_id;

  insert into public.tribe_members (tribe_id, user_id, role)
  values (v_tribe_id, v_user_id, 'member')
  on conflict do nothing;
end;
$$;

grant execute on function public.accept_tribe_request(uuid) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- Helper: decline_tribe_request
-- ────────────────────────────────────────────────────────────────────────────
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
   where id = p_request_id
     and status = 'pending';

  if v_tribe_id is null then return; end if;

  select owner_id into v_owner_id from public.tribes where id = v_tribe_id;

  if not (v_owner_id = v_caller or v_user_id = v_caller) then
    raise exception 'Not authorized to decline this request';
  end if;

  update public.tribe_requests
     set status = 'declined'
   where id = p_request_id;
end;
$$;

grant execute on function public.decline_tribe_request(uuid) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- Helper: create_tribe — creates tribe AND auto-adds creator as owner-member
-- in a single transaction (otherwise the membership insert is racy / can fail).
-- ────────────────────────────────────────────────────────────────────────────
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
  if v_caller is null then
    raise exception 'Not signed in';
  end if;
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
