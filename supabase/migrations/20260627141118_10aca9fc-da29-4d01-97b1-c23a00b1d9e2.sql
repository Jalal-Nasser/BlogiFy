DROP POLICY IF EXISTS auth_all_settings ON public.blog_settings;
CREATE POLICY block_direct_settings ON public.blog_settings
  FOR ALL TO authenticated
  USING (false) WITH CHECK (false);