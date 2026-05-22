-- 012_profile_v2.sql
-- Profile v2: real name, connections visibility, media gallery,
-- realtime DMs, peer-supporter academy signups, and notification kind.

-- ─────────────────────────────────────────────────────────────────
-- 1) Profile new columns
-- ─────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists real_name text,
  add column if not exists connections_visibility text not null default 'tribe';

alter table public.profiles
  drop constraint if exists profiles_connections_visibility_check;
alter table public.profiles
  add constraint profiles_connections_visibility_check
  check (connections_visibility in ('public','tribe','private'));

-- ─────────────────────────────────────────────────────────────────
-- 2) profile_media — gallery
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.profile_media (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  url         text not null,
  kind        text not null check (kind in ('image','video')),
  caption     text,
  sort_order  integer not null default 0,
  flagged     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists profile_media_owner_idx on public.profile_media (owner_id, sort_order);

alter table public.profile_media enable row level security;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='profile_media' loop
    execute format('drop policy if exists %I on public.profile_media', pol.policyname);
  end loop;
end $$;

create policy "profile_media_select" on public.profile_media for select to authenticated using (true);
create policy "profile_media_insert" on public.profile_media for insert to authenticated with check (owner_id = auth.uid());
create policy "profile_media_update" on public.profile_media for update to authenticated using (owner_id = auth.uid());
create policy "profile_media_delete" on public.profile_media for delete to authenticated using (owner_id = auth.uid());

-- Storage bucket: profile-media (public read; owner-only write under {user_id}/...)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media', 'profile-media', true, 26214400,
  array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Profile media public read" on storage.objects;
drop policy if exists "Users upload own profile media" on storage.objects;
drop policy if exists "Users update own profile media" on storage.objects;
drop policy if exists "Users delete own profile media" on storage.objects;

create policy "Profile media public read"
  on storage.objects for select
  using (bucket_id = 'profile-media');

create policy "Users upload own profile media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own profile media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own profile media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────────────
-- 3) Helper: are two users an accepted connection?
-- ─────────────────────────────────────────────────────────────────
create or replace function public.are_connected(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.connections
     where status = 'accepted'
       and least(requester_id, recipient_id)    = least(p_user_a, p_user_b)
       and greatest(requester_id, recipient_id) = greatest(p_user_a, p_user_b)
  );
$$;

grant execute on function public.are_connected(uuid, uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 4) DM threads + messages
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.dm_threads (
  id              uuid primary key default gen_random_uuid(),
  user_a          uuid not null references auth.users(id) on delete cascade,
  user_b          uuid not null references auth.users(id) on delete cascade,
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  pair_a uuid generated always as (least(user_a, user_b))    stored,
  pair_b uuid generated always as (greatest(user_a, user_b)) stored,
  check (user_a <> user_b)
);

create unique index if not exists dm_threads_unique_pair on public.dm_threads (pair_a, pair_b);

create table if not exists public.dm_messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.dm_threads(id) on delete cascade,
  sender_id   uuid not null references auth.users(id) on delete cascade,
  body        text not null check (length(trim(body)) > 0),
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);

create index if not exists dm_messages_thread_idx on public.dm_messages (thread_id, created_at);

alter table public.dm_threads  enable row level security;
alter table public.dm_messages enable row level security;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='dm_threads' loop
    execute format('drop policy if exists %I on public.dm_threads', pol.policyname);
  end loop;
  for pol in select policyname from pg_policies where schemaname='public' and tablename='dm_messages' loop
    execute format('drop policy if exists %I on public.dm_messages', pol.policyname);
  end loop;
end $$;

-- Threads: only participants can SELECT
create policy "dm_threads_select" on public.dm_threads for select to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());

-- Threads: only via get_or_create_dm_thread RPC; direct insert blocked
-- (no INSERT policy means INSERTs from non-service roles fail except via SECURITY DEFINER RPC)

