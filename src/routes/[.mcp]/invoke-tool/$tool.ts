// route: /.mcp/invoke-tool/$tool — bearer-token protected
import { createFileRoute } from "@tanstack/react-router";
import { createTanStackInvokeToolHandler } from "@lovable.dev/mcp-js/stacks/tanstack";
import mcp from "../../../lib/mcp/index";
import { withBearerAuth } from "../../../lib/mcp/auth";

const handler = createTanStackInvokeToolHandler(mcp, {
  resourcePath: "/mcp",
  metadataPath: "/.well-known/oauth-protected-resource",
  trustForwardedHost: true,
});

export const Route = createFileRoute("/.mcp/invoke-tool/$tool")({
  server: {
    handlers: {
      ANY: withBearerAuth(handler),
    },
  },
});
