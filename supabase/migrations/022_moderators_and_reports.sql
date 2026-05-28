-- 022_moderators_and_reports.sql
-- Wire the existing mod_reports / audit_log / crisis tables into a live
-- moderation system:
--
--   1. A profiles.is_moderator flag, plus a SQL helper is_moderator(uid).
--   2. Seed PoeticKojo + Cultural Therapy Team as moderators with calls/video
--      capabilities unlocked.
--   3. An is_hidden column on every user-content table (profile_media reuses
--      its existing 'flagged' column), with SELECT RLS that filters hidden
--      content for everyone except the owner or a moderator.
--   4. SELECT + UPDATE RLS on mod_reports so moderators can read & triage.
--   5. A target_table column on mod_reports so we know precisely which row
--      a report is about (the existing target_kind enum is too coarse for
--      e.g. the three different comment tables).
--   6. Notification kinds for report_received and report_crisis, plus an
--      INSERT trigger on mod_reports that fans out an in-app notification
--      to every moderator (and queues an email for crisis-severity).
--   7. Two security-definer RPCs the dashboard can call:
--      mod_set_report_status() and mod_hide_content(). Both self-check
--      is_moderator() and write to audit_log.

-- ─────────────────────────────────────────────────────────────
-- 1) profiles.is_moderator + helper
-- ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_moderator boolean not null default false;

create or replace function public.is_moderator(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_moderator from public.profiles where id = uid), false);
$$;

grant execute on function public.is_moderator(uuid) to authenticated;

-- Seed moderators. Idempotent — re-running is harmless.
update public.profiles
   set is_moderator     = true,
       is_peer_supporter = true,
       accepts_calls    = true,
       accepts_video    = true
 where alias ilike 'poetickojo%'
    or alias ilike 'cultural therapy team%';

-- ─────────────────────────────────────────────────────────────
-- 2) is_hidden columns on content tables
-- ─────────────────────────────────────────────────────────────
alter table public.posts             add column if not exists is_hidden boolean not null default false;
alter table public.post_comments     add column if not exists is_hidden boolean not null default false;
alter table public.profile_prompts   add column if not exists is_hidden boolean not null default false;
alter table public.media_comments    add column if not exists is_hidden boolean not null default false;
alter table public.prompt_comments   add column if not exists is_hidden boolean not null default false;
alter table public.discussion_posts  add column if not exists is_hidden boolean not null default false;
-- profile_media already has 'flagged' (migration 012). We treat that as the
-- equivalent of is_hidden; mod_hide_content() handles the rename internally.

-- ─────────────────────────────────────────────────────────────
-- 3) SELECT RLS — collapse existing policies into a single one
--    per table that ORs together visibility, ownership and the
--    is_hidden + moderator override clauses.
-- ─────────────────────────────────────────────────────────────

-- posts ── replaces migration 006 split policies
do $$ declare pol record; begin
  for pol in select policyname from pg_policies
              where schemaname='public' and tablename='posts'
                and policyname like 'posts_select%'
  loop
    execute format('drop policy if exists %I on public.posts', pol.policyname);
  end loop;
end $$;

create policy "posts_select" on public.posts for select to authenticated using (
  public.is_moderator(auth.uid())
  or owner_id = auth.uid()
  or (
    is_hidden = false
    and (
      visibility = 'public'
      or (visibility = 'tribe' and exists (
        select 1
          from public.tribe_members tm_o
          join public.tribe_members tm_v on tm_v.tribe_id = tm_o.tribe_id
         where tm_o.user_id = posts.owner_id
           and tm_v.user_id = auth.uid()
      ))
      or (visibility = 'village' and village_id is not null and public.is_tribe_member(village_id))
    )
  )
);

-- post_comments
drop policy if exists "post_comments_select" on public.post_comments;
create policy "post_comments_select" on public.post_comments for select to authenticated using (
  (
    is_hidden = false
    or author_id = auth.uid()
    or public.is_moderator(auth.uid())
  )
  and exists (select 1 from public.posts p where p.id = post_comments.post_id)
);

-- profile_prompts ── replaces migration 015 SELECT
drop policy if exists "profile_prompts_select" on public.profile_prompts;
create policy "profile_prompts_select" on public.profile_prompts for select to authenticated using (
  public.is_moderator(auth.uid())
  or user_id = auth.uid()
  or (is_hidden = false and visibility in ('public', 'tribe'))
);

-- profile_media ── flagged acts as is_hidden
drop policy if exists "profile_media_select" on public.profile_media;
create policy "profile_media_select" on public.profile_media for select to authenticated using (
  public.is_moderator(auth.uid())
  or owner_id = auth.uid()
  or flagged = false
);

-- media_comments
drop policy if exists "media_comments_select" on public.media_comments;
create policy "media_comments_select" on public.media_comments for select to authenticated using (
  (
    is_hidden = false
    or author_id = auth.uid()
    or public.is_moderator(auth.uid())
  )
  and exists (select 1 from public.profile_media m where m.id = media_comments.media_id)
);

-- prompt_comments
drop policy if exists "prompt_comments_select" on public.prompt_comments;
create policy "prompt_comments_select" on public.prompt_comments for select to authenticated using (
  (
    is_hidden = false
    or author_id = auth.uid()
    or public.is_moderator(auth.uid())
  )
  and exists (select 1 from public.profile_prompts pr where pr.id = prompt_comments.prompt_id)
);

