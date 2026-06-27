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
      .select("id, title, slug, status, featured, published_at, updated_at, category_id, author_id, featured_image_url, seo_title, meta_description, canonical_url, excerpt")
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
});

export const savePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => postInput.parse(d))
  .handler(async ({ data, context }) => {
    const { id, tag_ids, ...fields } = data;
    const row: any = {
      ...fields,
      content: fields.content ?? "",
      author: "Admin", // legacy non-null column on existing posts table
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
    return { id: postId };
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
      email: z.string().email().nullable().optional(),
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
    return {
      totalPosts: list.length,
      published: list.filter((p: any) => p.status === "Published").length,
      drafts: list.filter((p: any) => p.status === "Draft").length,
      scheduled: list.filter((p: any) => p.status === "Scheduled").length,
      inReview: list.filter((p: any) => p.status === "In review").length,
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
      needReview: list.filter((p: any) => p.status === "In review").slice(0, 5),
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
      .select("id, title, slug, seo_title, meta_description, featured_image_url, category_id, canonical_url");
    const { data: pt } = await sb.from("post_tags").select("post_id");
    const tagged = new Set((pt ?? []).map((r: any) => r.post_id));
    const list = posts ?? [];
    const slugCount = new Map<string, number>();
    list.forEach((p: any) => slugCount.set(p.slug, (slugCount.get(p.slug) ?? 0) + 1));
    return {
      missingSeoTitle: list.filter((p: any) => !p.seo_title),
      missingMeta: list.filter((p: any) => !p.meta_description),
      missingFeaturedImage: list.filter((p: any) => !p.featured_image_url),
      missingCategory: list.filter((p: any) => !p.category_id),
      missingTags: list.filter((p: any) => !tagged.has(p.id)),
      missingCanonical: list.filter((p: any) => !p.canonical_url),
      duplicateSlugs: list.filter((p: any) => (slugCount.get(p.slug) ?? 0) > 1),
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
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
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
      admin_email: z.string().email().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...row } = data;
    if (id) {
      const { error } = await context.supabase.from("blog_settings").update(row).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("blog_settings").insert(row);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
