-- Assign AI & Tech to all uncategorized posts
UPDATE public.posts
SET category_id = '11111111-0000-0000-0000-000000000001'
WHERE category_id IS NULL;

-- Ensure common AI tags exist
INSERT INTO public.tags (name, slug) VALUES
  ('AI', 'ai'),
  ('LLM', 'llm'),
  ('ChatGPT', 'chatgpt'),
  ('Gemini', 'gemini'),
  ('Claude', 'claude'),
  ('GPT-5', 'gpt-5'),
  ('Prompt Engineering', 'prompt-engineering'),
  ('AI Agents', 'ai-agents'),
  ('AI Video', 'ai-video'),
  ('AI Search', 'ai-search'),
  ('Future of Work', 'future-of-work'),
  ('Software Development', 'software-development')
ON CONFLICT (slug) DO NOTHING;

-- Attach tags to posts
WITH mapping(slug, tag_slugs) AS (
  VALUES
    ('how-large-language-models-are-changing-modern-software-development', ARRAY['ai','llm','software-development']),
    ('chatgpt-vs-gemini-vs-claude-2026', ARRAY['ai','chatgpt','gemini','claude','llm']),
    ('gpt-5-6-explained', ARRAY['ai','gpt-5','llm','chatgpt']),
    ('the-future-of-ai-agents-in-everyday-business-workflows', ARRAY['ai','ai-agents','future-of-work']),
    ('ai-video-generation-guide-2026', ARRAY['ai','ai-video']),
    ('prompt-engineering-best-practices-for-better-ai-results', ARRAY['ai','prompt-engineering','llm']),
    ('ai-search-engines-vs-google-2026', ARRAY['ai','ai-search']),
    ('will-ai-replace-jobs-us-uk-2026', ARRAY['ai','future-of-work'])
)
INSERT INTO public.post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM mapping m
JOIN public.posts p ON p.slug = m.slug
JOIN public.tags t ON t.slug = ANY(m.tag_slugs)
ON CONFLICT DO NOTHING;