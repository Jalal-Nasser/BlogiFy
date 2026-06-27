
-- Posts: add category_slug (text), keep category_id FK
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS category_slug text;
CREATE INDEX IF NOT EXISTS posts_category_slug_idx ON public.posts(category_slug);

-- Categories: add wp_id and parent_slug
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS wp_id int;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_slug text;

-- Backfill parent_slug from existing parent_id
UPDATE public.categories c
SET parent_slug = p.slug
FROM public.categories p
WHERE c.parent_id = p.id AND c.parent_slug IS NULL;

-- Backfill posts.category_slug from existing category_id
UPDATE public.posts p
SET category_slug = c.slug
FROM public.categories c
WHERE p.category_id = c.id AND p.category_slug IS NULL;

-- contact_submissions view over contact_messages, with INSERT-only support
CREATE OR REPLACE VIEW public.contact_submissions AS
  SELECT id, name, email, message, created_at FROM public.contact_messages;

GRANT SELECT, INSERT ON public.contact_submissions TO anon, authenticated;
GRANT ALL ON public.contact_submissions TO service_role;

CREATE OR REPLACE FUNCTION public.contact_submissions_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.contact_messages (name, email, message)
  VALUES (NEW.name, NEW.email, NEW.message)
  RETURNING id, name, email, message, created_at
  INTO NEW.id, NEW.name, NEW.email, NEW.message, NEW.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contact_submissions_insert_trg ON public.contact_submissions;
CREATE TRIGGER contact_submissions_insert_trg
INSTEAD OF INSERT ON public.contact_submissions
FOR EACH ROW EXECUTE FUNCTION public.contact_submissions_insert();
