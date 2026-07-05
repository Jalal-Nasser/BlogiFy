
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS published_to_linkedin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS linkedin_post_id text,
  ADD COLUMN IF NOT EXISTS linkedin_post_url text,
  ADD COLUMN IF NOT EXISTS linkedin_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS linkedin_publish_error text;
