DELETE FROM public.page_views;

DROP POLICY IF EXISTS "Anyone can insert a page view" ON public.page_views;
DROP POLICY IF EXISTS "Authenticated can read page views" ON public.page_views;

CREATE POLICY "Public can insert validated page views"
  ON public.page_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    visitor_id IS NOT NULL
    AND length(visitor_id) > 0
    AND length(visitor_id) <= 128
    AND path IS NOT NULL
    AND length(path) > 0
    AND length(path) <= 2048
    AND (referrer IS NULL OR length(referrer) <= 2048)
    AND (country IS NULL OR length(country) <= 8)
  );

CREATE POLICY "Authenticated can read page views"
  ON public.page_views
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);