import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getPublicSupabase } from "../supabase";

export default defineTool({
  name: "get_post",
  title: "Get blog post",
  description: "Fetch a single published blog post by slug, including its full HTML content.",
  inputSchema: {
    slug: z.string().min(1).describe("The post slug, e.g. 'prompt-engineering-best-practices-for-better-ai-results'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const sb = getPublicSupabase();
    const { data, error } = await sb
      .from("posts")
      .select(
        "id,title,slug,content,excerpt,featured_image_url,author,category_slug,tags,published_at,read_time_minutes,seo_title,meta_description,canonical_url",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: `No published post with slug "${slug}".` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { post: data },
    };
  },
});
