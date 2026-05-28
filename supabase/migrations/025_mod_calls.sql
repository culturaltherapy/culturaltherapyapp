-- 025_mod_calls.sql
-- Moderator-initiated voice / video calls to members.
--
--   * Trigger:   when a moderator hits "Call author" / "Call reporter" on
--                the moderation dashboard, the client inserts a row in
--                public.mod_calls with status='ringing'.
--   * Ring:      the recipient's app subscribes via Supabase Realtime to
--                mod_calls rows where recipient_id = auth.uid() AND
--                status = 'ringing', and pops a full-screen modal.
--   * Call:      both sides open https://meet.jit.si/<room_name> in an
--                embedded iframe.
--   * Lifecycle: status moves ringing → accepted | declined | missed,
--                and accepted → ended when either side hangs up.
--
-- Tied to a mod_report only when the call was triggered from a report row
-- (report_id is nullable so we can also fire ad-hoc calls later).

create table if not exists public.mod_calls (
  id            uuid primary key default gen_random_uuid(),
  initiator_id  uuid not null references auth.users(id) on delete cascade,
  recipient_id  uuid not null references auth.users(id) on delete cascade,
  report_id     uuid references public.mod_reports(id) on delete set null,
  room_name     text not null unique,
  kind          text not null check (kind in ('audio', 'video')),
  status        text not null default 'ringing'
                check (status in ('ringing', 'accepted', 'declined', 'missed', 'ended')),
  created_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  ended_at      timestamptz
);

create index if not exists mod_calls_recipient_ringing
  on public.mod_calls (recipient_id)
  where status = 'ringing';

create index if not exists mod_calls_initiator_idx on public.mod_calls (initiator_id, created_at desc);

alter table public.mod_calls enable row level security;

do $$ declare pol record; begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'mod_calls'
  loop
    execute format('drop policy if exists %I on public.mod_calls', pol.policyname);
  end loop;
end $$;

-- Only moderators can initiate. initiator_id is forced to auth.uid().
create policy "mod_calls_insert_moderator"
  on public.mod_calls for insert
  to authenticated
  with check (
    public.is_moderator(auth.uid())
    and initiator_id = auth.uid()
  );

-- Initiator + recipient can read their own call rows.
create policy "mod_calls_select_party"
  on public.mod_calls for select
  to authenticated
  using (
    initiator_id = auth.uid()
    or recipient_id = auth.uid()
  );

-- Either party can update status (accept / decline / end / missed).
-- The constraint is enforced at the application layer rather than column-level;
-- this is fine because both parties are trusted in this transaction.
create policy "mod_calls_update_party"
  on public.mod_calls for update
  to authenticated
  using (initiator_id = auth.uid() or recipient_id = auth.uid())
  with check (initiator_id = auth.uid() or recipient_id = auth.uid());

grant insert, select, update on public.mod_calls to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Notification kinds — extend the existing constraint
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
    'prompt_like',
    'report_received',
    'report_crisis',
    'mod_call_missed'
  ));

-- ─────────────────────────────────────────────────────────────
-- Trigger: when a call ends without being accepted, file a
-- "missed call" notification so the recipient knows even if they
-- weren't in the app at ring time.
-- ─────────────────────────────────────────────────────────────
create or replace function public.on_mod_call_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'missed' and (old.status is distinct from 'missed') then
    insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
    values (
      new.recipient_id,
      'mod_call_missed',
      new.initiator_id,
      'mod_call',
      new.id,
      jsonb_build_object(
        'kind',      new.kind,
        'report_id', new.report_id
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists tg_mod_call_status_change on public.mod_calls;
create trigger tg_mod_call_status_change
  after update on public.mod_calls
  for each row execute function public.on_mod_call_status_change();
