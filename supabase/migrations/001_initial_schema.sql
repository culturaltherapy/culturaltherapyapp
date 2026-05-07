-- Cultural Therapy — Initial Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

-- ============================================================
-- ENUMS
-- ============================================================

create type visibility as enum ('public', 'tribe', 'village', 'private');
create type tribe_role as enum ('owner', 'mod', 'member');
create type request_status as enum ('pending', 'accepted', 'declined');
create type media_kind as enum ('image', 'video');
create type report_reason as enum ('safety', 'abuse', 'spam', 'crisis', 'other');
create type report_severity as enum ('normal', 'high', 'crisis');
create type report_status as enum ('open', 'triaged', 'actioned', 'dismissed');
create type target_kind as enum ('profile', 'post', 'comment', 'message', 'thread');

-- ============================================================
-- PROFILES
-- ============================================================

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  alias text not null check (char_length(alias) between 2 and 24),
  full_name text,
  avatar_url text,
  bio text,
  pronouns text,
  city text,
  country text,
  lat double precision,
  lng double precision,
  descent text[] default '{}',
  languages text[] default '{}',
  diagnosis text,
  diagnosis_visibility visibility default 'private',
  experience_tags text[] default '{}',
  id_verified boolean default false,
  id_vendor_ref text,
  wall_enabled boolean default true,
  accepts_tribe_requests boolean default true,
  accepts_dms boolean default true,
  accepts_calls boolean default false,
  accepts_video boolean default false,
  created_at timestamptz default now()
);

create table profile_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  prompt_id text not null,
  answer text not null,
  visibility visibility default 'tribe',
  created_at timestamptz default now(),
  unique (user_id, prompt_id)
);

create table profile_socials (
  user_id uuid references profiles on delete cascade,
  platform text not null check (platform in ('facebook','twitter','instagram','snap','linkedin')),
  handle text,
  primary key (user_id, platform)
);

-- ============================================================
-- MEDIA
-- ============================================================

create table media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles on delete cascade,
  kind media_kind not null,
  url text not null,
  thumb_url text,
  caption text not null,
  duration_s int,
  width int,
  height int,
  ordinal int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- TRIBES & VILLAGES
-- ============================================================

create table tribes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  blurb text,
  color text,
  motif text,
  owner_id uuid not null references profiles on delete restrict,
  created_at timestamptz default now()
);

create table tribe_members (
  tribe_id uuid references tribes on delete cascade,
  user_id uuid references profiles on delete cascade,
  role tribe_role default 'member',
  joined_at timestamptz default now(),
  primary key (tribe_id, user_id)
);

create table tribe_requests (
  id uuid primary key default gen_random_uuid(),
  tribe_id uuid not null references tribes on delete cascade,
  requester_id uuid not null references profiles on delete cascade,
  message text,
  status request_status default 'pending',
  created_at timestamptz default now(),
  unique (tribe_id, requester_id)
);

create table village_threads (
  id uuid primary key default gen_random_uuid(),
  tribe_id uuid not null references tribes on delete cascade,
  author_id uuid not null references profiles on delete cascade,
  title text not null,
  body text,
  created_at timestamptz default now()
);

create table village_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references village_threads on delete cascade,
  author_id uuid not null references profiles on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table audio_rooms (
  id uuid primary key default gen_random_uuid(),
  tribe_id uuid not null references tribes on delete cascade,
  title text,
  host_id uuid not null references profiles on delete cascade,
  scheduled_at timestamptz,
  is_live boolean default false,
  allow_recording boolean default false,
  livekit_room_name text,
  created_at timestamptz default now()
);

-- ============================================================
-- POSTS (wall)
-- ============================================================

create table posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles on delete cascade,
  body text,
  visibility visibility not null default 'tribe',
  village_id uuid references tribes,
  created_at timestamptz default now(),
  edited_at timestamptz
);

create table post_media (
  post_id uuid references posts on delete cascade,
  media_id uuid references media on delete cascade,
  ordinal int default 0,
  primary key (post_id, media_id)
);

