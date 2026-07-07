import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Clock, ExternalLink } from "lucide-react";
import { getArabicArticle, getArabicArticleBody, ARABIC_ARTICLES } from "@/lib/arabic-articles";

const SITE = "https://jalalnasser.com";


export const Route = createFileRoute("/ar/blog/$slug")({
  loader: ({ params }) => {
    const article = getArabicArticle(params.slug);
    if (!article) throw notFound();
    // Return serializable metadata only — never React components / functions.
    return { slug: article.slug };
  },
  head: ({ params }) => {
    const article = getArabicArticle(params.slug);
    const arUrl = `${SITE}/ar/blog/${params.slug}`;
    const enUrl = `${SITE}/blog/${params.slug}`;
    if (!article) {
      return { meta: [{ title: "غير موجود" }, { name: "robots", content: "noindex" }] };
    }

    const image = `${SITE}${article.image}`;
    return {
      meta: [
        { title: `${article.seoTitle} — بلوجيفاي` },
        { name: "description", content: article.description },
        { property: "og:title", content: article.seoTitle },
        { property: "og:description", content: article.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: arUrl },
        { property: "og:image", content: image },
        { property: "og:locale", content: "ar_AR" },
        { property: "og:locale:alternate", content: "en_US" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: article.seoTitle },
        { name: "twitter:description", content: article.description },
        { name: "twitter:image", content: image },
      ],
      links: [
        { rel: "canonical", href: arUrl },
        { rel: "alternate", hrefLang: "ar", href: arUrl },
        { rel: "alternate", hrefLang: "en", href: enUrl },
        { rel: "alternate", hrefLang: "x-default", href: enUrl },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: article.seoTitle,
            description: article.description,
            image,
            datePublished: article.publishedAt,
            inLanguage: "ar",
            author: { "@type": "Person", name: "Jalal Nasser", url: SITE },
            publisher: {
              "@type": "Organization",
              name: "بلوجيفاي",
              url: SITE,
              logo: { "@type": "ImageObject", url: `${SITE}/logo.png` },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": arUrl },
            translationOfWork: { "@type": "BlogPosting", "@id": enUrl },
          }),
        },
      ],
    };
  },
  component: ArabicArticlePage,
  notFoundComponent: () => (
    <div className="p-20 text-center text-muted-foreground">المقال غير موجود.</div>
  ),
});

function ArabicArticlePage() {
  const { slug } = Route.useParams();
  const { article } = Route.useLoaderData();
  const Body = article.Body;
  const enUrl = `/blog/${slug}`;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 lg:py-16">
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <Link to="/ar/blog" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4 rotate-180" /> عودة إلى المقالات
        </Link>
        <span className="text-border">•</span>
        <a
          href={enUrl}
          className="inline-flex items-center gap-1 text-brand hover:underline"
          dir="ltr"
        >
          English version <ExternalLink className="size-3.5" />
        </a>
      </div>

      <p className="font-mono text-xs uppercase tracking-widest text-brand">{article.category}</p>
      <h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
        {article.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="size-4" />
          {new Date(article.publishedAt).toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4" /> {article.readTime} دقائق قراءة
        </span>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border">
        <img
          src={article.image}
          alt={article.imageAlt}
          className="aspect-[21/9] w-full object-cover"
          loading="eager"
        />
      </div>

      <div className="mt-8">
        <Body />
      </div>

      <div className="mt-14 rounded-lg border border-border bg-surface/40 p-6">
        <h3 className="font-display text-lg font-semibold">اقرأ أيضاً</h3>
        <ul className="mt-4 space-y-3">
          {ARABIC_ARTICLES.filter((a) => a.slug !== slug).map((a) => (
            <li key={a.slug}>
              <Link
                to="/ar/blog/$slug"
                params={{ slug: a.slug }}
                className="text-brand hover:underline"
              >
                {a.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          to="/ar/blog"
          className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface"
        >
          جميع المقالات العربية
        </Link>
        <Link
          to="/ar"
          className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface"
        >
          الصفحة الرئيسية
        </Link>
      </div>
    </article>
  );
}
