-- 007_tribes_discoverable.sql
-- Migration 004 locked tribes SELECT to owner-or-member, which made the
-- Discover Tribes section impossible — non-members couldn't see anything
-- to request joining. Tribes are meant to be discoverable; only the
-- Village (threads + messages) and membership list are private.

drop policy if exists "tribes_select" on public.tribes;

-- Any signed-in user can see basic tribe info (for discovery).
-- Membership rows and village_threads have their own restrictive policies.
create policy "tribes_select"
  on public.tribes for select
  to authenticated
  using (true);

-- (insert/update/delete policies from migration 004 are unchanged —
--  only owners can modify or delete a tribe.)
