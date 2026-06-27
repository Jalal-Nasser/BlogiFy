import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://jalalnasser.com";

const STATIC_PAGES = [
  { url: `${BASE}/`, priority: "1.0", changefreq: "daily" },
  { url: `${BASE}/about`, priority: "0.5", changefreq: "monthly" },
  { url: `${BASE}/contact`, priority: "0.5", changefreq: "monthly" },
  { url: `${BASE}/search`, priority: "0.4", changefreq: "monthly" },
  { url: `${BASE}/privacy-policy`, priority: "0.3", changefreq: "yearly" },
  { url: `${BASE}/terms`, priority: "0.3", changefreq: "yearly" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL!,
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!
        );

        const { data: posts } = await supabase
          .from("posts")
          .select("slug, published_at")
          .eq("status", "published")
          .order("published_at", { ascending: false });

        const { data: categories } = await supabase
          .from("categories")
          .select("slug");

        const postUrls = (posts || []).map((p) => ({
          url: `${BASE}/blog/${p.slug}`,
          lastmod: p.published_at ? new Date(p.published_at).toISOString().split("T")[0] : undefined,
          priority: "0.8",
          changefreq: "weekly",
        }));

        const categoryUrls = (categories || []).map((c) => ({
          url: `${BASE}/category/${c.slug}`,
          priority: "0.6",
          changefreq: "weekly",
        }));

        const allUrls = [...STATIC_PAGES, ...postUrls, ...categoryUrls];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.url}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
