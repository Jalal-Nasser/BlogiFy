-- Enable RLS (safe to run even if already enabled)
ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audits   ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "block_anon_keywords"   ON public.seo_keywords;
DROP POLICY IF EXISTS "allow_authed_keywords" ON public.seo_keywords;
DROP POLICY IF EXISTS "block_anon_rankings"   ON public.seo_rankings;
DROP POLICY IF EXISTS "allow_authed_rankings" ON public.seo_rankings;
DROP POLICY IF EXISTS "block_anon_audits"     ON public.seo_audits;
DROP POLICY IF EXISTS "allow_authed_audits"   ON public.seo_audits;

-- Block all anonymous access
CREATE POLICY "block_anon_keywords" ON public.seo_keywords
  FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "block_anon_rankings" ON public.seo_rankings
  FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "block_anon_audits" ON public.seo_audits
  FOR ALL TO anon USING (false) WITH CHECK (false);

-- Allow authenticated admin users
CREATE POLICY "allow_authed_keywords" ON public.seo_keywords
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_authed_rankings" ON public.seo_rankings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_authed_audits" ON public.seo_audits
  FOR ALL TO authenticated USING (true) WITH CHECK (true);