-- Messages: only participants can SELECT
create policy "dm_messages_select" on public.dm_messages for select to authenticated
  using (
    exists (
      select 1 from public.dm_threads t
       where t.id = dm_messages.thread_id
         and (t.user_a = auth.uid() or t.user_b = auth.uid())
    )
  );

-- Messages: can INSERT only as yourself, into a thread you're in,
-- with the other participant being an accepted connection.
create policy "dm_messages_insert" on public.dm_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.dm_threads t
       where t.id = thread_id
         and (t.user_a = auth.uid() or t.user_b = auth.uid())
         and public.are_connected(
           auth.uid(),
           case when t.user_a = auth.uid() then t.user_b else t.user_a end
         )
    )
  );

-- Messages: can UPDATE (e.g. mark read) if you're a participant
create policy "dm_messages_update" on public.dm_messages for update to authenticated
  using (
    exists (
      select 1 from public.dm_threads t
       where t.id = dm_messages.thread_id
         and (t.user_a = auth.uid() or t.user_b = auth.uid())
    )
  );

-- ─────────────────────────────────────────────────────────────────
-- 5) get_or_create_dm_thread RPC
-- ─────────────────────────────────────────────────────────────────
create or replace function public.get_or_create_dm_thread(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_thread_id uuid;
begin
  if v_caller is null then raise exception 'Not signed in'; end if;
  if v_caller = p_other_user_id then raise exception 'Cannot DM yourself'; end if;
  if not public.are_connected(v_caller, p_other_user_id) then
    raise exception 'You must be connected before messaging';
  end if;

  select id into v_thread_id
    from public.dm_threads
   where least(user_a, user_b)    = least(v_caller, p_other_user_id)
     and greatest(user_a, user_b) = greatest(v_caller, p_other_user_id);

  if v_thread_id is not null then return v_thread_id; end if;

  insert into public.dm_threads (user_a, user_b)
  values (v_caller, p_other_user_id)
  returning id into v_thread_id;

  return v_thread_id;
end;
$$;

grant execute on function public.get_or_create_dm_thread(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 6) Realtime publication
-- ─────────────────────────────────────────────────────────────────
do $$
begin
  begin
    alter publication supabase_realtime add table public.dm_messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.dm_threads;
  exception when duplicate_object then null;
  end;
end $$;

-- ─────────────────────────────────────────────────────────────────
-- 7) Notifications: direct_message kind + trigger
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
    'connection_accepted',
    'direct_message'
  ));

create or replace function public.on_dm_message_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_recipient_id uuid;
begin
  select case when user_a = new.sender_id then user_b else user_a end
    into v_recipient_id
    from public.dm_threads where id = new.thread_id;

  if v_recipient_id is null then return new; end if;

  insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
  values (
    v_recipient_id,
    'direct_message',
    new.sender_id,
    'dm_thread',
    new.thread_id,
    jsonb_build_object('excerpt', left(new.body, 200))
  );

  update public.dm_threads
     set last_message_at = new.created_at
   where id = new.thread_id;

  return new;
end;
$$;

drop trigger if exists tg_dm_message_insert on public.dm_messages;
create trigger tg_dm_message_insert
  after insert on public.dm_messages
  for each row execute function public.on_dm_message_insert();

-- ─────────────────────────────────────────────────────────────────
-- 8) peer_supporter_signups (Academy v2 callout)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.peer_supporter_signups (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  role          text not null check (role in ('lived_experience','accredited_peer_supporter','other')),
  organisation  text,
  message       text,
  created_at    timestamptz not null default now()
);

alter table public.peer_supporter_signups enable row level security;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='peer_supporter_signups' loop
    execute format('drop policy if exists %I on public.peer_supporter_signups', pol.policyname);
  end loop;
end $$;

-- Anyone (authenticated OR anon) can submit a signup
create policy "peer_signups_insert_public" on public.peer_supporter_signups for insert
  to authenticated, anon
  with check (true);

-- (No SELECT/UPDATE/DELETE policy → only service role can read submissions
--  via Supabase dashboard. Admins query manually.)