create table post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts on delete cascade,
  author_id uuid not null references profiles on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table post_likes (
  post_id uuid references posts on delete cascade,
  user_id uuid references profiles on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

-- ============================================================
-- DISCUSSIONS
-- ============================================================

create table discussion_rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  blurb text,
  motif text,
  is_chat boolean default false
);

create table discussion_posts (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references discussion_rooms on delete cascade,
  author_id uuid not null references profiles on delete cascade,
  body text,
  created_at timestamptz default now()
);

create table discussion_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references discussion_posts on delete cascade,
  author_id uuid not null references profiles on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- ACADEMY
-- ============================================================

create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  blurb text,
  motif text,
  published boolean default false,
  created_at timestamptz default now()
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  title text not null,
  ordinal int not null default 0
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules on delete cascade,
  title text not null,
  body_md text,
  video_url text,
  duration_min int,
  ordinal int not null default 0
);

create table enrollments (
  user_id uuid references profiles on delete cascade,
  course_id uuid references courses on delete cascade,
  enrolled_at timestamptz default now(),
  primary key (user_id, course_id)
);

create table lesson_progress (
  user_id uuid references profiles on delete cascade,
  lesson_id uuid references lessons on delete cascade,
  completed_at timestamptz default now(),
  primary key (user_id, lesson_id)
);

-- ============================================================
-- MODERATION & SAFEGUARDING
-- ============================================================

create table mod_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles on delete cascade,
  target_kind target_kind not null,
  target_id uuid not null,
  reason report_reason not null,
  severity report_severity default 'normal',
  status report_status default 'open',
  notes text,
  created_at timestamptz default now()
);

create table crisis_resources (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  name text not null,
  phone text,
  url text,
  hours text
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles on delete set null,
  action text not null,
  target_kind text,
  target_id uuid,
  meta jsonb,
  at timestamptz default now()
);

-- ============================================================
-- SEED: Crisis resources
-- ============================================================

insert into crisis_resources (country_code, name, phone, url, hours) values
  ('GB', 'Samaritans', '116 123', 'https://samaritans.org', '24/7'),
  ('GB', 'Shout (text)', 'Text 85258', 'https://giveusashout.org', '24/7'),
  ('GB', 'NHS 111', '111', 'https://nhs.uk', '24/7'),
  ('US', '988 Suicide & Crisis Lifeline', '988', 'https://988lifeline.org', '24/7'),
  ('US', 'Crisis Text Line', 'Text HOME to 741741', 'https://crisistextline.org', '24/7'),
  ('NG', 'Mentally Aware Nigeria', '0809 210 6493', 'https://mani.org.ng', 'Mon-Fri'),
  ('GH', 'Mental Health Authority Ghana', '+233 244 846 701', 'https://mhag.org', 'Office hours'),
  ('CA', 'Talk Suicide Canada', '1-833-456-4566', 'https://talksuicide.ca', '24/7'),
  ('ZA', 'SADAG', '0800 456 789', 'https://sadag.org', '24/7');

-- ============================================================
-- SEED: Discussion rooms
-- ============================================================

insert into discussion_rooms (title, blurb, motif, is_chat) values
  ('Stigma & systems', 'When the world is the problem.', 'funtunfunefu', false),
  ('Diaspora', 'Two homes, two languages.', 'sankofa', false),
  ('Family', 'The complicated ones.', 'ubuntu', false),
  ('Medication', 'Sitting on, coming off, or in between.', 'dwennimmen', false),
  ('Faith & spirit', 'Where therapy meets tradition.', 'ankh', false),
  ('Right now', 'Live chatroom — moderated, peer-only.', 'funtunfunefu', true);

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table profile_prompts enable row level security;
alter table profile_socials enable row level security;
alter table media enable row level security;
alter table tribes enable row level security;
alter table tribe_members enable row level security;
alter table tribe_requests enable row level security;
alter table village_threads enable row level security;
alter table village_messages enable row level security;
alter table audio_rooms enable row level security;
alter table posts enable row level security;
alter table post_comments enable row level security;
alter table post_likes enable row level security;
alter table post_media enable row level security;
alter table discussion_rooms enable row level security;
alter table discussion_posts enable row level security;
alter table discussion_replies enable row level security;
alter table courses enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;
alter table enrollments enable row level security;
alter table lesson_progress enable row level security;
alter table mod_reports enable row level security;
alter table crisis_resources enable row level security;
alter table audit_log enable row level security;

