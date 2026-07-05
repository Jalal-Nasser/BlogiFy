import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getPublicSupabase, POST_COLUMNS } from "../supabase";

export default defineTool({
  name: "search_posts",
  title: "Search blog posts",
  description: "Full-text ilike search across published post titles, excerpts, and content.",
  inputSchema: {
    query: z.string().min(1).describe("Search query."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const sb = getPublicSupabase();
    const pattern = `%${query.replace(/[%,]/g, "")}%`;
    const { data, error } = await sb
      .from("posts")
      .select(POST_COLUMNS)
      .eq("status", "published")
      .or(`title.ilike.${pattern},content.ilike.${pattern},excerpt.ilike.${pattern}`)
      .order("published_at", { ascending: false })
      .limit(limit ?? 10);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { posts: data ?? [] },
    };
  },
});
