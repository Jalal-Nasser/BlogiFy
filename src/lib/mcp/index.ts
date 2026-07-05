import { defineMcp } from "@lovable.dev/mcp-js";
import listPostsTool from "./tools/list-posts";
import getPostTool from "./tools/get-post";
import searchPostsTool from "./tools/search-posts";
import listCategoriesTool from "./tools/list-categories";

export default defineMcp({
  name: "jalal-nasser-blog-mcp",
  title: "Jalal Nasser Blog",
  version: "0.1.0",
  instructions:
    "Read-only tools for Jalal Nasser's blog (AI, LLMs, software development). Use `list_posts` to browse recent posts, `search_posts` for keyword search, `get_post` for the full content of a single post by slug, and `list_categories` for available categories.",
  tools: [listPostsTool, getPostTool, searchPostsTool, listCategoriesTool],
});