-- ── Profiles ─────────────────────────────────────────────────
create policy "profiles: authenticated can read"
  on profiles for select to authenticated using (true);

create policy "profiles: owner can update"
  on profiles for update to authenticated
  using (auth.uid() = profiles.id);

create policy "profiles: created on signup"
  on profiles for insert with check (auth.uid() = profiles.id);

-- ── Profile prompts ──────────────────────────────────────────
create policy "prompts: owner all"
  on profile_prompts for all to authenticated
  using (auth.uid() = profile_prompts.user_id);

create policy "prompts: public visible"
  on profile_prompts for select to authenticated
  using (profile_prompts.visibility = 'public');

-- Tribe visibility: caller shares at least one tribe with the prompt owner
create policy "prompts: tribe visible to co-member"
  on profile_prompts for select to authenticated
  using (
    profile_prompts.visibility = 'tribe'
    and exists (
      select 1
      from tribe_members tm1
      join tribe_members tm2 on tm1.tribe_id = tm2.tribe_id
      where tm1.user_id = auth.uid()
        and tm2.user_id = profile_prompts.user_id
    )
  );

-- ── Posts ─────────────────────────────────────────────────────
create policy "posts: owner all"
  on posts for all to authenticated
  using (auth.uid() = posts.owner_id);

create policy "posts: public to authenticated"
  on posts for select to authenticated
  using (posts.visibility = 'public');

create policy "posts: tribe to co-member"
  on posts for select to authenticated
  using (
    posts.visibility = 'tribe'
    and exists (
      select 1
      from tribe_members tm1
      join tribe_members tm2 on tm1.tribe_id = tm2.tribe_id
      where tm1.user_id = auth.uid()
        and tm2.user_id = posts.owner_id
    )
  );

create policy "posts: village to tribe member"
  on posts for select to authenticated
  using (
    posts.visibility = 'village'
    and exists (
      select 1 from tribe_members tm
      where tm.tribe_id = posts.village_id
        and tm.user_id = auth.uid()
    )
  );

-- ── Tribes ──────────────────────────────────────────────────
create policy "tribes: authenticated can create"
  on tribes for insert to authenticated
  with check (auth.uid() = tribes.owner_id);

create policy "tribes: owner all"
  on tribes for all to authenticated
  using (auth.uid() = tribes.owner_id);

create policy "tribes: members can read"
  on tribes for select to authenticated
  using (
    exists (
      select 1 from tribe_members tm
      where tm.tribe_id = tribes.id
        and tm.user_id = auth.uid()
    )
  );

-- ── Tribe members ───────────────────────────────────────────
create policy "tribe_members: own row readable"
  on tribe_members for select to authenticated
  using (tribe_members.user_id = auth.uid());

create policy "tribe_members: co-members readable"
  on tribe_members for select to authenticated
  using (
    exists (
      select 1 from tribe_members tm
      where tm.tribe_id = tribe_members.tribe_id
        and tm.user_id = auth.uid()
    )
  );

-- ── Tribe requests ──────────────────────────────────────────
create policy "tribe_requests: requester can insert"
  on tribe_requests for insert to authenticated
  with check (auth.uid() = tribe_requests.requester_id);

create policy "tribe_requests: requester can read own"
  on tribe_requests for select to authenticated
  using (auth.uid() = tribe_requests.requester_id);

create policy "tribe_requests: tribe owner can manage"
  on tribe_requests for all to authenticated
  using (
    exists (
      select 1 from tribes t
      where t.id = tribe_requests.tribe_id
        and t.owner_id = auth.uid()
    )
  );

