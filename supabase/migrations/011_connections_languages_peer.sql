-- 011_connections_languages_peer.sql
-- 1) Split languages into spoken + understood
-- 2) Add is_peer_supporter flag (set when Academy is completed; for now manual)
-- 3) Connections (user-to-user) table + RLS + triggers
-- 4) Extend notifications kinds for connection events

-- ─────────────────────────────────────────────────────────────────
-- 1) Languages understood (separate from `languages` which becomes "spoken")
-- ─────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists languages_understood text[] not null default '{}'::text[];

-- ─────────────────────────────────────────────────────────────────
-- 2) Peer-supporter flag
-- ─────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_peer_supporter boolean not null default false;

-- ─────────────────────────────────────────────────────────────────
-- 3) Connections (friend-like) table
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.connections (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references auth.users(id) on delete cascade,
  recipient_id  uuid not null references auth.users(id) on delete cascade,
  message       text,
  status        text not null default 'pending'
    check (status in ('pending','accepted','declined','cancelled','blocked')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  pair_a uuid generated always as (least(requester_id, recipient_id))    stored,
  pair_b uuid generated always as (greatest(requester_id, recipient_id)) stored,
  check (requester_id <> recipient_id)
);

-- Prevent more than one active connection per pair (either direction)
create unique index if not exists connections_unique_active
  on public.connections (pair_a, pair_b)
  where status in ('pending','accepted');

create index if not exists connections_requester_idx on public.connections (requester_id, status);
create index if not exists connections_recipient_idx on public.connections (recipient_id, status);

alter table public.connections enable row level security;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='connections' loop
    execute format('drop policy if exists %I on public.connections', pol.policyname);
  end loop;
end $$;

-- See connections that involve you
create policy "connections_select"
  on public.connections for select
  to authenticated
  using (requester_id = auth.uid() or recipient_id = auth.uid());

-- Insert only as the requester, to someone other than yourself
create policy "connections_insert"
  on public.connections for insert
  to authenticated
  with check (requester_id = auth.uid() and recipient_id <> auth.uid());

-- Update by either party (accept / decline / cancel)
create policy "connections_update"
  on public.connections for update
  to authenticated
  using (requester_id = auth.uid() or recipient_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- 4) Extend notifications kinds and add connection triggers
-- ─────────────────────────────────────────────────────────────────
alter table public.notifications
  drop constraint if exists notifications_kind_check;

alter table public.notifications
  add constraint notifications_kind_check
  check (kind in (
    'tribe_request_received',
    'tribe_invitation',
    'tribe_accepted',
    'thread_reply',
    'connection_request',
    'connection_accepted'
  ));

-- On new connection insert → notify the recipient
create or replace function public.on_connection_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
  values (
    new.recipient_id,
    'connection_request',
    new.requester_id,
    'connection',
    new.id,
    jsonb_build_object('message', new.message)
  );
  return new;
end;
$$;

drop trigger if exists tg_connection_insert on public.connections;
create trigger tg_connection_insert
  after insert on public.connections
  for each row execute function public.on_connection_insert();

-- On status → 'accepted' → notify the original requester
create or replace function public.on_connection_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'pending' and new.status = 'accepted' then
    insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
    values (
      new.requester_id,
      'connection_accepted',
      new.recipient_id,
      'connection',
      new.id,
      '{}'::jsonb
    );
  end if;
  return new;
end;
$$;

drop trigger if exists tg_connection_update on public.connections;
create trigger tg_connection_update
  after update on public.connections
  for each row execute function public.on_connection_update();
