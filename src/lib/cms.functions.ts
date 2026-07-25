import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============ Activity log helper ============
async function logActivity(
  supabase: any,
  event_type: string,
  description: string,
  entity_type?: string,
  entity_id?: string | null,
) {
  await supabase.from("activity_events").insert({
    event_type,
    description,
    entity_type: entity_type ?? null,
    entity_id: entity_id ?? null,
  });
}

// ============ POSTS ============
export const listPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("posts")
      .select("id, title, slug, status, featured, published_at, updated_at, category_id, author_id, featured_image_url, seo_title, meta_description, canonical_url, excerpt, focus_keywords, tags")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getPost = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: post, error } = await context.supabase
      .from("posts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const { data: pt } = await context.supabase
      .from("post_tags")
      .select("tag_id")
      .eq("post_id", data.id);
    return { post, tag_ids: (pt ?? []).map((r: any) => r.tag_id) };
  });

const postInput = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  author_id: z.string().nullable().optional(),
  status: z.string(),
  featured: z.boolean().optional(),
  featured_image_url: z.string().nullable().optional(),
  seo_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  canonical_url: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  tag_ids: z.array(z.string()).optional(),
  focus_keywords: z.array(z.string()).optional(),
});

export const savePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => postInput.parse(d))
  .handler(async ({ data, context }) => {
    const { id, tag_ids, ...fields } = data;
    const row: any = {
      ...fields,
      content: fields.content ?? "",
      author: "Admin",
    };
    let postId = id;
    if (id) {
      const { error } = await context.supabase.from("posts").update(row).eq("id", id);
      if (error) throw new Error(error.message);
      await logActivity(context.supabase, "post_edited", `Edited post "${fields.title}"`, "post", id);
    } else {
      const { data: inserted, error } = await context.supabase.from("posts").insert(row).select("id").single();
      if (error) throw new Error(error.message);
      postId = inserted.id;
      await logActivity(context.supabase, "post_created", `Created post "${fields.title}"`, "post", postId);
    }
    if (fields.status === "Published") {
      await logActivity(context.supabase, "post_published", `Published "${fields.title}"`, "post", postId!);
    }
    if (tag_ids && postId) {
      await context.supabase.from("post_tags").delete().eq("post_id", postId);
      if (tag_ids.length > 0) {
        await context.supabase
          .from("post_tags")
          .insert(tag_ids.map((tag_id) => ({ post_id: postId!, tag_id })));
      }
    }
    // Auto-translate on publish (fire-and-forget; failures logged, never block save).
    if (postId && fields.status === "Published") {
      const targetId = postId;
      (async () => {
        try {
          const { runTranslateForPost } = await import("./translations.functions");
          await runTranslateForPost(context.supabase, targetId, ["ko", "fr", "ar"], false);
        } catch (e: any) {
          console.error("auto-translate failed", e?.message ?? e);
        }
      })();
    }
    return { id: postId };
  });

// ============ TAXONOMY HELPERS ============

function stripHtml(html: string): string {
  return (html || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export function generateMetaFromContent(title: string, content: string, excerpt?: string | null): string {
  const src = (excerpt && excerpt.trim()) || stripHtml(content) || title;
  const clean = src.replace(/\s+/g, " ").trim();
  if (clean.length <= 155) return clean;
  const cut = clean.slice(0, 155);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\-–]+$/, "") + "…";
}

function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9\s\-]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function scoreMatch(needle: string, haystackTokens: Set<string>, fullText: string): number {
  const parts = needle.toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 0;
  // Full phrase match wins
  if (parts.length > 1 && fullText.includes(needle.toLowerCase())) return parts.length * 3;
  let hits = 0;
  for (const p of parts) if (haystackTokens.has(p)) hits++;
  return hits === parts.length ? hits * 2 : hits;
}

