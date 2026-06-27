
# Consolidate BlogiFy → Lovable Cloud

## Findings

### Two databases today
- **Public client** (`src/lib/supabase.ts`) is hardcoded to BlogiFy (`kejgjwvesmlaorviofyl.supabase.co`). All public reads in `src/lib/queries.ts` go there.
- **Lovable Cloud** holds auth, admin CMS (`cms.functions.ts`), `page_views`, and an existing copy of the posts.

### Schema diff — `posts`

| Column | BlogiFy | Lovable Cloud |
|---|---|---|
| `id` | **integer** | **uuid** |
| `category_id` | absent | `uuid` (FK categories.id) |
| `category_slug` | `text` | **absent** |
| `featured_image` | `text` | **absent** |
| Everything else (title, slug, content, excerpt, featured_image_url, author, author_id, tags, status, published_at, read_time_minutes, views, featured, seo_title, meta_description, canonical_url, updated_at, created_at) | present | present |

### Schema diff — `categories`

| Column | BlogiFy | Lovable Cloud |
|---|---|---|
| `id` | int | `uuid` |
| `wp_id` | present | absent |
| `parent_slug` | `text` | absent (LC uses `parent_id uuid`) |
| name, slug, color, description, status, updated_at | present | present |

### Row counts

| | BlogiFy | Lovable Cloud |
|---|---|---|
| posts (total) | 40 | 46 |
| posts (published) | 40 | 46 |
| categories | 22 | 22 (slugs match) |
| pages / tags / post_tags / media_assets / authors / contact_submissions / newsletter_subscribers | empty/absent in BlogiFy | pages=4, rest empty |

LC's 46 posts are a **superset**: all 40 BlogiFy slugs are present, plus 6 newer ones (`cloudflare-tunnels-home-server`, `crypto-self-custody-hardware-vs-multisig`, `hardening-linux-server-2026`, `nas-storage-truenas-scale-40tb-build`, `self-hosting-mail-server-2026`, `wordpress-rest-api-headless-frontend`). Categories overlap 1:1 by slug.

### Tables actually used by the public site
From `src/lib/queries.ts`: `posts`, `categories`, `contact_submissions`, plus newsletter via `cms.functions` (already LC). `pages`, `tags`, `post_tags`, `media_assets`, `authors` are not read by the public site.

### Media references in BlogiFy posts
- `featured_image_url` hosts: BlogiFy storage **37**, dropskey.net 2, unsplash 1.
- Inline `<img>` URLs in `content`: BlogiFy storage **61**, plus 8 external hosts (mango-wp, androidcure, technuovo, jeumobi, spca, logosdownload, wikimedia, worldvectorlogo, jalalnasser) at 1 each.
- ~100 unique media URLs total; ~98 unique BlogiFy-hosted files (already-migrated featured images overlap; inline images mostly NOT yet migrated).

### Critical mismatches that would break the public site if we just repointed today
1. LC `posts` has **no `category_slug`** — every `queries.ts` call (list, by-slug, by-category, related) filters/selects on it → all queries 500.
2. LC `posts.category_id` is set on only 6 of 46 rows — even after adding `category_slug`, most posts would have no category.
3. LC `categories` lacks `wp_id` and `parent_slug` — `fetchCategories`/`fetchCategoryBySlug` select these columns → 400.
4. `media_assets` table is empty on LC; `contact_submissions` table doesn't exist on LC (LC has `contact_messages` instead) — `submitContact` would 404.
5. Inline images in `content` still point to BlogiFy storage on the 40 imported LC rows (only `featured_image_url` was rewritten in the prior media migration).

## Proposed migration plan (safe, staged, reversible)

