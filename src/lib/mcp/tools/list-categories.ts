import { defineTool } from "@lovable.dev/mcp-js";
import { getPublicSupabase } from "../supabase";

export default defineTool({
  name: "list_categories",
  title: "List categories",
  description: "List all blog categories on Jalal Nasser's blog.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const sb = getPublicSupabase();
    const { data, error } = await sb
      .from("categories")
      .select("id,name,slug,parent_slug,color,description")
      .order("name");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { categories: data ?? [] },
    };
  },
});