async function computeSuggestions(
  sb: any,
  post: { id: string; title: string; content: string | null; excerpt: string | null; category_id: string | null },
  categories: { id: string; name: string; slug: string }[],
  tags: { id: string; name: string; slug: string }[],
  uncategorizedId: string,
) {
  const text = `${post.title} ${post.excerpt ?? ""} ${stripHtml(post.content ?? "")}`.toLowerCase();
  const tokens = new Set(tokenize(text));

  let bestCat = { id: uncategorizedId, score: 0, name: "Uncategorized" };
  if (!post.category_id) {
    for (const c of categories) {
      if (c.slug === "uncategorized" || c.slug === "featured") continue;
      const s = Math.max(
        scoreMatch(c.name, tokens, text),
        scoreMatch(c.slug.replace(/-/g, " "), tokens, text),
      );
      if (s > bestCat.score) bestCat = { id: c.id, score: s, name: c.name };
    }
  }

  const tagScored = tags
    .map((t) => ({
      id: t.id,
      name: t.name,
      score: Math.max(scoreMatch(t.name, tokens, text), scoreMatch(t.slug.replace(/-/g, " "), tokens, text)),
    }))
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return {
    suggested_category_id: post.category_id ? null : (bestCat.score > 0 ? bestCat.id : uncategorizedId),
    suggested_category_name: post.category_id ? null : (bestCat.score > 0 ? bestCat.name : "Uncategorized"),
    suggested_tag_ids: tagScored.map((t) => t.id),
    suggested_tag_names: tagScored.map((t) => t.name),
  };
}

const UNCATEGORIZED_ID = "11111111-0000-0000-0000-0000000000ff";

export const listUncategorizedWithSuggestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [{ data: posts }, { data: cats }, { data: tags }] = await Promise.all([
      sb.from("posts").select("id, title, slug, excerpt, content, category_id, status").is("category_id", null),
      sb.from("categories").select("id, name, slug").eq("status", "Active"),
      sb.from("tags").select("id, name, slug"),
    ]);
    const list = posts ?? [];
    const result = [] as any[];
    for (const p of list) {
      const s = await computeSuggestions(sb, p, cats ?? [], tags ?? [], UNCATEGORIZED_ID);
      result.push({ id: p.id, title: p.title, slug: p.slug, status: p.status, ...s });
    }
    return result;
  });

export const suggestForPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    title: z.string(),
    content: z.string().optional().nullable(),
    excerpt: z.string().optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const [{ data: cats }, { data: tags }] = await Promise.all([
      sb.from("categories").select("id, name, slug").eq("status", "Active"),
      sb.from("tags").select("id, name, slug"),
    ]);
    const s = await computeSuggestions(
      sb,
      { id: "", title: data.title, content: data.content ?? "", excerpt: data.excerpt ?? "", category_id: null },
      cats ?? [],
      tags ?? [],
      UNCATEGORIZED_ID,
    );
    const meta = generateMetaFromContent(data.title, data.content ?? "", data.excerpt);
    return { ...s, meta_description: meta };
  });

export const bulkFixCategoriesAndTags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    changes: z.array(z.object({
      id: z.string(),
      category_id: z.string().nullable(),
      tag_ids: z.array(z.string()),
    })),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    let updated = 0;
    for (const c of data.changes) {
      if (c.category_id) {
        const { error } = await sb.from("posts").update({ category_id: c.category_id }).eq("id", c.id);
        if (error) throw new Error(error.message);
      }
      if (c.tag_ids.length > 0) {
        // Merge with existing
        const { data: existing } = await sb.from("post_tags").select("tag_id").eq("post_id", c.id);
        const have = new Set((existing ?? []).map((r: any) => r.tag_id));
        const toAdd = c.tag_ids.filter((t) => !have.has(t));
        if (toAdd.length > 0) {
          await sb.from("post_tags").insert(toAdd.map((tag_id) => ({ post_id: c.id, tag_id })));
        }
      }
      updated++;
    }
    await logActivity(context.supabase, "bulk_taxonomy_fix", `Fixed categories/tags on ${updated} posts`, "post", null);
    return { updated };
  });


export const archivePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("posts")
      .update({ status: "Archived" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(context.supabase, "post_archived", `Archived post`, "post", data.id);
    return { ok: true };
  });

