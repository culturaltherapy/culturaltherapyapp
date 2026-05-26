-- 020_media_prompt_interactions.sql
-- Extends the like+comment system from wall posts (built in 016) to:
--   1) profile_media items (each photo / video in the gallery)
--   2) profile_prompts (each Hinge-style prompt answer)
--
-- Also adds owner opt-in: each profile can disable likes and/or comments
-- on each surface (wall / media / prompts), enforced at both UI and RLS
-- layers. Existing interactions stay readable; only new ones are blocked
-- when the owner switches a toggle off.

-- ─────────────────────────────────────────────────────────────
-- 1) Owner opt-in columns on profiles (6 booleans, default TRUE)
-- ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists allow_wall_likes      boolean not null default true;
alter table public.profiles
  add column if not exists allow_wall_comments   boolean not null default true;
alter table public.profiles
  add column if not exists allow_media_likes     boolean not null default true;
alter table public.profiles
  add column if not exists allow_media_comments  boolean not null default true;
alter table public.profiles
  add column if not exists allow_prompt_likes    boolean not null default true;
alter table public.profiles
  add column if not exists allow_prompt_comments boolean not null default true;

-- ─────────────────────────────────────────────────────────────
-- 2a) media_likes — mirrors post_likes
-- ─────────────────────────────────────────────────────────────
create table if not exists public.media_likes (
  media_id   uuid not null references public.profile_media(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (media_id, user_id)
);

create index if not exists media_likes_media_idx on public.media_likes (media_id);
create index if not exists media_likes_user_idx  on public.media_likes (user_id);

alter table public.media_likes enable row level security;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='media_likes' loop
    execute format('drop policy if exists %I on public.media_likes', pol.policyname);
  end loop;
end $$;

create policy "media_likes_select"
  on public.media_likes for select
  to authenticated
  using (exists (select 1 from public.profile_media m where m.id = media_likes.media_id));

create policy "media_likes_insert"
  on public.media_likes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
        from public.profile_media m
        join public.profiles p on p.id = m.owner_id
       where m.id = media_id
         and p.allow_media_likes = true
    )
  );

create policy "media_likes_delete"
  on public.media_likes for delete
  to authenticated
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 2b) media_comments
-- ─────────────────────────────────────────────────────────────
create table if not exists public.media_comments (
  id         uuid primary key default gen_random_uuid(),
  media_id   uuid not null references public.profile_media(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade,
  body       text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  edited_at  timestamptz
);

create index if not exists media_comments_media_idx  on public.media_comments (media_id, created_at);
create index if not exists media_comments_author_idx on public.media_comments (author_id);

alter table public.media_comments enable row level security;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='media_comments' loop
    execute format('drop policy if exists %I on public.media_comments', pol.policyname);
  end loop;
end $$;

create policy "media_comments_select"
  on public.media_comments for select
  to authenticated
  using (exists (select 1 from public.profile_media m where m.id = media_comments.media_id));

create policy "media_comments_insert"
  on public.media_comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1
        from public.profile_media m
        join public.profiles p on p.id = m.owner_id
       where m.id = media_id
         and p.allow_media_comments = true
    )
  );

create policy "media_comments_update"
  on public.media_comments for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "media_comments_delete"
  on public.media_comments for delete
  to authenticated
  using (author_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 2c) prompt_likes
-- ─────────────────────────────────────────────────────────────
create table if not exists public.prompt_likes (
  prompt_id  uuid not null references public.profile_prompts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (prompt_id, user_id)
);

create index if not exists prompt_likes_prompt_idx on public.prompt_likes (prompt_id);
create index if not exists prompt_likes_user_idx   on public.prompt_likes (user_id);

alter table public.prompt_likes enable row level security;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='prompt_likes' loop
    execute format('drop policy if exists %I on public.prompt_likes', pol.policyname);
  end loop;
end $$;

create policy "prompt_likes_select"
  on public.prompt_likes for select
  to authenticated
  using (exists (select 1 from public.profile_prompts pr where pr.id = prompt_likes.prompt_id));

create policy "prompt_likes_insert"
  on public.prompt_likes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
        from public.profile_prompts pr
        join public.profiles p on p.id = pr.user_id
       where pr.id = prompt_id
         and p.allow_prompt_likes = true
    )
  );

