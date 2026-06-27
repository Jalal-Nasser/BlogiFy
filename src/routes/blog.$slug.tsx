import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { fetchPostBySlug, fetchRelatedPosts } from "@/lib/queries";
import { CategoryBadge } from "@/components/site/CategoryBadge";
import { AdSlot } from "@/components/site/AdSlot";
import { PostCard } from "@/components/site/PostCard";
import { Sidebar } from "@/components/site/Sidebar";
import { Clock, Eye, User, Calendar, Twitter, Linkedin, Link2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/blog/$slug")({
  component: PostPage,
  notFoundComponent: () => <div className="p-20 text-center text-muted-foreground">Post not found.</div>,
  errorComponent: ({ error }) => <div className="p-20 text-center text-destructive">{String(error)}</div>,
});

function PostPage() {
  const { slug } = Route.useParams();
  const { data: post, isLoading } = useQuery({ queryKey: ["post", slug], queryFn: () => fetchPostBySlug(slug) });
  const { data: related = [] } = useQuery({
    queryKey: ["related", post?.id],
    queryFn: () => fetchRelatedPosts(post?.category_slug ?? null, post?.id ?? ""),
    enabled: !!post,
  });

  // Auto-generate TOC and inject heading IDs
  const { contentWithIds, toc } = useMemo(() => {
    if (!post) return { contentWithIds: "", toc: [] as { id: string; text: string }[] };
    const toc: { id: string; text: string }[] = [];
    const content = post.content.replace(/<h2[^>]*>(.*?)<\/h2>/gi, (_m, text) => {
      const id = String(text).toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      toc.push({ id, text: String(text).replace(/<[^>]+>/g, "") });
      return `<h2 id="${id}">${text}</h2>`;
    });
    return { contentWithIds: content, toc };
  }, [post]);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  // Inject per-post SEO tags
  useEffect(() => {
    if (!post) return;
    const base = "https://jalalnasser.com";
    const url = `${base}/blog/${post.slug}`;

    // Canonical
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // OG tags
    const setMeta = (prop: string, val: string, attr = "property") => {
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${prop}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, prop); document.head.appendChild(el); }
      el.setAttribute("content", val);
    };
    const fallbackDescription = "A hands-on tech tutorial from BlogiFy covering Linux, security, WordPress, self-hosting, and modern infrastructure.";
    setMeta("og:url", url);
    setMeta("og:type", "article");
    setMeta("og:title", post.title);
    setMeta("og:description", post.excerpt || fallbackDescription);
    if (post.featured_image_url) setMeta("og:image", post.featured_image_url);
    setMeta("twitter:title", post.title, "name");
    setMeta("twitter:description", post.excerpt || fallbackDescription, "name");
    if (post.featured_image_url) setMeta("twitter:image", post.featured_image_url, "name");
    document.title = `${post.title} — BlogiFy`;

    // JSON-LD Article
    const existingLd = document.getElementById("ld-article");
    if (existingLd) existingLd.remove();
    const ld = document.createElement("script");
    ld.id = "ld-article";
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": post.excerpt || "",
      "image": post.featured_image_url || "",
      "datePublished": post.published_at,
      "author": { "@type": "Person", "name": post.author, "url": base },
      "publisher": {
        "@type": "Organization",
        "name": "BlogiFy",
        "url": base,
        "logo": { "@type": "ImageObject", "url": `${base}/logo.png` }
      },
      "url": url,
      "mainEntityOfPage": { "@type": "WebPage", "@id": url }
    });
    document.head.appendChild(ld);

    return () => {
      document.getElementById("ld-article")?.remove();
    };
  }, [post]);

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-20"><div className="h-96 animate-pulse rounded-2xl bg-surface" /></div>;
  if (!post) return <div className="p-20 text-center">Post not found.</div>;

  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <article className="mx-auto max-w-7xl px-4 lg:px-6 pt-6 lg:pt-10">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="size-4" /> Back</Link>

      {/* Hero */}
      <header className="max-w-4xl">
        {post.categories && <CategoryBadge category={post.categories} />}
        <h1 className="mt-4 font-display text-3xl lg:text-5xl font-bold tracking-tight leading-tight">
          {post.title}
        </h1>
        {post.excerpt && <p className="mt-4 text-lg text-muted-foreground max-w-3xl">{post.excerpt}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><User className="size-4" /> {post.author}</span>
          <span className="flex items-center gap-1.5"><Calendar className="size-4" /> {new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          <span className="flex items-center gap-1.5"><Clock className="size-4" /> {post.read_time_minutes} min read</span>
          <span className="flex items-center gap-1.5"><Eye className="size-4" /> {post.views.toLocaleString()} views</span>
        </div>
      </header>

      {post.featured_image_url && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          <img src={post.featured_image_url} alt={post.title} className="w-full aspect-[21/9] object-cover" />
        </div>
      )}

      {/* Below-hero AdSense */}
      <div className="mt-8 max-w-4xl">
        {/* Google AdSense — below hero */}
        <AdSlot size="leaderboard" label="Below-Hero Ad" />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {/* TOC */}
          {toc.length > 1 && (
            <div className="surface-card p-5 mb-8">
              <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">Table of Contents</h3>
              <ol className="mt-3 space-y-1.5 text-sm">
                {toc.map((t, i) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="hover:text-brand">
                      <span className="font-mono text-muted-foreground mr-2">{String(i + 1).padStart(2, "0")}</span>{t.text}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Article */}
          <div className="prose-article max-w-none" dangerouslySetInnerHTML={{ __html: contentWithIds }} />

          {/* Mid-article AdSense */}
          <div className="my-10">
            {/* Google AdSense — mid-article */}
            <AdSlot size="rectangle" label="Mid-Article Ad" />
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span key={t} className="rounded-md border border-border px-2.5 py-1 text-xs font-mono text-muted-foreground">#{t}</span>
              ))}
            </div>
          )}

          {/* Share */}
          <div className="mt-8 flex items-center gap-3 border-t border-border pt-6">
            <span className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Share</span>
            <a aria-label="Share on Twitter" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noreferrer" className="size-9 grid place-items-center rounded-md border border-border hover:border-brand hover:text-brand"><Twitter className="size-4" /></a>
            <a aria-label="Share on LinkedIn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="size-9 grid place-items-center rounded-md border border-border hover:border-brand hover:text-brand"><Linkedin className="size-4" /></a>
            <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied!"); }} aria-label="Copy link" className="size-9 grid place-items-center rounded-md border border-border hover:border-brand hover:text-brand"><Link2 className="size-4" /></button>
          </div>

          {/* Author */}
          <div className="mt-10 surface-card p-6 flex items-start gap-4">
            <div className="size-14 shrink-0 rounded-full bg-gradient-to-br from-brand to-accent grid place-items-center text-brand-foreground font-display text-xl font-bold">JN</div>
            <div>
              <h4 className="font-display text-base font-semibold">{post.author}</h4>
              <p className="text-sm text-muted-foreground mt-1">Sysadmin, security researcher, and founder of BlogiFy. Writes about Linux, self-hosting, and the practical side of running internet infrastructure.</p>
            </div>
          </div>

          {/* After-content AdSense */}
          <div className="mt-10">
            {/* Google AdSense — after content */}
            <AdSlot size="leaderboard" label="After-Content Ad" />
          </div>

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-14">
              <h3 className="font-display text-xl font-semibold mb-6">Related posts</h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => <PostCard key={p.id} post={p} />)}
              </div>
            </section>
          )}
        </div>

        <Sidebar />
      </div>
    </article>
  );
}