export const togglePostFeatured = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string(), featured: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("posts")
      .update({ featured: data.featured })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(
      context.supabase,
      "featured_changed",
      `${data.featured ? "Marked" : "Unmarked"} post as featured`,
      "post",
      data.id,
    );
    return { ok: true };
  });

// ============ CATEGORIES ============
export const listCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("categories")
      .select("id, name, slug, description, status")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().nullable().optional(),
      status: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...row } = data;
    if (id) {
      const { error } = await context.supabase.from("categories").update(row).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("categories").insert(row);
      if (error) throw new Error(error.message);
      await logActivity(context.supabase, "category_added", `Added category "${data.name}"`, "category");
    }
    return { ok: true };
  });

export const archiveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("categories")
      .update({ status: "Archived" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ TAGS ============
export const listTags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tags")
      .select("id, name, slug")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      slug: z.string().min(1),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...row } = data;
    if (id) {
      const { error } = await context.supabase.from("tags").update(row).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("tags").insert(row);
      if (error) throw new Error(error.message);
      await logActivity(context.supabase, "tag_added", `Added tag "${data.name}"`, "tag");
    }
    return { ok: true };
  });

export const deleteTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tags").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ AUTHORS ============
export const listAuthors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("authors")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveAuthor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      bio: z.string().nullable().optional(),
      avatar_url: z.string().nullable().optional(),
      role: z.string(),
      status: z.string(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...row } = data;
    if (id) {
      const { error } = await context.supabase.from("authors").update(row).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("authors").insert(row);
      if (error) throw new Error(error.message);
      await logActivity(context.supabase, "author_added", `Added author "${data.name}"`, "author");
    }
    return { ok: true };
  });

export const deleteAuthor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("authors").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ MEDIA ============
export const listMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("media_assets")
      .select("*")
      .order("uploaded_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().optional(),
      title: z.string().nullable().optional(),
      alt_text: z.string().nullable().optional(),
      file_url: z.string().min(1),
      file_type: z.string().nullable().optional(),
      post_id: z.string().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...row } = data;
    if (id) {
      const { error } = await context.supabase.from("media_assets").update(row).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("media_assets").insert(row);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("media_assets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ ACTIVITY ============
export const listActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ limit: z.number().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("activity_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 10);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ============ DASHBOARD ============
export const dashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const [posts, cats, tags, authors] = await Promise.all([
      sb.from("posts").select("id, status, featured, seo_title, meta_description, featured_image_url, updated_at, title, published_at"),
      sb.from("categories").select("id", { count: "exact", head: true }),
      sb.from("tags").select("id", { count: "exact", head: true }),
      sb.from("authors").select("id", { count: "exact", head: true }),
    ]);
    const list = posts.data ?? [];
    const recentUpdated = list.filter((p: any) => p.updated_at && p.updated_at >= sevenDaysAgo).length;
    const statusMatch = (p: any, val: string) =>
      (p.status ?? "").toLowerCase() === val.toLowerCase();
    return {
      totalPosts: list.length,
      published: list.filter((p: any) => statusMatch(p, "published")).length,
      drafts: list.filter((p: any) => statusMatch(p, "draft")).length,
      scheduled: list.filter((p: any) => statusMatch(p, "scheduled")).length,
      inReview: list.filter((p: any) => statusMatch(p, "in review")).length,
      featured: list.filter((p: any) => p.featured).length,
      categories: cats.count ?? 0,
      tags: tags.count ?? 0,
      authors: authors.count ?? 0,
      missingSeoTitle: list.filter((p: any) => !p.seo_title).length,
      missingMeta: list.filter((p: any) => !p.meta_description).length,
      missingFeaturedImage: list.filter((p: any) => !p.featured_image_url).length,
      recentUpdated,
      recent: list
        .slice()
        .sort((a: any, b: any) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
        .slice(0, 5),
      needReview: list.filter((p: any) => statusMatch(p, "in review")).slice(0, 5),
      seoIssues: list.filter((p: any) => !p.seo_title || !p.meta_description).slice(0, 5),
    };
  });

// ============ SEO ISSUES ============
export const seoIssues = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: posts } = await sb
      .from("posts")
      .select("id, title, slug, seo_title, meta_description, featured_image_url, category_slug, canonical_url, tags");
    const list = posts ?? [];
    const slugCount = new Map<string, number>();
    list.forEach((p: any) => slugCount.set(p.slug, (slugCount.get(p.slug) ?? 0) + 1));
    return {
      missingSeoTitle: list.filter((p: any) => !p.seo_title),
      missingMeta: list.filter((p: any) => !p.meta_description),
      missingFeaturedImage: list.filter((p: any) => !p.featured_image_url),
      missingCategory: list.filter((p: any) => !p.category_slug),
      missingTags: list.filter((p: any) => !p.tags || p.tags.length === 0),
      missingCanonical: list.filter((p: any) => !p.canonical_url),
      duplicateSlugs: list.filter((p: any) => (slugCount.get(p.slug) ?? 0) > 1),
    };
  });

