-- 008_profile_extras.sql
-- Adds birth_year (for age display, privacy-safer than storing a full DOB)
-- and social_links (jsonb array of { platform, url } objects).

alter table public.profiles
  add column if not exists birth_year smallint;

alter table public.profiles
  drop constraint if exists profiles_birth_year_check;

alter table public.profiles
  add constraint profiles_birth_year_check
  check (birth_year is null or (birth_year between 1900 and 2030));

alter table public.profiles
  add column if not exists social_links jsonb not null default '[]'::jsonb;
