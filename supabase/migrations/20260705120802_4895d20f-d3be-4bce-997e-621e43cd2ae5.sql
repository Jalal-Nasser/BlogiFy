
-- 1) Categories: restrict public SELECT to Active categories
DROP POLICY IF EXISTS "Categories are public" ON public.categories;
CREATE POLICY "Categories are public when active"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (status = 'Active' AND slug IS NOT NULL);

CREATE POLICY "Admins can view all categories"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Authors: restrict public SELECT to Active authors
DROP POLICY IF EXISTS "Authors are publicly readable" ON public.authors;
CREATE POLICY "Authors are public when active"
  ON public.authors
  FOR SELECT
  TO anon, authenticated
  USING (status = 'Active');

CREATE POLICY "Admins can view all authors"
  ON public.authors
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Media assets: restrict public SELECT to rows attached to a published post
DROP POLICY IF EXISTS "Media assets are publicly readable" ON public.media_assets;
CREATE POLICY "Media assets public only for published posts"
  ON public.media_assets
  FOR SELECT
  TO anon, authenticated
  USING (
    post_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = media_assets.post_id
        AND p.status = 'published'
    )
  );

CREATE POLICY "Admins can view all media_assets"
  ON public.media_assets
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4) Rewrite legacy public storage URLs in posts to the safe proxy path
UPDATE public.posts
SET featured_image_url = REPLACE(
      featured_image_url,
      'https://gwynqitgepkfzzenlfyu.supabase.co/storage/v1/object/public/media/',
      '/media/'
    )
WHERE featured_image_url LIKE 'https://gwynqitgepkfzzenlfyu.supabase.co/storage/v1/object/public/media/%';

UPDATE public.posts
SET content = REPLACE(
      content,
      'https://gwynqitgepkfzzenlfyu.supabase.co/storage/v1/object/public/media/',
      '/media/'
    )
WHERE content LIKE '%https://gwynqitgepkfzzenlfyu.supabase.co/storage/v1/object/public/media/%';
