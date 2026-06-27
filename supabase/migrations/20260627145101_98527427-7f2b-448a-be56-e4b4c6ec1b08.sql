UPDATE public.posts
SET seo_title = LEFT(title, 52) || ' | BlogiFy'
WHERE seo_title IS NULL AND title IS NOT NULL;

UPDATE public.posts
SET meta_description = LEFT(COALESCE(excerpt, title), 155)
WHERE meta_description IS NULL;