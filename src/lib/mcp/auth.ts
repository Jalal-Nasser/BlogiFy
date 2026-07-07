// Bearer-token guard for MCP HTTP routes.
// Reads MCP_BEARER_TOKEN from the server environment and wraps a handler so
// every non-preflight request must present a matching Authorization: Bearer <token>.

type AnyHandler = (ctx: any) => Promise<Response> | Response;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Session-Id, Mcp-Session-Id, Accept",
  "Access-Control-Expose-Headers": "MCP-Session-Id, Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
} as const;

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function timingSafeEqualStr(a: string, b: string): boolean {
  // Compare hashed digests so unequal-length inputs don't leak length via early return.
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  // Fold to same length via XOR accumulator; still constant-time over max(len).
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

export function withBearerAuth(handler: AnyHandler): AnyHandler {
  return async (ctx) => {
    const request: Request = ctx.request;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const expected = process.env.MCP_BEARER_TOKEN;
    if (!expected) {
      return jsonError(500, "Server misconfiguration: MCP authentication is not configured.");
    }

    const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
    if (!authHeader) {
      return jsonError(401, "Authentication required.");
    }
    if (!authHeader.startsWith("Bearer ")) {
      return jsonError(401, "Invalid authorization header.");
    }
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token || !timingSafeEqualStr(token, expected)) {
      return jsonError(401, "Invalid credentials.");
    }

    const response = await handler(ctx);
    // Ensure CORS headers on the response too.
    const headers = new Headers(response.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      if (!headers.has(k)) headers.set(k, v);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
