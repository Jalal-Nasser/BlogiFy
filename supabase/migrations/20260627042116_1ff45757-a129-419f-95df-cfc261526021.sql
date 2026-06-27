
DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact"
  ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) > 0
    AND length(btrim(email)) > 0
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(btrim(message)) > 0
  );

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(email)) > 0
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );
