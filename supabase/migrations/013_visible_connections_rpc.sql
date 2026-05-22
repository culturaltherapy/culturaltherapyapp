-- 013_visible_connections_rpc.sql
-- The connections SELECT RLS only lets you see rows you participate in,
-- which is correct security but means we can't render someone else's
-- connection list directly. This SECURITY DEFINER RPC encapsulates the
-- visibility check (using the profile's connections_visibility column)
-- and returns the appropriate accepted connections.

create or replace function public.get_visible_connections(p_user_id uuid)
returns table (
  connection_id     uuid,
  other_id          uuid,
  other_alias       text,
  other_avatar_url  text,
  responded_at      timestamptz,
  created_at        timestamptz
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_visibility text;
  v_shares_tribe boolean;
begin
  if v_caller is null then return; end if;

  -- Always allow viewing your own connections
  if v_caller <> p_user_id then
    select connections_visibility into v_visibility
      from public.profiles where id = p_user_id;

    if v_visibility is null or v_visibility = 'private' then return; end if;

    if v_visibility = 'tribe' then
      select exists (
        select 1
          from public.tribe_members tm_target
          join public.tribe_members tm_caller
            on tm_target.tribe_id = tm_caller.tribe_id
         where tm_target.user_id = p_user_id
           and tm_caller.user_id = v_caller
      ) into v_shares_tribe;
      if not v_shares_tribe then return; end if;
    end if;
    -- visibility = 'public' falls through to the select below
  end if;

  return query
    select
      c.id,
      case when c.requester_id = p_user_id then c.recipient_id else c.requester_id end,
      p.alias,
      p.avatar_url,
      c.responded_at,
      c.created_at
      from public.connections c
      join public.profiles p
        on p.id = case when c.requester_id = p_user_id then c.recipient_id else c.requester_id end
     where c.status = 'accepted'
       and (c.requester_id = p_user_id or c.recipient_id = p_user_id)
     order by c.responded_at desc nulls last, c.created_at desc;
end;
$$;

grant execute on function public.get_visible_connections(uuid) to authenticated;
