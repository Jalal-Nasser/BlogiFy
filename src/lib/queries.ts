import { supabase } from "@/integrations/supabase/client";
import type { Category, Post, Page } from "./types";

// Untyped client surface — DB types regenerate elsewhere; we cast results.
const db = supabase as unknown as {
  from: (t: string) => any;
};

export async function fetchPosts(limit = 20): Promise<Post[]> {
  const { data, error } = await db
    .from("posts")
    .select("*, categories(*)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await db
    .from("posts")
    .select("*, categories(*)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Post) ?? null;
}

export async function fetchRelatedPosts(categoryId: string | null, excludeId: string): Promise<Post[]> {
  if (!categoryId) return [];
  const { data, error } = await db
    .from("posts")
    .select("*, categories(*)")
    .eq("category_id", categoryId)
    .eq("status", "published")
    .neq("id", excludeId)
    .order("published_at", { ascending: false })
    .limit(3);
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await db.from("categories").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await db.from("categories").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return (data as Category) ?? null;
}

export async function fetchPostsByCategory(categoryId: string): Promise<Post[]> {
  const { data, error } = await db
    .from("posts")
    .select("*, categories(*)")
    .eq("category_id", categoryId)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function searchPosts(q: string): Promise<Post[]> {
  if (!q.trim()) return [];
  const pattern = `%${q}%`;
  const { data, error } = await db
    .from("posts")
    .select("*, categories(*)")
    .eq("status", "published")
    .or(`title.ilike.${pattern},content.ilike.${pattern},excerpt.ilike.${pattern}`)
    .order("published_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function fetchPageBySlug(slug: string): Promise<Page | null> {
  const { data, error } = await db.from("pages").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return (data as Page) ?? null;
}

export async function subscribeEmail(email: string) {
  const { error } = await db.from("newsletter_subscribers").insert({ email });
  if (error) throw error;
}

export async function submitContact(name: string, email: string, message: string) {
  const { error } = await db.from("contact_messages").insert({ name, email, message });
  if (error) throw error;
}
