DROP POLICY IF EXISTS "Public read published posts" ON public.posts;

CREATE POLICY "Anon read published posts"
  ON public.posts
  FOR SELECT
  TO anon
  USING (status = 'published');

CREATE POLICY "Admin read all posts"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);