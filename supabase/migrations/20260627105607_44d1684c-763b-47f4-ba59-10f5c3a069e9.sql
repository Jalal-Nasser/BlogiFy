
-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============ authors ============
CREATE TABLE public.authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'Author',
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authors TO authenticated;
GRANT ALL ON public.authors TO service_role;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage authors" ON public.authors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER authors_updated_at BEFORE UPDATE ON public.authors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ tags ============
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage tags" ON public.tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ Extend posts ============
-- Existing posts table uses BIGINT-style? Actually existing is UUID per types? Let me check: posts id is string per types -> UUID. Good.
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.authors(id);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
-- Normalize status values to include CMS workflow values (existing column 'status' already TEXT)

DROP TRIGGER IF EXISTS posts_updated_at ON public.posts;
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Posts RLS additions for authenticated full management (existing public-read policy preserved)
DROP POLICY IF EXISTS "Authenticated manage posts" ON public.posts;
CREATE POLICY "Authenticated manage posts" ON public.posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ Extend categories ============
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Active';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP POLICY IF EXISTS "Authenticated manage categories" ON public.categories;
CREATE POLICY "Authenticated manage categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ post_tags ============
CREATE TABLE public.post_tags (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_tags TO authenticated;
GRANT ALL ON public.post_tags TO service_role;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage post_tags" ON public.post_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ media_assets ============
CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  alt_text TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage media_assets" ON public.media_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ activity_events ============
CREATE TABLE public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_events TO authenticated;
GRANT ALL ON public.activity_events TO service_role;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage activity_events" ON public.activity_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX activity_events_created_at_idx ON public.activity_events(created_at DESC);

-- ============ blog_settings ============
CREATE TABLE public.blog_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_name TEXT NOT NULL DEFAULT 'IT Blog',
  blog_description TEXT,
  default_author_id UUID REFERENCES public.authors(id),
  seo_title_pattern TEXT NOT NULL DEFAULT '%title% | %blog_name%',
  admin_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_settings TO authenticated;
GRANT ALL ON public.blog_settings TO service_role;
ALTER TABLE public.blog_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage blog_settings" ON public.blog_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER blog_settings_updated_at BEFORE UPDATE ON public.blog_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed a single blog_settings row
INSERT INTO public.blog_settings (blog_name, blog_description, seo_title_pattern)
VALUES ('IT Blog', 'Insights and tutorials on IT, cybersecurity, and the cloud.', '%title% | %blog_name%')
ON CONFLICT DO NOTHING;