create policy "prompt_likes_delete"
  on public.prompt_likes for delete
  to authenticated
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 2d) prompt_comments
-- ─────────────────────────────────────────────────────────────
create table if not exists public.prompt_comments (
  id         uuid primary key default gen_random_uuid(),
  prompt_id  uuid not null references public.profile_prompts(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade,
  body       text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  edited_at  timestamptz
);

create index if not exists prompt_comments_prompt_idx on public.prompt_comments (prompt_id, created_at);
create index if not exists prompt_comments_author_idx on public.prompt_comments (author_id);

alter table public.prompt_comments enable row level security;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='prompt_comments' loop
    execute format('drop policy if exists %I on public.prompt_comments', pol.policyname);
  end loop;
end $$;

create policy "prompt_comments_select"
  on public.prompt_comments for select
  to authenticated
  using (exists (select 1 from public.profile_prompts pr where pr.id = prompt_comments.prompt_id));

create policy "prompt_comments_insert"
  on public.prompt_comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1
        from public.profile_prompts pr
        join public.profiles p on p.id = pr.user_id
       where pr.id = prompt_id
         and p.allow_prompt_comments = true
    )
  );

create policy "prompt_comments_update"
  on public.prompt_comments for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "prompt_comments_delete"
  on public.prompt_comments for delete
  to authenticated
  using (author_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 3) Retrofit existing post_likes / post_comments INSERT policies
--    to also check allow_wall_likes / allow_wall_comments on the
--    post's owner profile.
-- ─────────────────────────────────────────────────────────────
drop policy if exists "post_likes_insert" on public.post_likes;
create policy "post_likes_insert"
  on public.post_likes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
        from public.posts po
        join public.profiles p on p.id = po.owner_id
       where po.id = post_id
         and p.allow_wall_likes = true
    )
  );

drop policy if exists "post_comments_insert" on public.post_comments;
create policy "post_comments_insert"
  on public.post_comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1
        from public.posts po
        join public.profiles p on p.id = po.owner_id
       where po.id = post_id
         and p.allow_wall_comments = true
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 4) Notification kinds + triggers (mirror migration 016)
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
    'post_like',
    'media_comment',
    'media_like',
    'prompt_comment',
    'prompt_like'
  ));

-- Media comment notification
create or replace function public.on_media_comment_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner_id uuid;
begin
  select owner_id into v_owner_id from public.profile_media where id = new.media_id;
  if v_owner_id is null or v_owner_id = new.author_id then return new; end if;
  insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
  values (
    v_owner_id, 'media_comment', new.author_id, 'media', new.media_id,
    jsonb_build_object('excerpt', left(new.body, 200))
  );
  return new;
end;
$$;
drop trigger if exists tg_media_comment_insert on public.media_comments;
create trigger tg_media_comment_insert
  after insert on public.media_comments
  for each row execute function public.on_media_comment_insert();

-- Media like notification
create or replace function public.on_media_like_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner_id uuid;
begin
  select owner_id into v_owner_id from public.profile_media where id = new.media_id;
  if v_owner_id is null or v_owner_id = new.user_id then return new; end if;
  insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
  values (v_owner_id, 'media_like', new.user_id, 'media', new.media_id, '{}'::jsonb);
  return new;
end;
$$;
drop trigger if exists tg_media_like_insert on public.media_likes;
create trigger tg_media_like_insert
  after insert on public.media_likes
  for each row execute function public.on_media_like_insert();

-- Prompt comment notification
create or replace function public.on_prompt_comment_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner_id uuid;
begin
  select user_id into v_owner_id from public.profile_prompts where id = new.prompt_id;
  if v_owner_id is null or v_owner_id = new.author_id then return new; end if;
  insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
  values (
    v_owner_id, 'prompt_comment', new.author_id, 'prompt', new.prompt_id,
    jsonb_build_object('excerpt', left(new.body, 200))
  );
  return new;
end;
$$;
drop trigger if exists tg_prompt_comment_insert on public.prompt_comments;
create trigger tg_prompt_comment_insert
  after insert on public.prompt_comments
  for each row execute function public.on_prompt_comment_insert();

-- Prompt like notification
create or replace function public.on_prompt_like_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner_id uuid;
begin
  select user_id into v_owner_id from public.profile_prompts where id = new.prompt_id;
  if v_owner_id is null or v_owner_id = new.user_id then return new; end if;
  insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
  values (v_owner_id, 'prompt_like', new.user_id, 'prompt', new.prompt_id, '{}'::jsonb);
  return new;
end;
$$;
drop trigger if exists tg_prompt_like_insert on public.prompt_likes;
create trigger tg_prompt_like_insert
  after insert on public.prompt_likes
  for each row execute function public.on_prompt_like_insert();
