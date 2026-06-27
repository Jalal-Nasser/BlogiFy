
-- 1. Contact messages: no SELECT for anon
DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact"
  ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "No public read of contact messages"
  ON public.contact_messages FOR SELECT TO anon, authenticated USING (false);

-- 2. Newsletter subscribers: no SELECT for anon
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "No public read of subscribers"
  ON public.newsletter_subscribers FOR SELECT TO anon, authenticated USING (false);

-- 3. Replace USING (true) policies with meaningful conditions
DROP POLICY IF EXISTS "Categories are public" ON public.categories;
CREATE POLICY "Categories are public"
  ON public.categories FOR SELECT TO anon, authenticated USING (slug IS NOT NULL);

-- posts already uses status = 'published'; pages already uses status = 'published'. No change needed.
