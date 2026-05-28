-- 024_file_report_rpc.sql
-- The mod_reports INSERT policy "auth.uid() = reporter_id" is correct in
-- isolation but has been intermittently rejecting client-side inserts on
-- the live deploy. To avoid chasing JWT/cookie edge cases in the browser
-- we expose a SECURITY DEFINER RPC that:
--   1. Reads auth.uid() server-side (guaranteed correct in this context)
--   2. Inserts the report with reporter_id = auth.uid()
--   3. Returns the new report id so the client can confirm success
--
-- The client now calls supa.rpc('file_mod_report', {...}) instead of
-- inserting into the table directly.

create or replace function public.file_mod_report(
  p_target_kind  text,
  p_target_table text,
  p_target_id    uuid,
  p_reason       text,
  p_severity     text,
  p_notes        text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report_id uuid;
  v_uid       uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'must be signed in to file a report';
  end if;

  -- The enum types do an implicit cast from text on assignment, so we
  -- can take text args and let the column types validate.
  insert into public.mod_reports (
    reporter_id,
    target_kind,
    target_table,
    target_id,
    reason,
    severity,
    notes
  )
  values (
    v_uid,
    p_target_kind::target_kind,
    p_target_table,
    p_target_id,
    p_reason::report_reason,
    p_severity::report_severity,
    coalesce(p_notes, null)
  )
  returning id into v_report_id;

  return v_report_id;
end;
$$;

grant execute on function public.file_mod_report(text, text, uuid, text, text, text) to authenticated;
