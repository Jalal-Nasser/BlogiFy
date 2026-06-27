
CREATE TABLE public.seo_keywords (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  target_url TEXT,
  country TEXT NOT NULL DEFAULT 'us',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.seo_keywords TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.seo_keywords_id_seq TO service_role;
ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.seo_rankings (
  id BIGSERIAL PRIMARY KEY,
  keyword_id BIGINT NOT NULL REFERENCES public.seo_keywords(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  position INTEGER,
  url TEXT,
  title TEXT,
  source TEXT NOT NULL DEFAULT 'firecrawl_serp:us',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.seo_rankings TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.seo_rankings_id_seq TO service_role;
ALTER TABLE public.seo_rankings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.seo_audits (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.seo_audits TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.seo_audits_id_seq TO service_role;
ALTER TABLE public.seo_audits ENABLE ROW LEVEL SECURITY;
