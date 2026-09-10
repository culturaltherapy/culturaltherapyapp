-- 027_notification_emails.sql
-- Extends the account_email_queue pipeline (already used for DMs and crisis
-- reports) to cover the rest of the in-app notification kinds: Tribe
-- activity, connections, thread replies, and likes/comments.
--
-- Per-category opt-outs (all default true, mirroring email_on_dm):
--   email_on_tribe_activity   — tribe_request_received, tribe_invitation, tribe_accepted
--   email_on_connections      — connection_request, connection_accepted
--   email_on_replies          — thread_reply
--   email_on_likes_comments   — post/media/prompt like + comment (6 kinds)
--
-- Likes/comments are high-volume by nature, so those 6 kinds are debounced
-- to one email per (recipient, kind, item) per 60 minutes — a post that
-- gets 50 likes in an hour sends one email, not 50. Thread replies get the
-- same 15-minute-per-thread debounce already used for DMs. Tribe/connection
-- events aren't debounced — they're naturally low-volume already.

-- ─────────────────────────────────────────────────────────────
-- 1) Per-category opt-out columns
-- ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists email_on_tribe_activity boolean not null default true;

alter table public.profiles
  add column if not exists email_on_connections boolean not null default true;

alter table public.profiles
  add column if not exists email_on_replies boolean not null default true;

alter table public.profiles
  add column if not exists email_on_likes_comments boolean not null default true;

-- ─────────────────────────────────────────────────────────────
-- 2) Extend account_email_queue.template with the 12 new kinds
-- ─────────────────────────────────────────────────────────────
alter table public.account_email_queue
  drop constraint if exists account_email_queue_template_check;

alter table public.account_email_queue
  add constraint account_email_queue_template_check
  check (template in (
    'account_deactivated',
    'account_reactivated',
    'deletion_requested',
    'deletion_completed',
    'direct_message',
    'report_crisis',
    'welcome_signup',
    'welcome_onboarding',
    'tribe_request_received',
    'tribe_invitation',
    'tribe_accepted',
    'connection_request',
    'connection_accepted',
    'thread_reply',
    'post_comment',
    'post_like',
    'media_comment',
    'media_like',
    'prompt_comment',
    'prompt_like'
  ));

-- ─────────────────────────────────────────────────────────────
-- 3) Shared helper: opt-out check + debounce + queue insert.
--    Every trigger below calls this instead of duplicating the same
--    lookup/debounce/insert logic that on_dm_message_insert already had.
-- ─────────────────────────────────────────────────────────────
create or replace function public.queue_notification_email(
  p_recipient_id     uuid,
  p_opt_in           boolean,
  p_template         text,
  p_debounce_ref     uuid,     -- null => never debounce this call
  p_debounce_minutes int,      -- ignored when p_debounce_ref is null
  p_payload          jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email  text;
  v_recent int;
begin
  if p_opt_in is distinct from true then return; end if;

  select email into v_email from auth.users where id = p_recipient_id;
  if v_email is null then return; end if;

  if p_debounce_ref is not null and p_debounce_minutes > 0 then
    select count(*) into v_recent
      from public.account_email_queue
     where user_id = p_recipient_id
       and template = p_template
       and (payload->>'debounce_ref') = p_debounce_ref::text
       and created_at > now() - (p_debounce_minutes || ' minutes')::interval;
    if v_recent > 0 then return; end if;
  end if;

  insert into public.account_email_queue (user_id, to_email, template, payload)
  values (
    p_recipient_id,
    v_email,
    p_template,
    p_payload || jsonb_build_object('debounce_ref', p_debounce_ref)
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 4) Tribe activity — on_tribe_request_insert / on_tribe_request_update
-- ─────────────────────────────────────────────────────────────
create or replace function public.on_tribe_request_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_tribe_name text;
  v_actor_alias text;
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

    select alias into v_actor_alias from public.profiles where id = new.initiated_by;
    perform public.queue_notification_email(
      new.user_id,
      (select email_on_tribe_activity from public.profiles where id = new.user_id),
      'tribe_invitation',
      null, 0,
      jsonb_build_object('tribe_id', new.tribe_id, 'tribe_name', v_tribe_name, 'actor_alias', coalesce(v_actor_alias, 'A member'))
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

      select alias into v_actor_alias from public.profiles where id = new.user_id;
      perform public.queue_notification_email(
        v_owner_id,
        (select email_on_tribe_activity from public.profiles where id = v_owner_id),
        'tribe_request_received',
        null, 0,
        jsonb_build_object('tribe_id', new.tribe_id, 'tribe_name', v_tribe_name, 'actor_alias', coalesce(v_actor_alias, 'A member'))
      );
    end if;
  end if;

  return new;
end;
$$;

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

    perform public.queue_notification_email(
      new.user_id,
      (select email_on_tribe_activity from public.profiles where id = new.user_id),
      'tribe_accepted',
      null, 0,
      jsonb_build_object('tribe_id', new.tribe_id, 'tribe_name', v_tribe_name)
    );
  end if;
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 5) Connections — on_connection_insert / on_connection_update
-- ─────────────────────────────────────────────────────────────
create or replace function public.on_connection_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor_alias text;
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

  select alias into v_actor_alias from public.profiles where id = new.requester_id;
  perform public.queue_notification_email(
    new.recipient_id,
    (select email_on_connections from public.profiles where id = new.recipient_id),
    'connection_request',
    null, 0,
    jsonb_build_object('actor_alias', coalesce(v_actor_alias, 'A member'))
  );

  return new;
end;
$$;

create or replace function public.on_connection_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor_alias text;
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

    select alias into v_actor_alias from public.profiles where id = new.recipient_id;
    perform public.queue_notification_email(
      new.requester_id,
      (select email_on_connections from public.profiles where id = new.requester_id),
      'connection_accepted',
      null, 0,
      jsonb_build_object('actor_alias', coalesce(v_actor_alias, 'A member'))
    );
  end if;
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 6) Thread replies — on_discussion_reply_insert
--    Debounced 15 min per thread, same window as DMs.
-- ─────────────────────────────────────────────────────────────
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
  v_actor_alias text;
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

    select alias into v_actor_alias from public.profiles where id = new.author_id;
    perform public.queue_notification_email(
      v_parent_author,
      (select email_on_replies from public.profiles where id = v_parent_author),
      'thread_reply',
      new.parent_id, 15,
      jsonb_build_object('thread_title', v_thread_title, 'excerpt', left(new.body, 200), 'actor_alias', coalesce(v_actor_alias, 'A member'))
    );
  end if;

  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 7) Likes & comments — post / media / prompt.
