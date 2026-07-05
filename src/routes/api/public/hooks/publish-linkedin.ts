import { createFileRoute } from "@tanstack/react-router";

// Public site base URL (used when building canonical article links for LinkedIn).
const SITE_URL = "https://www.jalalnasser.com";
// LinkedIn author URN for the connected member (Jalal Nasser).
// Public identifier; safe to keep in code.
const LINKEDIN_AUTHOR_URN = "urn:li:person:a211CfJsKp";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/linkedin/v2/ugcPosts";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  tags: string[] | null;
  category_slug: string | null;
};

function toHashtag(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9 ]/g, "").trim();
  if (!cleaned) return "";
  return (
    "#" +
    cleaned
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("")
  );
}

function buildCaption(post: PostRow): string {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const hook = post.title;
  const summary = post.excerpt?.trim() || "New article on AI, LLMs, and modern software development.";
  const tagSource = (post.tags && post.tags.length > 0 ? post.tags : [post.category_slug ?? "AI"]).slice(0, 5);
  const hashtags = tagSource.map(toHashtag).filter(Boolean).join(" ");
  return `${hook}\n\n${summary}\n\nRead the full article: ${url}\n\n${hashtags}`.trim();
}

async function publishToLinkedIn(caption: string, articleUrl: string): Promise<{ id: string }> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const linkedinKey = process.env.LINKEDIN_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY missing");
  if (!linkedinKey) throw new Error("LINKEDIN_API_KEY missing (LinkedIn connector not linked)");

  const body = {
    author: LINKEDIN_AUTHOR_URN,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: caption },
        shareMediaCategory: "ARTICLE",
        media: [{ status: "READY", originalUrl: articleUrl }],
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": linkedinKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`LinkedIn ${res.status}: ${text.slice(0, 500)}`);
  const json = JSON.parse(text) as { id?: string };
  if (!json.id) throw new Error(`LinkedIn response missing id: ${text.slice(0, 200)}`);
  return { id: json.id };
}

export const Route = createFileRoute("/api/public/hooks/publish-linkedin")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data, error } = await supabaseAdmin
          .from("posts")
          .select("id,title,slug,excerpt,tags,category_slug")
          .eq("status", "published")
          .eq("published_to_linkedin", false)
          .order("published_at", { ascending: true })
          .limit(5);

        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const results: Array<{ id: string; slug: string; status: string; linkedin_post_id?: string; error?: string }> = [];

        for (const post of (data ?? []) as PostRow[]) {
          const articleUrl = `${SITE_URL}/blog/${post.slug}`;
          const caption = buildCaption(post);
          try {
            const { id: liId } = await publishToLinkedIn(caption, articleUrl);
            const liUrl = `https://www.linkedin.com/feed/update/${liId}/`;
            await supabaseAdmin
              .from("posts")
              .update({
                published_to_linkedin: true,
                linkedin_post_id: liId,
                linkedin_post_url: liUrl,
                linkedin_published_at: new Date().toISOString(),
                linkedin_publish_error: null,
              })
              .eq("id", post.id);
            results.push({ id: post.id, slug: post.slug, status: "published", linkedin_post_id: liId });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            await supabaseAdmin
              .from("posts")
              .update({ linkedin_publish_error: msg })
              .eq("id", post.id);
            results.push({ id: post.id, slug: post.slug, status: "failed", error: msg });
          }
        }

        return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