-- discussion_posts
drop policy if exists "discussion_posts_select" on public.discussion_posts;
create policy "discussion_posts_select" on public.discussion_posts for select to authenticated using (
  is_hidden = false
  or author_id = auth.uid()
  or public.is_moderator(auth.uid())
);

-- ─────────────────────────────────────────────────────────────
-- 4) mod_reports.target_table column + RLS
-- ─────────────────────────────────────────────────────────────
alter table public.mod_reports
  add column if not exists target_table text;

alter table public.mod_reports enable row level security;

drop policy if exists "mod_reports_select_moderator" on public.mod_reports;
create policy "mod_reports_select_moderator" on public.mod_reports for select to authenticated
  using (public.is_moderator(auth.uid()));

drop policy if exists "mod_reports_update_moderator" on public.mod_reports;
create policy "mod_reports_update_moderator" on public.mod_reports for update to authenticated
  using (public.is_moderator(auth.uid()))
  with check (public.is_moderator(auth.uid()));

-- Existing INSERT policy from migration 001 stays in place (reporters can
-- insert their own reports).

-- audit_log SELECT for moderators
alter table public.audit_log enable row level security;

drop policy if exists "audit_log_select_moderator" on public.audit_log;
create policy "audit_log_select_moderator" on public.audit_log for select to authenticated
  using (public.is_moderator(auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 5) Notification kinds + email_queue template extensions
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
    'report_crisis'
  ));

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
    'report_crisis'
  ));

-- ─────────────────────────────────────────────────────────────
-- 6) Trigger: fan out reports to moderators
-- ─────────────────────────────────────────────────────────────
create or replace function public.on_mod_report_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare m record;
begin
  for m in select id from public.profiles where is_moderator = true loop
    insert into public.notifications (user_id, kind, source_user_id, ref_kind, ref_id, payload)
    values (
      m.id,
      case when new.severity = 'crisis' then 'report_crisis' else 'report_received' end,
      new.reporter_id,
      'mod_report',
      new.id,
      jsonb_build_object(
        'target_kind',  new.target_kind,
        'target_table', new.target_table,
        'target_id',    new.target_id,
        'reason',       new.reason,
        'severity',     new.severity
      )
    );

    -- Crisis → also queue an email (bypasses the DM debounce path; this is
    -- its own template). Look up the moderator's email from auth.users.
    if new.severity = 'crisis' then
      insert into public.account_email_queue (user_id, to_email, template, payload)
      select m.id,
             u.email,
             'report_crisis',
             jsonb_build_object(
               'report_id',    new.id,
               'target_kind',  new.target_kind,
               'target_table', new.target_table,
               'reason',       new.reason,
               'severity',     new.severity,
               'notes',        coalesce(new.notes, '')
             )
        from auth.users u
       where u.id = m.id
         and u.email is not null;
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists tg_mod_report_insert on public.mod_reports;
create trigger tg_mod_report_insert
  after insert on public.mod_reports
  for each row execute function public.on_mod_report_insert();

-- ─────────────────────────────────────────────────────────────
-- 7) Moderator-action RPCs
-- ─────────────────────────────────────────────────────────────

-- Set status + optional notes. Writes to audit_log.
create or replace function public.mod_set_report_status(
  p_report_id uuid,
  p_status report_status,
  p_notes text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_moderator(auth.uid()) then
    raise exception 'not authorised';
  end if;

  update public.mod_reports
     set status = p_status,
         notes  = coalesce(p_notes, notes)
   where id = p_report_id;

  insert into public.audit_log (actor_id, action, target_kind, target_id, meta)
  values (
    auth.uid(),
    'report_status_' || p_status::text,
    'mod_report',
    p_report_id,
    jsonb_build_object('notes', p_notes)
  );
end;
$$;

grant execute on function public.mod_set_report_status(uuid, report_status, text) to authenticated;

-- Hide / unhide a content row. p_table must be one of the allowed
-- content tables. profile_media uses 'flagged' under the hood.
create or replace function public.mod_hide_content(
  p_table  text,
  p_row_id uuid,
  p_hide   boolean default true
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_tables text[] := array[
    'posts',
    'post_comments',
    'profile_prompts',
    'profile_media',
    'media_comments',
    'prompt_comments',
    'discussion_posts'
  ];
begin
  if not public.is_moderator(auth.uid()) then
    raise exception 'not authorised';
  end if;
  if not (p_table = any (allowed_tables)) then
    raise exception 'unknown table %', p_table;
  end if;

  if p_table = 'profile_media' then
    execute format('update public.%I set flagged = $1 where id = $2', p_table)
      using p_hide, p_row_id;
  else
    execute format('update public.%I set is_hidden = $1 where id = $2', p_table)
      using p_hide, p_row_id;
  end if;

  insert into public.audit_log (actor_id, action, target_kind, target_id, meta)
  values (
    auth.uid(),
    case when p_hide then 'content_hidden' else 'content_restored' end,
    p_table,
    p_row_id,
    jsonb_build_object()
  );
end;
$$;

grant execute on function public.mod_hide_content(text, uuid, boolean) to authenticated;
