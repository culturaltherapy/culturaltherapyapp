-- 010_notifications.sql
-- A unified notifications table + RLS + triggers that auto-fire on the
-- events that should poke a recipient (new tribe request, request accepted,
-- reply to your thread).

create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade, -- recipient
  kind            text not null check (kind in (
    'tribe_request_received',  -- someone wants to join a tribe you own
    'tribe_invitation',        -- someone invited you to a tribe
    'tribe_accepted',          -- your request / invitation was accepted
    'thread_reply'             -- someone replied to your thread
  )),
  source_user_id  uuid references auth.users(id) on delete set null,
  ref_kind        text,
  ref_id          uuid,
  payload         jsonb not null default '{}'::jsonb,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists notifications_user_unread
  on public.notifications (user_id, created_at desc)
  where read_at is null;

create index if not exists notifications_user_all
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'notifications'
  loop
    execute format('drop policy if exists %I on public.notifications', pol.policyname);
  end loop;
end $$;

-- You can only see / mutate your own notifications.
-- INSERTs are done by SECURITY DEFINER triggers below, not by users.
create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_delete_own"
  on public.notifications for delete
  to authenticated
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- Helper: mark all unread notifications read for current user
-- ─────────────────────────────────────────────────────────────────
create or replace function public.mark_all_notifications_read()
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications
     set read_at = now()
   where user_id = auth.uid() and read_at is null;
$$;

grant execute on function public.mark_all_notifications_read() to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- Trigger: on new tribe_request insert
--   - if user_id != initiated_by → invitation: notify user_id
--   - if user_id == initiated_by → join request: notify tribe owner
-- ─────────────────────────────────────────────────────────────────
create or replace function public.on_tribe_request_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_tribe_name text;
begin
  select owner_id, name into v_owner_id, v_tribe_name
    from public.tribes where id = new.tribe_id;

  if new.user_id <> new.initiated_by then
    -- Invitation: notify the invitee
    insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
    values (
      new.user_id,
      'tribe_invitation',
      new.initiated_by,
      'tribe_request',
      new.id,
      jsonb_build_object('tribe_id', new.tribe_id, 'tribe_name', v_tribe_name, 'message', new.message)
    );
  else
    -- Join request: notify the owner (skip if requester == owner, edge case)
    if v_owner_id is not null and v_owner_id <> new.user_id then
      insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
      values (
        v_owner_id,
        'tribe_request_received',
        new.user_id,
        'tribe_request',
        new.id,
        jsonb_build_object('tribe_id', new.tribe_id, 'tribe_name', v_tribe_name, 'message', new.message)
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists tg_tribe_request_insert on public.tribe_requests;
create trigger tg_tribe_request_insert
  after insert on public.tribe_requests
  for each row execute function public.on_tribe_request_insert();

-- ─────────────────────────────────────────────────────────────────
-- Trigger: on tribe_request status change to 'accepted'
--   Notify the prospective member.
-- ─────────────────────────────────────────────────────────────────
create or replace function public.on_tribe_request_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tribe_name text;
begin
  if old.status = 'pending' and new.status = 'accepted' then
    select name into v_tribe_name from public.tribes where id = new.tribe_id;

    insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
    values (
      new.user_id,
      'tribe_accepted',
      null,
      'tribe',
      new.tribe_id,
      jsonb_build_object('tribe_id', new.tribe_id, 'tribe_name', v_tribe_name)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists tg_tribe_request_update on public.tribe_requests;
create trigger tg_tribe_request_update
  after update on public.tribe_requests
  for each row execute function public.on_tribe_request_update();

-- ─────────────────────────────────────────────────────────────────
-- Trigger: on discussion_posts insert when parent_id IS NOT NULL
--   It's a reply — notify the OP author (unless they're replying to themselves)
-- ─────────────────────────────────────────────────────────────────
create or replace function public.on_discussion_reply_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent_author uuid;
  v_thread_id uuid;
  v_thread_title text;
begin
  if new.parent_id is null then
    return new;  -- not a reply
  end if;

  -- Find the top-level thread (the original) for this reply.
  -- Walk up in case of nested replies (though we currently support one level).
  v_thread_id := new.parent_id;
  loop
    select parent_id, author_id, title
      into v_thread_id, v_parent_author, v_thread_title
      from public.discussion_posts where id = v_thread_id;

    exit when v_thread_id is null or v_parent_author is null;
  end loop;

  -- Re-fetch the top-level author + title (the loop above ends at the root)
  select author_id, coalesce(title, body)
    into v_parent_author, v_thread_title
    from public.discussion_posts where id = new.parent_id;

  if v_parent_author is not null and v_parent_author <> new.author_id then
    insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
    values (
      v_parent_author,
      'thread_reply',
      new.author_id,
      'thread',
      new.parent_id,
      jsonb_build_object('thread_id', new.parent_id, 'thread_title', v_thread_title, 'excerpt', left(new.body, 200))
    );
  end if;

  return new;
end;
$$;

drop trigger if exists tg_discussion_reply_insert on public.discussion_posts;
create trigger tg_discussion_reply_insert
  after insert on public.discussion_posts
  for each row execute function public.on_discussion_reply_insert();
