// route: /mcp — bearer-token protected
import { createFileRoute } from "@tanstack/react-router";
import { createTanStackMcpHandler } from "@lovable.dev/mcp-js/stacks/tanstack";
import mcp from "../lib/mcp/index";
import { withBearerAuth } from "../lib/mcp/auth";

const handler = createTanStackMcpHandler(mcp, {
  resourcePath: "/mcp",
  metadataPath: "/.well-known/oauth-protected-resource",
  trustForwardedHost: true,
});

export const Route = createFileRoute("/mcp")({
  server: {
    handlers: {
      ANY: withBearerAuth(handler),
    },
  },
});