### Phase 1 — Reconcile LC schema (additive, no breakage)
Migration:
- `ALTER TABLE posts ADD COLUMN category_slug text` (computed/backfilled, then keep in sync).
- `ALTER TABLE posts ADD COLUMN featured_image text` (optional — only if we want parity; queries.ts doesn't read it, can skip).
- `ALTER TABLE categories ADD COLUMN wp_id int`, `ADD COLUMN parent_slug text`.
- Backfill `categories.parent_slug` from existing `parent_id` join; backfill `wp_id` from BlogiFy export.
- Backfill `posts.category_slug` for the 6 already-linked rows from `categories.slug`.
- Add a `contact_submissions` view or table mirroring `contact_messages` (or change `queries.ts` to use `contact_messages` in a separate frontend-only edit).

### Phase 2 — Import the 40 BlogiFy posts into LC (data only)
- For each BlogiFy slug **not already in LC**: skip (LC is the source of truth — it's the superset; we only need missing rows). After diff: every BlogiFy slug is already present in LC, so nothing to insert. Verify each LC row against BlogiFy for `content`, `excerpt`, `featured_image_url`, `seo_title`, `meta_description`, `category_slug`, `tags`, `published_at`. Where LC values are empty/null and BlogiFy has them, backfill via `UPDATE … FROM (VALUES …)`. This protects the 6 newer LC-only posts and any admin edits.
- Resolve `category_id` from `category_slug` for all rows (set FK).

### Phase 3 — Media consolidation (inline images)
- Script (service role) scans LC `posts.content` for every `kejgjwvesmlaorviofyl.supabase.co/storage/v1/object/public/media/<path>` occurrence (~61 references, fewer unique paths).
- For each unique path not already in this project's `media` bucket: download from BlogiFy public URL, upload to LC `media` with `x-upsert: true`.
- Rewrite `content` in LC: replace `kejgjwvesmlaorviofyl.supabase.co` with `gwynqitgepkfzzenlfyu.supabase.co`, keeping the `/storage/v1/object/public/media/...` path identical. Do **not** touch the 8 external hosts.
- Verify HTTP 200 on a sample of new URLs.

### Phase 4 — Repoint the public client
- Replace `SUPABASE_URL`/`SUPABASE_ANON_KEY` in `src/lib/supabase.ts` with the LC project (`gwynqitgepkfzzenlfyu`) values. Better: switch to `import { supabase } from "@/integrations/supabase/client"` (the managed LC client) and delete `src/lib/supabase.ts` — single client across the app.
- Fix `queries.ts` `contact_submissions` → `contact_messages` (or add the view in Phase 1).
- Build + typecheck.

### Phase 5 — Verify parity, then pause BlogiFy
- Diff homepage post list, a sample post page, a category page, and search results between current published site (BlogiFy-backed) and the preview (LC-backed). Confirm titles, slugs, images, categories, related posts all render.
- Only after parity: pause BlogiFy.

## Risks & flags
- **ID type change**: BlogiFy `posts.id` is `int`, LC is `uuid`. The public site uses `id` only as `excludeId` in related posts — no external links break. Bookmarks/analytics keyed on slug, which is preserved.
- **Existing media migration was DB-rewrite only on LC**: rewriting hosts in `content` will succeed only after Phase 3 actually copies the inline-referenced files (the prior turn copied 37 files; inline images may reference different paths).
- **6 newer LC posts** must be preserved — Phase 2 only backfills NULL columns, never overwrites.
- **`contact_messages` vs `contact_submissions`**: silently broken today on the LC schema; flagged for fix in Phase 1/4.
- **Drafts**: none in BlogiFy (all 40 published), no risk.
- **Duplicate slugs**: none between BlogiFy and LC after the superset check.
- **`category_id` NULL on 40 LC posts** is the most invasive backfill — must run after `categories.wp_id`/`parent_slug` exist and slug→uuid mapping is verified.
- `src/lib/queries.ts` references `wp_id` and `parent_slug` on categories — those columns must exist before repointing or fetchCategories returns 400.

## Deliverables when you say "go"
1. One SQL migration for Phase 1 schema additions + category backfill.
2. One data migration (insert tool) for Phase 2 post backfills + category_id resolution.
3. One Node/Python script (service role) for Phase 3 inline-image copy + content rewrite, run once.
4. Code edits for Phase 4 (`src/lib/supabase.ts` switch + `contact_submissions` fix).
5. Verification report (counts, sample URLs HTTP 200, parity screenshots).

No edits will happen until you approve.
