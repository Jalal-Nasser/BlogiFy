DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "No public read of subscribers" ON public.newsletter_subscribers;
CREATE POLICY block_direct_newsletter ON public.newsletter_subscribers
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
REVOKE INSERT, SELECT, UPDATE, DELETE ON public.newsletter_subscribers FROM anon, authenticated;