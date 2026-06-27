
-- 1. Drop sensitive columns
ALTER TABLE public.authors DROP COLUMN IF EXISTS email;
ALTER TABLE public.blog_settings DROP COLUMN IF EXISTS admin_email;

-- 2. Replace USING(true) policies with auth.uid() IS NOT NULL
DROP POLICY IF EXISTS "Authenticated manage activity_events" ON public.activity_events;
CREATE POLICY "Authenticated manage activity_events" ON public.activity_events
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated manage authors" ON public.authors;
CREATE POLICY "Authenticated manage authors" ON public.authors
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated manage categories" ON public.categories;
CREATE POLICY "Authenticated manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated manage media_assets" ON public.media_assets;
CREATE POLICY "Authenticated manage media_assets" ON public.media_assets
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated manage post_tags" ON public.post_tags;
CREATE POLICY "Authenticated manage post_tags" ON public.post_tags
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated manage posts" ON public.posts;
CREATE POLICY "Authenticated manage posts" ON public.posts
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated manage tags" ON public.tags;
CREATE POLICY "Authenticated manage tags" ON public.tags
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Lock blog_settings to service_role only (drop authenticated access)
DROP POLICY IF EXISTS "Authenticated manage blog_settings" ON public.blog_settings;
REVOKE ALL ON public.blog_settings FROM anon, authenticated;
GRANT ALL ON public.blog_settings TO service_role;
