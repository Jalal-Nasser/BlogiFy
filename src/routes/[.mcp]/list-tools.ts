// route: /.mcp/list-tools — bearer-token protected
import { createFileRoute } from "@tanstack/react-router";
import { createTanStackListToolsHandler } from "@lovable.dev/mcp-js/stacks/tanstack";
import mcp from "../../lib/mcp/index";
import { withBearerAuth } from "../../lib/mcp/auth";

const handler = createTanStackListToolsHandler(mcp, {
  resourcePath: "/mcp",
  metadataPath: "/.well-known/oauth-protected-resource",
  trustForwardedHost: true,
});

export const Route = createFileRoute("/.mcp/list-tools")({
  server: {
    handlers: {
      ANY: withBearerAuth(handler),
    },
  },
});
