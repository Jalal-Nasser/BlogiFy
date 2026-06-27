
-- Add authenticated SELECT for newsletter_subscribers (admins)
CREATE POLICY "Authenticated can read newsletter subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Add scoped DELETE for media bucket (authenticated = site admin)
CREATE POLICY "Authenticated delete media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'media');
