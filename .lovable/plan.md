# Plan: Firecrawl improvements + Multi-language (EN/KO/FR/AR)

Two independent workstreams. I'll ship them in this order so #1 is done before I start rewriting routes for #2.

---

## Part A — Firecrawl improvements

Existing state: `FIRECRAWL_API_KEY` is linked as a **direct-API** connection (`fc-…`), but no code uses it yet.

**A1. Server helper** — `src/lib/firecrawl.functions.ts` (`createServerFn`, admin-only via `has_role`):
- `firecrawlSearchEN({ query, limit })` and `firecrawlScrapeEN({ url })`
- Rotates `location.country` across **US, GB, CA, AU, IE, NZ** (round-robin per call)
- Sets `location.languages: ["en"]` and forwards `Accept-Language: en-US,en-GB,en;q=0.9`
- English filter (both helpers):
  - Trust `metadata.language` when present and starts with `en`
  - Otherwise run a small heuristic on the returned markdown (common-word ratio + ASCII share; no new npm dep — keeps the Worker bundle clean)
  - **Discard** non-English results (your stated intent); returns `{ kept, dropped }` counts so the UI can show what was filtered
- Direct-API auth against `https://api.firecrawl.dev/v2/{scrape,search}` (no gateway, no `X-Connection-Api-Key`)

**A2. Admin UI** — new tab in the admin dashboard: **Research** (`/_authenticated/research`)
- Two panels: Search and Scrape
- Shows kept results as cards (title, URL, description, markdown preview) and a count of dropped non-English results
- Reuses existing admin shell / auth gate

Nothing runs on a schedule for now; you can trigger from the dashboard on demand.

---

## Part B — Multi-language site (EN default, +KO, +FR, +AR-RTL)

### B1. Routing

Add a locale segment in front of public content routes:

```text
src/routes/
  index.tsx                  -> /            (EN, canonical)
  blog.index.tsx             -> /blog        (EN)
  blog.$slug.tsx             -> /blog/$slug  (EN)
  $lang.tsx                  -> layout: validates lang ∈ {ko, fr, ar}, sets <html lang dir>
  $lang.index.tsx            -> /ko, /fr, /ar
  $lang.blog.index.tsx       -> /ko/blog, /fr/blog, /ar/blog
  $lang.blog.$slug.tsx       -> /ko/blog/:slug, /fr/blog/:slug, /ar/blog/:slug
```

- EN stays at the root (no `/en/` prefix) so existing URLs, sitemaps, GSC data, and LinkedIn shares stay valid.
- The existing hand-built `src/routes/ar.*` and `src/lib/arabic-articles.tsx` get **replaced** by the generic `$lang` routes (13 hand-translated AR articles are migrated into the new `post_translations` table so nothing is lost).
- `hreflang` alternates emitted in `head()` for every language that has a translation, plus `x-default` → EN canonical.
- `dir="rtl"` and Arabic font applied only under `/ar/*`.

### B2. Database — translation table (not columns on `posts`)

New table (clean, scales to any number of languages, cheap to query):

```sql
public.post_translations (
  post_id uuid references posts on delete cascade,
  lang text check (lang in ('ko','fr','ar')),  -- EN stays on posts.*
  title text not null,
  excerpt text,
  content text not null,
  seo_title text,
  meta_description text,
  focus_keywords text[],
  status text default 'auto',  -- 'auto' | 'edited' | 'approved'
  translated_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (post_id, lang)
)
```

- Public SELECT policy: only rows whose parent post is `published`.
- Admin write via `has_role('admin')`.
- Tags: translated at render time from a `tag_translations` table with the same shape (`tag_id`, `lang`, `name`) — new tags stay usable in EN immediately even if translation is pending.

### B3. Auto-translation (Lovable AI Gateway, no extra key)

Server function `translatePost({ postId, langs? })`:
- Uses `google/gemini-2.5-flash` via `LOVABLE_API_KEY` (fast + cheap + strong on KO/FR/AR).
- Translates title, excerpt, meta description, focus keywords, and **HTML content** (prompt instructs the model to preserve tags, attributes, code blocks, and image URLs verbatim).
- Called automatically on post create/update in the admin (fire-and-forget with a toast; failures logged and retriable from the post editor).
- Manual "Retranslate" button per language in the post editor SEO tab.
- Locale-specific SEO defaults (currency, date format) handled by `Intl` in the render layer, not the model.

Backfill: **on-demand only.** I'll add a "Translate all published posts" button in Settings that runs in batches; I won't auto-translate 49 posts during the migration.

### B4. Language switcher

- Small dropdown in the site header (EN / 한국어 / Français / العربية), preserving the current path when a translation exists, otherwise linking to that language's homepage.
- Choice persisted in `localStorage` for return visits (only affects the switcher's default target — doesn't auto-redirect, so shared links stay canonical).

### B5. SEO

- Per-locale `<title>`, meta description, canonical (`https://jalalnasser.com/{lang}/blog/{slug}`), `og:locale`, `og:locale:alternate`, and full `hreflang` set (including `x-default`).
- Sitemap updated to include translated URLs.
- BlogPosting JSON-LD gets `inLanguage`.

---

## Technical notes

- **No new npm packages.** Language detection heuristic + Lovable AI translation cover everything; no `franc`, `i18next`, etc.
- **Content strategy:** posts store EN in `posts.*`; translations live in `post_translations`. Renderer picks EN when no row exists, so partial coverage is safe.
- **AR route migration:** existing `src/routes/ar.tsx`, `ar.index.tsx`, `ar.blog.index.tsx`, `ar.blog.$slug.tsx`, and `src/lib/arabic-articles.tsx` are removed; the 13 curated AR articles are inserted into `post_translations` with `status='approved'` so they win over any future auto-translation.
- **Firecrawl:** direct-API mode (your connection), so no gateway URL, no `X-Connection-Api-Key`.

## Deliverable order

1. Firecrawl helper + Research admin tab (Part A).
2. DB migration: `post_translations`, `tag_translations`, policies, grants.
3. `translatePost` server fn + wire into post create/update.
4. `$lang` routes, hreflang, language switcher, RTL for `/ar/*`.
5. Migrate hand-written AR content into `post_translations`, remove old `ar.*` files.
6. Sitemap update + "Translate all" backfill button.

**Confirm and I'll start with Part A, then move to Part B.** If you'd rather I skip the AR migration step (leave the current `ar.*` routes untouched and only auto-translate for KO/FR), say so — that saves ~1 step.
