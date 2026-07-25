import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LANGS = ["ko", "fr", "ar"] as const;
export type Lang = (typeof LANGS)[number];

const LANG_NAMES: Record<Lang, string> = {
  ko: "Korean",
  fr: "French",
  ar: "Arabic (Modern Standard)",
};

// ---------- Public server-side reader (used by SSR route loaders) ----------
export const getPublishedPostTranslation = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      slug: z.string().min(1),
      lang: z.enum(LANGS),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const sb = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: post } = await sb
      .from("posts")
      .select("id,title,slug,excerpt,content,featured_image_url,author,category_slug,tags,published_at,read_time_minutes,meta_description,focus_keywords,seo_title")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!post) return null;
    const { data: tr } = await sb
      .from("post_translations")
      .select("title,excerpt,content,seo_title,meta_description,focus_keywords,status")
      .eq("post_id", post.id)
      .eq("lang", data.lang)
      .maybeSingle();
    return { post, translation: tr ?? null };
  });

export const listPublishedTranslated = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ lang: z.enum(LANGS), limit: z.number().int().min(1).max(60).default(20) }).parse(d))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const sb = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: posts } = await sb
      .from("posts")
      .select("id,title,slug,excerpt,featured_image_url,published_at,category_slug")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(data.limit);
    if (!posts || posts.length === 0) return [];
    const ids = posts.map((p: any) => p.id);
    const { data: trs } = await sb
      .from("post_translations")
      .select("post_id,title,excerpt")
      .in("post_id", ids)
      .eq("lang", data.lang);
    const byId = new Map((trs ?? []).map((t: any) => [t.post_id, t]));
    return posts.map((p: any) => {
      const t = byId.get(p.id);
      return {
        id: p.id,
        slug: p.slug,
        title: t?.title ?? p.title,
        excerpt: t?.excerpt ?? p.excerpt,
        featured_image_url: p.featured_image_url,
        published_at: p.published_at,
        category_slug: p.category_slug,
        translated: !!t,
      };
    });
  });

// ---------- Auto-translation (Lovable AI Gateway) ----------
async function callGemini(system: string, user: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway [${res.status}]: ${text.slice(0, 300)}`);
  }
  const json: any = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

function extractJsonBlock(s: string): string {
  const fence = s.match(/```json\s*([\s\S]*?)```/i) || s.match(/```\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first >= 0 && last > first) return s.slice(first, last + 1);
  return s.trim();
}

async function translateOne(source: {
  title: string;
  excerpt: string | null;
  content: string;
  seo_title: string | null;
  meta_description: string | null;
  focus_keywords: string[];
}, lang: Lang) {
  const langName = LANG_NAMES[lang];
  const system = `You are a professional translator producing publication-ready ${langName} for a technology blog. Preserve HTML tags, attributes, code blocks, image URLs, and formatting exactly. Never translate code, brand names, product names, or URLs. Do NOT add commentary. Return ONLY strict JSON matching the requested schema.`;
  const user = `Translate the following blog post from English to ${langName}. Return JSON with keys: title, excerpt, content, seo_title, meta_description, focus_keywords (array of translated keywords, same length as input).\n\nINPUT_JSON:\n${JSON.stringify({
    title: source.title,
    excerpt: source.excerpt ?? "",
    content: source.content,
    seo_title: source.seo_title ?? source.title,
    meta_description: source.meta_description ?? "",
    focus_keywords: source.focus_keywords ?? [],
  })}`;
  const raw = await callGemini(system, user);
  const parsed = JSON.parse(extractJsonBlock(raw));
  return {
    title: String(parsed.title ?? source.title).slice(0, 500),
    excerpt: parsed.excerpt ? String(parsed.excerpt) : null,
    content: String(parsed.content ?? source.content),
    seo_title: parsed.seo_title ? String(parsed.seo_title) : null,
    meta_description: parsed.meta_description ? String(parsed.meta_description) : null,
    focus_keywords: Array.isArray(parsed.focus_keywords) ? parsed.focus_keywords.map(String) : [],
  };
}

// Shared runner. Accepts any Supabase client (the caller must be authorized).
export async function runTranslateForPost(sb: any, postId: string, langs: Lang[] = [...LANGS], force = false) {
  const { data: post, error } = await sb
    .from("posts")
    .select("id,title,excerpt,content,seo_title,meta_description,focus_keywords")
    .eq("id", postId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!post) throw new Error("Post not found");

  const source = {
    title: post.title,
    excerpt: post.excerpt,
    content: post.content ?? "",
    seo_title: post.seo_title,
    meta_description: post.meta_description,
    focus_keywords: Array.isArray(post.focus_keywords) ? post.focus_keywords : [],
  };

  const results: { lang: Lang; ok: boolean; error?: string }[] = [];
  for (const lang of langs) {
    try {
      if (!force) {
        const { data: existing } = await sb
          .from("post_translations")
          .select("status")
          .eq("post_id", postId)
          .eq("lang", lang)
          .maybeSingle();
        if (existing && existing.status !== "auto") {
          results.push({ lang, ok: true });
          continue;
        }
      }
      const t = await translateOne(source, lang);
      const { error: upErr } = await sb
        .from("post_translations")
        .upsert({
          post_id: postId,
          lang,
          ...t,
          status: "auto",
          translated_at: new Date().toISOString(),
        });
      if (upErr) throw new Error(upErr.message);
      results.push({ lang, ok: true });
    } catch (e: any) {
      results.push({ lang, ok: false, error: e?.message ?? String(e) });
    }
  }
  return { results };
}

export const translatePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      postId: z.string().uuid(),
      langs: z.array(z.enum(LANGS)).default([...LANGS]),
      force: z.boolean().default(false),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    return runTranslateForPost(context.supabase, data.postId, data.langs, data.force);
  });