// ============ TRAFFIC ============
export const trafficStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ days: z.number().int().min(1).max(90).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const days = data.days ?? 30;
    // Pull enough history to cover current + previous window comparisons.
    const windowDays = Math.max(days * 2, 14);
    const since = new Date(Date.now() - windowDays * 86400000).toISOString();

    const { data: rows, error } = await sb
      .from("page_views")
      .select("path, post_id, visitor_id, referrer, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50000);
    if (error) throw new Error(error.message);
    const views = rows ?? [];

    const postIds = Array.from(new Set(views.map((v: any) => v.post_id).filter(Boolean))) as string[];
    let postsById: Record<string, { title: string; slug: string }> = {};
    if (postIds.length > 0) {
      const { data: ps } = await sb.from("posts").select("id, title, slug").in("id", postIds);
      (ps ?? []).forEach((p: any) => { postsById[p.id] = { title: p.title, slug: p.slug }; });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();

    const todayRows = views.filter((v: any) => new Date(v.created_at).getTime() >= todayMs);
    const todayViews = todayRows.length;
    const todayVisitors = new Set(todayRows.map((v: any) => v.visitor_id)).size;

    // Build per-day buckets for last (windowDays) days, oldest -> newest
    type Day = { date: string; label: string; views: number; visitors: Set<string> };
    const buckets: Day[] = [];
    const byKey = new Map<string, Day>();
    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date(todayMs - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const day: Day = { date: key, label, views: 0, visitors: new Set() };
      buckets.push(day);
      byKey.set(key, day);
    }
    for (const v of views) {
      const key = new Date(v.created_at).toISOString().slice(0, 10);
      const b = byKey.get(key);
      if (b) { b.views++; b.visitors.add(v.visitor_id); }
    }
    const daily = buckets.map((b) => ({ date: b.date, label: b.label, views: b.views, visitors: b.visitors.size }));

    // Last 7 vs previous 7
    const last7 = daily.slice(-7);
    const prev7 = daily.slice(-14, -7);
    const sum = (arr: { views: number }[]) => arr.reduce((a, b) => a + b.views, 0);
    const last7Views = sum(last7);
    const prev7Views = sum(prev7);
    const pctChange7 = prev7Views === 0 ? (last7Views > 0 ? 100 : 0) : ((last7Views - prev7Views) / prev7Views) * 100;

    // Period window (last N days) for trend + tables
    const period = daily.slice(-days);
    const prevPeriod = daily.slice(-(days * 2), -days);
    const periodViews = sum(period);
    const prevPeriodViews = sum(prevPeriod);
    const pctChangePeriod = prevPeriodViews === 0 ? (periodViews > 0 ? 100 : 0) : ((periodViews - prevPeriodViews) / prevPeriodViews) * 100;
    const periodVisitors = new Set(
      views.filter((v: any) => new Date(v.created_at).getTime() >= todayMs - (days - 1) * 86400000).map((v: any) => v.visitor_id)
    ).size;

    // Overlay trend: current vs previous (aligned indexes)
    const trend = period.map((d, i) => ({
      label: d.label,
      current: d.views,
      currentVisitors: d.visitors,
      previous: prevPeriod[i]?.views ?? 0,
      previousVisitors: prevPeriod[i]?.visitors ?? 0,
    }));

    // Top posts in the period
    const periodRows = views.filter((v: any) => new Date(v.created_at).getTime() >= todayMs - (days - 1) * 86400000);
    const postCounts = new Map<string, number>();
    const pathCounts = new Map<string, number>();
    for (const v of periodRows) {
      if (v.post_id) postCounts.set(v.post_id, (postCounts.get(v.post_id) ?? 0) + 1);
      else pathCounts.set(v.path, (pathCounts.get(v.path) ?? 0) + 1);
    }
    const topPosts = Array.from(postCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({
        id,
        title: postsById[id]?.title ?? "(unknown)",
        slug: postsById[id]?.slug ?? null,
        count,
      }));
    const topPaths = Array.from(pathCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    // Top referrers
    const refCounts = new Map<string, number>();
    for (const v of periodRows) {
      let key = "Direct";
      if (v.referrer) {
        try { key = new URL(v.referrer).hostname.replace(/^www\./, ""); } catch { key = v.referrer; }
      }
      refCounts.set(key, (refCounts.get(key) ?? 0) + 1);
    }
    const topReferrers = Array.from(refCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([referrer, count]) => ({ referrer, count }));

    return {
      todayViews,
      todayVisitors,
      last7: { views: last7Views, pctChange: pctChange7, daily: last7 },
      period: { days, views: periodViews, visitors: periodVisitors, pctChange: pctChangePeriod, trend },
      topPosts,
      topPaths,
      topReferrers,
      hasData: views.length > 0,
    };
  });


// ============ REPORTS ============
export const reportsStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: posts } = await sb.from("posts").select("id, status, category_id, author_id, published_at, updated_at, seo_title, meta_description, featured_image_url");
    const { data: cats } = await sb.from("categories").select("id, name");
    const { data: authors } = await sb.from("authors").select("id, name");
    const list = posts ?? [];
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byAuthor: Record<string, number> = {};
    list.forEach((p: any) => {
      byStatus[p.status ?? "Unknown"] = (byStatus[p.status ?? "Unknown"] ?? 0) + 1;
      if (p.category_id) byCategory[p.category_id] = (byCategory[p.category_id] ?? 0) + 1;
      if (p.author_id) byAuthor[p.author_id] = (byAuthor[p.author_id] ?? 0) + 1;
    });
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    return {
      byStatus,
      byCategory: Object.entries(byCategory).map(([id, count]) => ({
        name: cats?.find((c: any) => c.id === id)?.name ?? "(unknown)",
        count,
      })),
      byAuthor: Object.entries(byAuthor).map(([id, count]) => ({
        name: authors?.find((a: any) => a.id === id)?.name ?? "(unknown)",
        count,
      })),
      publishedThisMonth: list.filter(
        (p: any) => p.status === "Published" && p.published_at && p.published_at >= startOfMonth,
      ).length,
      draftsForReview: list.filter((p: any) => p.status === "In review").length,
      seoIssueCount: list.filter(
        (p: any) => !p.seo_title || !p.meta_description || !p.featured_image_url,
      ).length,
      updated30: list.filter((p: any) => p.updated_at && p.updated_at >= thirtyAgo).length,
    };
  });

// ============ SETTINGS ============
export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("blog_settings")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().optional(),
      blog_name: z.string().min(1),
      blog_description: z.string().nullable().optional(),
      default_author_id: z.string().nullable().optional(),
      seo_title_pattern: z.string().min(1),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...row } = data;
    if (id) {
      const { error } = await supabaseAdmin.from("blog_settings").update(row).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("blog_settings").insert(row);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ============ NEWSLETTER ============
export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("newsletter_subscribers")
      .upsert({ email: data.email }, { onConflict: "email", ignoreDuplicates: true });
    return { ok: true };
  });

