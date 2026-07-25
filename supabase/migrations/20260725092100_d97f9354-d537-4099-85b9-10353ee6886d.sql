
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS focus_keywords text[] NOT NULL DEFAULT '{}'::text[];

INSERT INTO public.categories (id, name, slug, color, description, status)
VALUES ('11111111-0000-0000-0000-0000000000ff', 'Uncategorized', 'uncategorized', '#94a3b8', 'Default category for posts without an assigned topic.', 'Active')
ON CONFLICT (slug) DO NOTHING;
