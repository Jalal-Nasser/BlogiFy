DROP POLICY IF EXISTS "Public read media" ON storage.objects;
CREATE POLICY "Authenticated read media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media');