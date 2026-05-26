-- 019_media_500mb.sql
-- Now that the project is on Supabase Pro, raise the per-file cap on the
-- profile-media bucket from 25 MB to 500 MB (524,288,000 bytes).
--
-- Client uploads larger than ~50 MB use TUS resumable uploads (see
-- components/media/MediaUploader.tsx) because a single-shot upload would
-- otherwise time out and offer no progress.

update storage.buckets
   set file_size_limit = 524288000  -- 500 MB
 where id = 'profile-media';
