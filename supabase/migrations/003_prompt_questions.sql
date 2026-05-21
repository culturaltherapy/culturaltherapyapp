-- 003_prompt_questions.sql
-- profile_prompts originally only stored an `answer` plus a generic prompt_id.
-- We also need to keep the actual question text so the profile page can show
-- it back to the user (and to anyone viewing their card).

alter table public.profile_prompts
  add column if not exists question text;

-- Allow longer questions/answers
alter table public.profile_prompts
  alter column answer type text;
