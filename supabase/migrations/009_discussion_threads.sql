-- 009_discussion_threads.sql
-- Turn discussion_posts into a real thread+reply tree by adding a self-FK
-- parent_id (null = top-level thread, set = reply to that thread).
-- Also add a title column for threads, and a clean RLS suite.

alter table public.discussion_posts
  add column if not exists title text;

alter table public.discussion_posts
  add column if not exists parent_id uuid references public.discussion_posts(id) on delete cascade;

alter table public.discussion_posts
  add column if not exists edited_at timestamptz;

-- Fast lookups for the two main reads:
-- 1) list top-level threads in a room ordered newest-first
-- 2) list replies under a thread ordered oldest-first
create index if not exists discussion_posts_room_top_level
  on public.discussion_posts (room_id, created_at desc)
  where parent_id is null;

create index if not exists discussion_posts_thread_replies
  on public.discussion_posts (parent_id, created_at asc);

-- ─────────────────────────────────────────────────────────────────
-- RLS — clean slate, then four policies
-- ─────────────────────────────────────────────────────────────────
alter table public.discussion_posts enable row level security;

do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'discussion_posts'
  loop
    execute format('drop policy if exists %I on public.discussion_posts', pol.policyname);
  end loop;
end $$;

-- All signed-in users can read discussions (they're public by design)
create policy "discussion_posts_select"
  on public.discussion_posts for select
  to authenticated
  using (true);

-- Insert as yourself only
create policy "discussion_posts_insert"
  on public.discussion_posts for insert
  to authenticated
  with check (author_id = auth.uid());

-- Edit / delete only your own
create policy "discussion_posts_update"
  on public.discussion_posts for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "discussion_posts_delete"
  on public.discussion_posts for delete
  to authenticated
  using (author_id = auth.uid());
