import { supabase } from "./supabase";
import type { Category, Post, Page } from "./types";

const POST_COLUMNS =
  "id,title,slug,content,excerpt,featured_image_url,author,category_slug,tags,status,published_at,read_time_minutes,views";

let categoryCache: Promise<Category[]> | null = null;
function getCategoryMap(): Promise<Map<string, Category>> {
  if (!categoryCache) categoryCache = fetchCategories();
  return categoryCache.then((list) => new Map(list.map((c) => [c.slug, c])));
}

function hydrate(post: any, byslug: Map<string, Category>): Post {
  const cat = post.category_slug ? byslug.get(post.category_slug) ?? null : null;
  return {
    ...post,
    tags: post.tags ?? [],
    categories: cat,
    category_id: cat?.id ?? null,
  } as Post;
}

async function hydrateMany(rows: any[]): Promise<Post[]> {
  const byslug = await getCategoryMap();
  return rows.map((r) => hydrate(r, byslug));
}

export async function fetchPosts(limit = 20): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return hydrateMany(data ?? []);
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const byslug = await getCategoryMap();
  return hydrate(data, byslug);
}

export async function fetchRelatedPosts(
  categorySlug: string | null,
  excludeId: string,
): Promise<Post[]> {
  if (!categorySlug) return [];
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("category_slug", categorySlug)
    .eq("status", "published")
    .neq("id", excludeId)
    .order("published_at", { ascending: false })
    .limit(3);
  if (error) throw error;
  return hydrateMany(data ?? []);
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,wp_id,name,slug,parent_slug,color,description")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,wp_id,name,slug,parent_slug,color,description")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Category) ?? null;
}

export async function fetchPostsByCategory(categorySlug: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("category_slug", categorySlug)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return hydrateMany(data ?? []);
}

export async function searchPosts(q: string): Promise<Post[]> {
  if (!q.trim()) return [];
  const pattern = `%${q.replace(/[%,]/g, "")}%`;
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("status", "published")
    .or(`title.ilike.${pattern},content.ilike.${pattern},excerpt.ilike.${pattern}`)
    .order("published_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return hydrateMany(data ?? []);
}

export async function fetchPageBySlug(_slug: string): Promise<Page | null> {
  return null;
}

export async function subscribeEmail(email: string) {
  const { error } = await supabase.rpc("newsletter_subscribe", { subscriber_email: email });
  if (error) throw error;
}

export async function submitContact(name: string, email: string, message: string) {
  const { error } = await supabase
    .from("contact_submissions")
    .insert({ name, email, message });
  if (error) throw new Error(error.message);
}
