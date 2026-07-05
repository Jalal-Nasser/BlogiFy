import { createFileRoute } from "@tanstack/react-router";

// Paths that are always safe to serve (site chrome / logos).
const PUBLIC_ALLOWLIST = new Set<string>([
  "2023/09/cropped-Jblogify-1.png",
]);

function guessContentType(path: string, blobType?: string): string {
  if (blobType && blobType !== "application/octet-stream") return blobType;
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "gif": return "image/gif";
    case "webp": return "image/webp";
    case "avif": return "image/avif";
    case "svg": return "image/svg+xml";
    case "mp4": return "video/mp4";
    case "webm": return "video/webm";
    case "pdf": return "application/pdf";
    default: return "application/octet-stream";
  }
}

export const Route = createFileRoute("/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const raw = (params as { _splat?: string })._splat ?? "";
        // Reject path traversal and empty paths.
        if (!raw || raw.includes("..") || raw.startsWith("/")) {
          return new Response("Not found", { status: 404 });
        }
        const path = decodeURIComponent(raw);

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        let allowed = PUBLIC_ALLOWLIST.has(path);

        if (!allowed) {
          // Allow only if referenced by a PUBLISHED post
          // (featured image or embedded in HTML content).
          const suffix = `/media/${path}`;
          const like = `%${suffix}%`;
          const { data } = await supabaseAdmin
            .from("posts")
            .select("id")
            .eq("status", "published")
            .or(`featured_image_url.ilike.${like},content.ilike.${like}`)
            .limit(1);
          allowed = (data?.length ?? 0) > 0;
        }

        if (!allowed) {
          return new Response("Not found", { status: 404 });
        }

        const { data: file, error } = await supabaseAdmin
          .storage
          .from("media")
          .download(path);

        if (error || !file) {
          return new Response("Not found", { status: 404 });
        }

        const buf = await file.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": guessContentType(path, file.type),
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      },
    },
  },
});
