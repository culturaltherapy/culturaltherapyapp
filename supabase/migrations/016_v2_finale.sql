-- 016_v2_finale.sql
-- Chunk 4 finale:
--   1) Move real_name into profiles_private (admin / owner only)
--   2) Add post_likes + post_comments with proper RLS keyed off post visibility
--   3) New notification kind: 'post_comment' + trigger
--   4) Manual flip for Cultural Therapy Team test account to is_peer_supporter

-- ─────────────────────────────────────────────────────────────
-- 1) profiles_private — restricted storage for real_name & future
--    safeguarding fields (verification docs, etc).
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles_private (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  real_name  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backfill from existing profiles.real_name before dropping the column
insert into public.profiles_private (user_id, real_name)
  select id, real_name from public.profiles where real_name is not null
on conflict (user_id) do update set real_name = excluded.real_name;

-- Drop public exposure
alter table public.profiles drop column if exists real_name;

alter table public.profiles_private enable row level security;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='profiles_private' loop
    execute format('drop policy if exists %I on public.profiles_private', pol.policyname);
  end loop;
end $$;

-- Owner only — no one else (not even admin via the JS client) can SELECT.
-- Admins query via the Supabase dashboard using the service role.
create policy "profiles_private_select_self"
  on public.profiles_private for select
  to authenticated
  using (user_id = auth.uid());

create policy "profiles_private_insert_self"
  on public.profiles_private for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "profiles_private_update_self"
  on public.profiles_private for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Keep updated_at fresh
create or replace function public.touch_profiles_private_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists tg_profiles_private_touch on public.profiles_private;
create trigger tg_profiles_private_touch
  before update on public.profiles_private
  for each row execute function public.touch_profiles_private_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 2a) post_likes — composite PK (post_id, user_id)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.post_likes (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_post_idx on public.post_likes (post_id);
create index if not exists post_likes_user_idx on public.post_likes (user_id);

alter table public.post_likes enable row level security;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='post_likes' loop
    execute format('drop policy if exists %I on public.post_likes', pol.policyname);
  end loop;
end $$;

-- See likes on posts you can see (leverages the posts SELECT RLS via EXISTS)
create policy "post_likes_select"
  on public.post_likes for select
  to authenticated
  using (
    exists (select 1 from public.posts p where p.id = post_likes.post_id)
  );

-- You can only insert a like as yourself, on a post you can see
create policy "post_likes_insert"
  on public.post_likes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.posts p where p.id = post_id)
  );

-- You can only delete your own like
create policy "post_likes_delete"
  on public.post_likes for delete
  to authenticated
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 2b) post_comments — comments on wall posts
-- ─────────────────────────────────────────────────────────────
create table if not exists public.post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null references auth.users(id) on delete cascade,
  body        text not null check (length(trim(body)) > 0),
  created_at  timestamptz not null default now(),
  edited_at   timestamptz
);

create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);
create index if not exists post_comments_author_idx on public.post_comments (author_id);

alter table public.post_comments enable row level security;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='post_comments' loop
    execute format('drop policy if exists %I on public.post_comments', pol.policyname);
  end loop;
end $$;

create policy "post_comments_select"
  on public.post_comments for select
  to authenticated
  using (
    exists (select 1 from public.posts p where p.id = post_comments.post_id)
  );

create policy "post_comments_insert"
  on public.post_comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.posts p where p.id = post_id)
  );

create policy "post_comments_update"
  on public.post_comments for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "post_comments_delete"
  on public.post_comments for delete
  to authenticated
  using (author_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 3) notifications: add 'post_comment' + 'post_like' kinds + trigger
--    (likes notification only fires on first like per (post, liker)
--    pair, which is enforced by the PK)
-- ─────────────────────────────────────────────────────────────
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
    'direct_message',
    'post_comment',
    'post_like'
  ));

create or replace function public.on_post_comment_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner_id uuid;
begin
  select owner_id into v_owner_id from public.posts where id = new.post_id;
  if v_owner_id is null or v_owner_id = new.author_id then return new; end if;

  insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
  values (
    v_owner_id,
    'post_comment',
    new.author_id,
    'post',
    new.post_id,
    jsonb_build_object('excerpt', left(new.body, 200))
  );
  return new;
end;
$$;

drop trigger if exists tg_post_comment_insert on public.post_comments;
create trigger tg_post_comment_insert
  after insert on public.post_comments
  for each row execute function public.on_post_comment_insert();

create or replace function public.on_post_like_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner_id uuid;
begin
  select owner_id into v_owner_id from public.posts where id = new.post_id;
  if v_owner_id is null or v_owner_id = new.user_id then return new; end if;

  insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
  values (
    v_owner_id,
    'post_like',
    new.user_id,
    'post',
    new.post_id,
    '{}'::jsonb
  );
  return new;
end;
$$;

drop trigger if exists tg_post_like_insert on public.post_likes;
create trigger tg_post_like_insert
  after insert on public.post_likes
  for each row execute function public.on_post_like_insert();

-- ─────────────────────────────────────────────────────────────
-- 4) Flip Cultural Therapy Team to peer-supporter (test account)
-- ─────────────────────────────────────────────────────────────
update public.profiles
   set is_peer_supporter = true
 where alias ilike 'cultural therapy team%';
