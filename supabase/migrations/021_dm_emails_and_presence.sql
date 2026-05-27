-- 021_dm_emails_and_presence.sql
-- Two unrelated features bundled into one migration:
--   1) Email-on-DM: when a user receives a direct message, also queue an
--      "you have a new message" email. Throttled to one email per
--      (recipient, thread) per 15 minutes so fast back-and-forth doesn't
--      flood the inbox. Per-user opt-out via profiles.email_on_dm.
--   2) "Active recently" presence: a last_seen_at column on profiles plus a
--      touch_last_seen RPC the client pings every ~60s. Used by the green
--      dot indicator next to avatars.

-- ─────────────────────────────────────────────────────────────
-- 1) Profile flags + presence column
-- ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists email_on_dm boolean not null default true;

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

-- Index for "show me people active in the last X minutes" lookups.
create index if not exists profiles_last_seen_idx
  on public.profiles (last_seen_at desc nulls last);

-- ─────────────────────────────────────────────────────────────
-- 2) touch_last_seen RPC
-- Called by the client every ~60s. security definer so it works
-- regardless of how RLS is configured on profiles.
-- ─────────────────────────────────────────────────────────────
create or replace function public.touch_last_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return; end if;
  update public.profiles
     set last_seen_at = now()
   where id = auth.uid();
end;
$$;

grant execute on function public.touch_last_seen() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3) Extend account_email_queue.template to accept 'direct_message'
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
    'direct_message'
  ));

-- ─────────────────────────────────────────────────────────────
-- 4) Rewrite on_dm_message_insert to also queue an email
--    (subject to email_on_dm + 15-minute debounce per thread)
-- ─────────────────────────────────────────────────────────────
create or replace function public.on_dm_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient_id   uuid;
  v_recipient_mail text;
  v_recipient_opt  boolean;
  v_sender_alias   text;
  v_recent_count   int;
begin
  -- Who is the recipient?
  select case when user_a = new.sender_id then user_b else user_a end
    into v_recipient_id
    from public.dm_threads where id = new.thread_id;

  if v_recipient_id is null then return new; end if;

  -- In-app notification (unchanged from migration 012)
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

  -- Email path. We bail out at the first failed condition rather than
  -- raising — a missing email or disabled toggle shouldn't block the
  -- message itself.
  select email_on_dm into v_recipient_opt
    from public.profiles where id = v_recipient_id;
  if v_recipient_opt is distinct from true then return new; end if;

  select email into v_recipient_mail
    from auth.users where id = v_recipient_id;
  if v_recipient_mail is null then return new; end if;

  -- Debounce: did we already queue a direct_message email for this
  -- recipient + thread within the last 15 minutes? If so, skip.
  select count(*) into v_recent_count
    from public.account_email_queue
   where user_id = v_recipient_id
     and template = 'direct_message'
     and (payload->>'thread_id')::uuid = new.thread_id
     and created_at > now() - interval '15 minutes';

  if v_recent_count > 0 then return new; end if;

  -- Look up sender alias for the email subject line
  select alias into v_sender_alias
    from public.profiles where id = new.sender_id;

  insert into public.account_email_queue (user_id, to_email, template, payload)
  values (
    v_recipient_id,
    v_recipient_mail,
    'direct_message',
    jsonb_build_object(
      'thread_id',     new.thread_id,
      'sender_alias',  coalesce(v_sender_alias, 'A member'),
      'excerpt',       left(new.body, 200)
    )
  );

  return new;
end;
$$;

-- Trigger itself is unchanged — just re-attaching for safety
drop trigger if exists tg_dm_message_insert on public.dm_messages;
create trigger tg_dm_message_insert
  after insert on public.dm_messages
  for each row execute function public.on_dm_message_insert();
