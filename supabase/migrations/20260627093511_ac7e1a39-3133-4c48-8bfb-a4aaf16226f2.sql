DROP POLICY IF EXISTS "allow_authed_keywords" ON public.seo_keywords;
DROP POLICY IF EXISTS "allow_authed_rankings" ON public.seo_rankings;
DROP POLICY IF EXISTS "allow_authed_audits"   ON public.seo_audits;

CREATE POLICY "admin_only_keywords" ON public.seo_keywords
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'jnasser1983@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'jnasser1983@gmail.com');

CREATE POLICY "admin_only_rankings" ON public.seo_rankings
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'jnasser1983@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'jnasser1983@gmail.com');

CREATE POLICY "admin_only_audits" ON public.seo_audits
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'jnasser1983@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'jnasser1983@gmail.com');