-- Post translations
CREATE TABLE public.post_translations (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  lang text NOT NULL CHECK (lang IN ('ko','fr','ar')),
  title text NOT NULL,
  excerpt text,
  content text NOT NULL,
  seo_title text,
  meta_description text,
  focus_keywords text[] DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'auto' CHECK (status IN ('auto','edited','approved')),
  translated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, lang)
);

GRANT SELECT ON public.post_translations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.post_translations TO authenticated;
GRANT ALL ON public.post_translations TO service_role;

ALTER TABLE public.post_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read translations of published posts"
  ON public.post_translations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_translations.post_id AND p.status = 'published'));

CREATE POLICY "Admins can manage post translations"
  ON public.post_translations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER post_translations_set_updated_at
  BEFORE UPDATE ON public.post_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX post_translations_lang_idx ON public.post_translations(lang);

-- Tag translations
CREATE TABLE public.tag_translations (
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  lang text NOT NULL CHECK (lang IN ('ko','fr','ar')),
  name text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tag_id, lang)
);

GRANT SELECT ON public.tag_translations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tag_translations TO authenticated;
GRANT ALL ON public.tag_translations TO service_role;

ALTER TABLE public.tag_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read tag translations"
  ON public.tag_translations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tag translations"
  ON public.tag_translations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tag_translations_set_updated_at
  BEFORE UPDATE ON public.tag_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
