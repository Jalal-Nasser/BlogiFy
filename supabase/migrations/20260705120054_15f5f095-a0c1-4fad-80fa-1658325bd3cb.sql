
-- ============================================================
-- page_views: explicit block on UPDATE / DELETE for all client roles
-- ============================================================
DROP POLICY IF EXISTS "No update of page views" ON public.page_views;
DROP POLICY IF EXISTS "No delete of page views" ON public.page_views;

CREATE POLICY "No update of page views"
  ON public.page_views FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No delete of page views"
  ON public.page_views FOR DELETE
  TO anon, authenticated
  USING (false);

-- ============================================================
-- storage.objects (media bucket): stop public listing
-- Direct downloads via the public CDN endpoint
-- (/storage/v1/object/public/media/...) do NOT consult RLS,
-- so published article images keep loading. Listing via the API
-- DOES consult RLS — we now restrict it to admins only.
-- ============================================================
DROP POLICY IF EXISTS "Public read media" ON storage.objects;

CREATE POLICY "Admins can list media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- has_role(): revoke EXECUTE from PUBLIC/anon, keep for authenticated
-- Anonymous callers never need to check role membership; RLS policies
-- that call has_role() only run for authenticated users.
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