-- ── Village threads ──────────────────────────────────────────
create policy "village_threads: tribe members only"
  on village_threads for all to authenticated
  using (
    exists (
      select 1 from tribe_members tm
      where tm.tribe_id = village_threads.tribe_id
        and tm.user_id = auth.uid()
    )
  );

-- ── Village messages ─────────────────────────────────────────
create policy "village_messages: thread tribe members"
  on village_messages for all to authenticated
  using (
    exists (
      select 1
      from village_threads vt
      join tribe_members tm on tm.tribe_id = vt.tribe_id
      where vt.id = village_messages.thread_id
        and tm.user_id = auth.uid()
    )
  );

-- ── Audio rooms ──────────────────────────────────────────────
create policy "audio_rooms: tribe members can read"
  on audio_rooms for select to authenticated
  using (
    exists (
      select 1 from tribe_members tm
      where tm.tribe_id = audio_rooms.tribe_id
        and tm.user_id = auth.uid()
    )
  );

-- ── Discussions ──────────────────────────────────────────────
create policy "discussion_rooms: public read"
  on discussion_rooms for select to authenticated using (true);

create policy "discussion_posts: authenticated read"
  on discussion_posts for select to authenticated using (true);

create policy "discussion_posts: authenticated insert"
  on discussion_posts for insert to authenticated
  with check (auth.uid() = discussion_posts.author_id);

create policy "discussion_posts: author can update/delete"
  on discussion_posts for all to authenticated
  using (auth.uid() = discussion_posts.author_id);

create policy "discussion_replies: authenticated read"
  on discussion_replies for select to authenticated using (true);

create policy "discussion_replies: authenticated insert"
  on discussion_replies for insert to authenticated
  with check (auth.uid() = discussion_replies.author_id);

-- ── Post interactions ────────────────────────────────────────
create policy "post_comments: author all"
  on post_comments for all to authenticated
  using (auth.uid() = post_comments.author_id);

create policy "post_comments: visible if post visible"
  on post_comments for select to authenticated using (true);

create policy "post_likes: own row"
  on post_likes for all to authenticated
  using (auth.uid() = post_likes.user_id);

create policy "post_media: readable with post"
  on post_media for select to authenticated using (true);

-- ── Media ────────────────────────────────────────────────────
create policy "media: owner all"
  on media for all to authenticated
  using (auth.uid() = media.owner_id);

create policy "media: authenticated can read"
  on media for select to authenticated using (true);

-- ── Academy ──────────────────────────────────────────────────
create policy "courses: published readable"
  on courses for select to authenticated
  using (courses.published = true);

create policy "modules: readable by authenticated"
  on modules for select to authenticated using (true);

create policy "lessons: readable by authenticated"
  on lessons for select to authenticated using (true);

create policy "enrollments: own row"
  on enrollments for all to authenticated
  using (auth.uid() = enrollments.user_id);

create policy "lesson_progress: own row"
  on lesson_progress for all to authenticated
  using (auth.uid() = lesson_progress.user_id);

-- ── Mod reports ──────────────────────────────────────────────
create policy "mod_reports: anyone can insert"
  on mod_reports for insert to authenticated
  with check (auth.uid() = mod_reports.reporter_id);

-- ── Crisis resources ─────────────────────────────────────────
create policy "crisis_resources: public"
  on crisis_resources for select using (true);

-- ── Audit log ────────────────────────────────────────────────
-- Only service role (Edge Functions / API routes) can write; no client reads
create policy "audit_log: no client access"
  on audit_log for all using (false);

-- ============================================================
-- TRIGGER: auto-create profile row on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, alias)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'alias',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- REALTIME: enable for live surfaces
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'village_messages'
  ) then
    alter publication supabase_realtime add table village_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'discussion_posts'
  ) then
    alter publication supabase_realtime add table discussion_posts;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'discussion_replies'
  ) then
    alter publication supabase_realtime add table discussion_replies;
  end if;
end $$;
