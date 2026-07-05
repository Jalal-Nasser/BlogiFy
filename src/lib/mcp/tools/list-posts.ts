import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getPublicSupabase, POST_COLUMNS } from "../supabase";

export default defineTool({
  name: "list_posts",
  title: "List blog posts",
  description:
    "List published blog posts from Jalal Nasser's blog, most recent first. Optionally filter by category slug.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max posts to return (default 10)."),
    category_slug: z.string().optional().describe("Filter by category slug."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, category_slug }) => {
    const sb = getPublicSupabase();
    let q = sb
      .from("posts")
      .select(POST_COLUMNS)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit ?? 10);
    if (category_slug) q = q.eq("category_slug", category_slug);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { posts: data ?? [] },
    };
  },
});