--    Debounced 60 min per (recipient, kind, item).
-- ─────────────────────────────────────────────────────────────
create or replace function public.on_post_comment_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner_id uuid;
  v_actor_alias text;
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

  select alias into v_actor_alias from public.profiles where id = new.author_id;
  perform public.queue_notification_email(
    v_owner_id,
    (select email_on_likes_comments from public.profiles where id = v_owner_id),
    'post_comment',
    new.post_id, 60,
    jsonb_build_object('excerpt', left(new.body, 200), 'actor_alias', coalesce(v_actor_alias, 'A member'))
  );
  return new;
end;
$$;

create or replace function public.on_post_like_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner_id uuid;
  v_actor_alias text;
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

  select alias into v_actor_alias from public.profiles where id = new.user_id;
  perform public.queue_notification_email(
    v_owner_id,
    (select email_on_likes_comments from public.profiles where id = v_owner_id),
    'post_like',
    new.post_id, 60,
    jsonb_build_object('actor_alias', coalesce(v_actor_alias, 'A member'))
  );
  return new;
end;
$$;

create or replace function public.on_media_comment_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner_id uuid;
  v_actor_alias text;
begin
  select owner_id into v_owner_id from public.profile_media where id = new.media_id;
  if v_owner_id is null or v_owner_id = new.author_id then return new; end if;
  insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
  values (
    v_owner_id, 'media_comment', new.author_id, 'media', new.media_id,
    jsonb_build_object('excerpt', left(new.body, 200))
  );

  select alias into v_actor_alias from public.profiles where id = new.author_id;
  perform public.queue_notification_email(
    v_owner_id,
    (select email_on_likes_comments from public.profiles where id = v_owner_id),
    'media_comment',
    new.media_id, 60,
    jsonb_build_object('excerpt', left(new.body, 200), 'actor_alias', coalesce(v_actor_alias, 'A member'))
  );
  return new;
end;
$$;

create or replace function public.on_media_like_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner_id uuid;
  v_actor_alias text;
begin
  select owner_id into v_owner_id from public.profile_media where id = new.media_id;
  if v_owner_id is null or v_owner_id = new.user_id then return new; end if;
  insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
  values (v_owner_id, 'media_like', new.user_id, 'media', new.media_id, '{}'::jsonb);

  select alias into v_actor_alias from public.profiles where id = new.user_id;
  perform public.queue_notification_email(
    v_owner_id,
    (select email_on_likes_comments from public.profiles where id = v_owner_id),
    'media_like',
    new.media_id, 60,
    jsonb_build_object('actor_alias', coalesce(v_actor_alias, 'A member'))
  );
  return new;
end;
$$;

create or replace function public.on_prompt_comment_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner_id uuid;
  v_actor_alias text;
begin
  select user_id into v_owner_id from public.profile_prompts where id = new.prompt_id;
  if v_owner_id is null or v_owner_id = new.author_id then return new; end if;
  insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
  values (
    v_owner_id, 'prompt_comment', new.author_id, 'prompt', new.prompt_id,
    jsonb_build_object('excerpt', left(new.body, 200))
  );

  select alias into v_actor_alias from public.profiles where id = new.author_id;
  perform public.queue_notification_email(
    v_owner_id,
    (select email_on_likes_comments from public.profiles where id = v_owner_id),
    'prompt_comment',
    new.prompt_id, 60,
    jsonb_build_object('excerpt', left(new.body, 200), 'actor_alias', coalesce(v_actor_alias, 'A member'))
  );
  return new;
end;
$$;

create or replace function public.on_prompt_like_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner_id uuid;
  v_actor_alias text;
begin
  select user_id into v_owner_id from public.profile_prompts where id = new.prompt_id;
  if v_owner_id is null or v_owner_id = new.user_id then return new; end if;
  insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
  values (v_owner_id, 'prompt_like', new.user_id, 'prompt', new.prompt_id, '{}'::jsonb);

  select alias into v_actor_alias from public.profiles where id = new.user_id;
  perform public.queue_notification_email(
    v_owner_id,
    (select email_on_likes_comments from public.profiles where id = v_owner_id),
    'prompt_like',
    new.prompt_id, 60,
    jsonb_build_object('actor_alias', coalesce(v_actor_alias, 'A member'))
  );
  return new;
end;
$$;
