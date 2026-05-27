# Permanently deleting a user

When you remove someone from Cultural Therapy you must delete them from `auth.users` — not from the `profiles` table. Doing it the other way leaves the email locked in Supabase Auth and the next time that person tries to sign up they hit *"User already registered"*.

## Why the wrong path fails

- **`profiles` is just metadata.** Its primary key references `auth.users(id)` and cascades on delete *from* `auth.users` — not the other way around. Deleting a profile row leaves the auth user untouched, and a fresh row gets re-created automatically by the `on_auth_user_created` trigger the moment the user signs in again.
- **`auth.users` is the source of truth for an email.** Until that row is gone, Supabase Auth will block re-registration with the same address.

## The correct deletion

Open Supabase → SQL Editor and run, as service role:

```sql
-- Replace with the actual email
delete from auth.users where email = 'them@example.com';
```

That single statement deletes the auth user, which cascades through every public table that references it (migration `018_admin_and_cleanup.sql` ensured `on delete cascade` is set everywhere). After it completes:

- `profiles` row gone
- `dm_threads`, `dm_messages` they were part of gone
- `notifications`, `connections`, `tribe_requests`, `posts`, `post_likes`, `post_comments`, `media_likes`, `media_comments`, `prompt_likes`, `prompt_comments`, `profile_media`, `profile_prompts`, `profiles_private` — all gone
- The email is free to register again

## Verifying

After the delete:

```sql
-- Should return 0 rows
select id from auth.users where email = 'them@example.com';
select id from public.profiles where id = (
  select id from auth.users where email = 'them@example.com'
);
```

## Deleting via the dashboard UI

You can also use Supabase Studio → Authentication → Users → the three-dot menu next to a user → "Delete user". That goes through the same auth API and triggers the same cascade. Both routes are equivalent.

## What NOT to do

- Don't right-click a row in the `profiles` Table Editor and delete it — that leaves the auth user intact.
- Don't `delete from public.profiles where ...` directly. Same problem.
- Don't try to manually delete from each FK table — the cascade handles it.

## Soft-delete vs hard-delete

The app already supports **soft delete** for users who want to take a break:

- They go to Settings → Deactivate.
- That sets `profiles.deactivated_at` and hides their profile from the network and from search.
- Their data is kept for 30 days; signing back in within that window restores everything.

Use the SQL purge above only when you genuinely want every trace of the account gone — typically for failed beta sign-ups or moderation actions.
