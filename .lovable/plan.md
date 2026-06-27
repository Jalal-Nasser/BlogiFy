# Blog CMS Dashboard — Implementation Plan

This is a large rebuild (15 routes, 8 tables, full CRUD on 5 entities). I want to confirm a few things before writing thousands of lines of code, because a few decisions materially change the approach.

## Scope assumptions I need confirmed

1. **Existing public blog (`/`, `/blog/$slug`, `/category/$slug`, etc.) stays intact.** Your spec says "/ redirects authenticated users to /dashboard, unauthenticated to /login" — but you already have a public marketing site + blog on `/`. I assume you mean: the *admin* surface is the new dashboard, and the public site keeps working. The redirect rule should only apply if we're replacing the homepage, which would break SEO. **My recommendation:** keep `/` as the public homepage, make the admin live at `/admin/*` (or keep `/dashboard`, `/posts`, etc. as protected admin routes alongside the public site). Confirm which you want.

2. **Existing schema conflict.** Your project already has `posts`, `categories` tables with a different shape (posts has `author TEXT`, `tags TEXT[]`, `featured_image_url`, `views`, etc.; categories has `color`, `parent_id`). Your new spec changes column names (`featured_image` vs `featured_image_url`, `author_id` FK vs `author` text, separate `post_tags` join vs `tags[]` array). **Two options:**
   - **(a) Migrate in place** — alter existing tables, migrate data, update public site queries (`src/lib/queries.ts`, blog route, etc.) to new shape. Higher risk, touches public site.
   - **(b) Additive** — keep existing tables as-is for public site, add only the new tables (`tags`, `post_tags`, `authors`, `media_assets`, `activity_events`, `blog_settings`) and extend `posts`/`categories` with the missing columns. Lower risk. Recommended.

3. **Remove existing `seo-dashboard` route?** The current `src/routes/seo-dashboard.tsx` (SEO Engine Console with rankings/audits/Firecrawl) — delete entirely, or keep as `/seo` content? Your new `/seo` spec is content-SEO issues (missing meta, missing alt), not keyword ranking. I assume: delete the seo-dashboard route and its tables (`seo_keywords`, `seo_rankings`, `seo_audits`) are kept untouched but unused.

4. **Auth.** Current admin uses a hardcoded password check in `seo-dashboard.tsx`, not Supabase Auth. Your spec says "keep existing email+password Supabase auth" — but it doesn't exist yet. I'll need to **enable Supabase Auth, create `/login`, create the `_authenticated` layout gate, and create one admin user**. Confirm OK.

5. **Rich text editor:** spec says plain textarea is fine for v1 — I'll do that.

## Proposed structure

```text
src/routes/
  _authenticated/
    route.tsx              gate → /login if no session
    dashboard.tsx          KPIs + recent posts/drafts/SEO/activity
    posts.index.tsx        list + filters
    posts.new.tsx          editor (create)
    posts.$id.edit.tsx     editor (edit)
    categories.tsx
    tags.tsx
    authors.tsx
    media.tsx
    seo.tsx
    drafts.tsx
    published.tsx
    featured.tsx
    reports.tsx
    settings.tsx
  login.tsx                public
  (existing public routes untouched)
```

Shared `<AdminShell>` with sidebar + top header, used by every `_authenticated` route.

## Technical details

- **DB:** One migration adding 6 new tables (`tags`, `post_tags`, `authors`, `media_assets`, `activity_events`, `blog_settings`) + ALTERs on `posts` (`author_id`, `status`, `featured`, `seo_title`, `meta_description`, `canonical_url`, `updated_at`) and `categories` (`status`, `updated_at`). RLS: `authenticated` full CRUD, no anon. GRANTs included. `updated_at` triggers.
- **Data layer:** `createServerFn` + `requireSupabaseAuth` for all mutations and reads. TanStack Query for caching. Loader-prime + `useSuspenseQuery` per project convention.
- **Activity log:** helper `logActivity(type, description, entity_type, entity_id)` called from each mutation handler.
- **Auth:** enable email/password, create `/login` (Supabase signInWithPassword), `_authenticated/route.tsx` integration-managed gate, `attachSupabaseAuth` middleware in `src/start.ts`.
- **Design tokens:** use existing semantic tokens; map your green/amber/red to badge variants. Buttons use `bg-primary` (already navy-ish). No new hex literals in components.

## Estimated size

~25 new files, 1 migration, ~3500 lines. I'll batch parallel writes per route group.

## Before I start — please confirm

1. Keep public site intact, admin lives alongside as protected routes (don't hijack `/`)? **(Y/N)**
2. Additive schema migration (keep existing `posts`/`categories` shape, add columns + new tables)? **(Y/N)**
3. Delete `src/routes/seo-dashboard.tsx` and replace with new `/seo` content-audit page? **(Y/N)**
4. Enable Supabase Auth + I'll tell you to create an admin user after? **(Y/N)**

Once you confirm I'll ship it in one pass.
