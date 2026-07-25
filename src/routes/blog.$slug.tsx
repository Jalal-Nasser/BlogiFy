import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { fetchPostBySlug, fetchRelatedPosts } from "@/lib/queries";
import { hasArabicVersion } from "@/lib/arabic-articles";
import { getPostSeoOverride } from "@/lib/post-seo";
import { CategoryBadge } from "@/components/site/CategoryBadge";

import { PostCard } from "@/components/site/PostCard";
import { Sidebar } from "@/components/site/Sidebar";
import { Clock, Eye, User, Calendar, Twitter, Linkedin, Link2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const SITE_BASE = "https://jalalnasser.com";
const FALLBACK_DESCRIPTION =
  "A hands-on tech tutorial from BlogiFy covering Linux, security, WordPress, self-hosting, and modern infrastructure.";

type PostHeadMeta = {
  found: boolean;
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  image: string;
  imageAlt: string;
  publishedAt: string | null;
  author: string;
  tags: string[];
  keywords: string[];
  hasArabic: boolean;
};

function toAbsoluteUrl(path: string): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export const Route = createFileRoute("/blog/$slug")({
  component: PostPage,
  loader: async ({ params }): Promise<PostHeadMeta> => {
    const post = await fetchPostBySlug(params.slug);
    if (!post) {
      return {
        found: false,
        slug: params.slug,
        title: "Post not found",
        seoTitle: "Post not found",
        description: FALLBACK_DESCRIPTION,
        image: "",
        imageAlt: "",
        publishedAt: null,
        author: "Jalal Nasser",
        tags: [],
        keywords: [],
        hasArabic: false,
      };
    }
    const override = getPostSeoOverride(post.slug);
    const tags = Array.isArray(post.tags) ? post.tags : [];
    const focus = Array.isArray(post.focus_keywords) ? post.focus_keywords : [];
    const keywords = Array.from(new Set([...(override?.keywords ?? []), ...focus, ...tags]));
    return {
      found: true,
      slug: post.slug,
      title: post.title,
      seoTitle: override?.seoTitle ?? post.title,
      description: override?.metaDescription ?? post.meta_description ?? post.excerpt ?? FALLBACK_DESCRIPTION,
      image: toAbsoluteUrl(post.featured_image_url ?? ""),
      imageAlt: override?.imageAlt ?? post.title,
      publishedAt: post.published_at ?? null,
      author: post.author ?? "Jalal Nasser",
      tags,
      keywords,
      hasArabic: hasArabicVersion(post.slug),
    };
  },
  head: ({ params, loaderData }) => {
    const data: PostHeadMeta =
      loaderData ?? {
        found: false,
        slug: params.slug,
        title: "Loading…",
        seoTitle: "Loading…",
        description: FALLBACK_DESCRIPTION,
        image: "",
        imageAlt: "",
        publishedAt: null,
        author: "Jalal Nasser",
        tags: [],
        keywords: [],
        hasArabic: false,
      };
    const url = `${SITE_BASE}/blog/${data.slug}`;
    const meta: Array<Record<string, string>> = [
      { title: data.seoTitle },
      { name: "description", content: data.description },
      {
        name: "robots",
        content: data.found ? "index,follow,max-image-preview:large" : "noindex,follow",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { property: "og:site_name", content: "BlogiFy" },
      { property: "og:title", content: data.seoTitle },
      { property: "og:description", content: data.description },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: data.seoTitle },
      { name: "twitter:description", content: data.description },
    ];
    if (data.image) {
      meta.push({ property: "og:image", content: data.image });
      meta.push({ property: "og:image:alt", content: data.imageAlt });
      meta.push({ name: "twitter:image", content: data.image });
      meta.push({ name: "twitter:image:alt", content: data.imageAlt });
    }
    if (data.publishedAt) {
      meta.push({ property: "article:published_time", content: data.publishedAt });
    }
    meta.push({ property: "article:author", content: data.author });
    for (const tag of data.tags) {
      meta.push({ property: "article:tag", content: tag });
    }
    if (data.tags.length > 0) {
      meta.push({ name: "keywords", content: data.tags.join(", ") });
    }

    const links: Array<Record<string, string>> = [
      { rel: "canonical", href: url },
    ];
    if (data.hasArabic) {
      const arUrl = `${SITE_BASE}/ar/blog/${data.slug}`;
      links.push({ rel: "alternate", hrefLang: "en", href: url });
      links.push({ rel: "alternate", hrefLang: "ar", href: arUrl });
      links.push({ rel: "alternate", hrefLang: "x-default", href: url });
    }

    const scripts = data.found
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: data.seoTitle,
              description: data.description,
              image: data.image ? [data.image] : undefined,
              datePublished: data.publishedAt,
              author: { "@type": "Person", name: data.author, url: SITE_BASE },
              publisher: {
                "@type": "Organization",
                name: "BlogiFy",
                url: SITE_BASE,
                logo: { "@type": "ImageObject", url: `${SITE_BASE}/logo.png` },
              },
              url,
              mainEntityOfPage: { "@type": "WebPage", "@id": url },
            }),
          },
        ]
      : [];

    return { meta, links, scripts };
  },
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


  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-20"><div className="h-96 animate-pulse rounded-2xl bg-surface" /></div>;
  if (!post) return <div className="p-20 text-center">Post not found.</div>;

  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <article className="mx-auto max-w-7xl px-4 lg:px-6 pt-6 lg:pt-10">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back</Link>
        {hasArabicVersion(post.slug) && (
          <a
            href={`/ar/blog/${post.slug}`}
            className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
            hrefLang="ar"
            lang="ar"
            dir="rtl"
          >
            العربية
          </a>
        )}
      </div>

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
          <img src={post.featured_image_url} alt={getPostSeoOverride(post.slug)?.imageAlt ?? post.title} className="w-full aspect-[21/9] object-cover" />
        </div>
      )}


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
            <img
              src="/jalal-nasser.jpg"
              alt="Jalal Nasser"
              className="size-14 shrink-0 rounded-full object-cover object-top ring-2 ring-brand/30"
            />
            <div>
              <h4 className="font-display text-base font-semibold">{post.author}</h4>
              <p className="text-xs text-brand font-mono uppercase tracking-widest mt-0.5">Full-Stack &amp; AI Developer · Sysadmin · Blogger</p>
              <p className="text-sm text-muted-foreground mt-2">Full-stack web developer and AI builder with a passion for Linux, cybersecurity, and the open web. Founder of BlogiFy — writing practical tutorials on server hardening, self-hosting, WordPress, and building SaaS products with the modern AI stack.</p>
            </div>
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
