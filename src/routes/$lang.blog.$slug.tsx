import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPublishedPostTranslation } from "@/lib/translations.functions";

const SITE_BASE = "https://jalalnasser.com";

const OG_LOCALE: Record<string, string> = { ko: "ko_KR", fr: "fr_FR", ar: "ar_AR" };
const BACK_LABEL: Record<string, string> = { ko: "← 블로그로 돌아가기", fr: "← Retour au blog", ar: "→ العودة إلى المدونة" };
const AUTO_NOTE: Record<string, string> = {
  ko: "이 번역은 자동으로 생성되었습니다.",
  fr: "Cette traduction a été générée automatiquement.",
  ar: "تمت ترجمة هذه المقالة تلقائياً.",
};

type LoaderData = {
  slug: string;
  lang: string;
  title: string;
  excerpt: string | null;
  content: string;
  metaDescription: string;
  seoTitle: string;
  image: string | null;
  publishedAt: string | null;
  translated: boolean;
  translationStatus: string | null;
  originalTitle: string;
};

function abs(url: string | null | undefined) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

export const Route = createFileRoute("/$lang/blog/$slug")({
  loader: async ({ params }): Promise<LoaderData> => {
    const res = await getPublishedPostTranslation({ data: { slug: params.slug, lang: params.lang as any } });
    if (!res) throw notFound();
    const { post, translation } = res;
    const title = translation?.title ?? post.title;
    const excerpt = translation?.excerpt ?? post.excerpt ?? null;
    const content = translation?.content ?? post.content ?? "";
    const seoTitle = translation?.seo_title ?? title;
    const metaDescription = translation?.meta_description ?? post.meta_description ?? excerpt ?? "";
    return {
      slug: post.slug,
      lang: params.lang,
      title,
      excerpt,
      content,
      metaDescription,
      seoTitle,
      image: abs(post.featured_image_url),
      publishedAt: post.published_at ?? null,
      translated: !!translation,
      translationStatus: translation?.status ?? null,
      originalTitle: post.title,
    };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] };
    }
    const d = loaderData;
    const url = `${SITE_BASE}/${params.lang}/blog/${params.slug}`;
    const enUrl = `${SITE_BASE}/blog/${params.slug}`;
    return {
      meta: [
        { title: d.seoTitle },
        { name: "description", content: d.metaDescription },
        { property: "og:title", content: d.seoTitle },
        { property: "og:description", content: d.metaDescription },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { property: "og:locale", content: OG_LOCALE[params.lang] ?? "en_US" },
        { property: "og:locale:alternate", content: "en_US" },
        ...(d.image ? [{ property: "og:image", content: d.image }, { name: "twitter:image", content: d.image }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "en", href: enUrl },
        { rel: "alternate", hrefLang: "ko", href: `${SITE_BASE}/ko/blog/${params.slug}` },
        { rel: "alternate", hrefLang: "fr", href: `${SITE_BASE}/fr/blog/${params.slug}` },
        { rel: "alternate", hrefLang: "ar", href: `${SITE_BASE}/ar/blog/${params.slug}` },
        { rel: "alternate", hrefLang: "x-default", href: enUrl },
      ],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: d.title,
          description: d.metaDescription,
          inLanguage: params.lang,
          image: d.image ?? undefined,
          datePublished: d.publishedAt ?? undefined,
          mainEntityOfPage: url,
          author: { "@type": "Person", name: "Jalal Nasser" },
        }),
      }],
    };
  },
  component: LangPost,
});

function LangPost() {
  const d = Route.useLoaderData();
  const dir = d.lang === "ar" ? "rtl" : "ltr";
  return (
    <main className="mx-auto max-w-3xl px-4 lg:px-6 py-10" dir={dir}>
      <Link to="/$lang/blog" params={{ lang: d.lang }} className="text-sm text-muted-foreground hover:text-foreground">
        {BACK_LABEL[d.lang] ?? "← Back"}
      </Link>
      <h1 className="mt-4 text-4xl font-bold text-white leading-tight">{d.title}</h1>
      {d.excerpt && <p className="mt-3 text-lg text-muted-foreground">{d.excerpt}</p>}
      {d.image && (
        <img src={d.image} alt={d.title} className="mt-6 w-full rounded-lg" />
      )}
      {d.translated && d.translationStatus === "auto" && (
        <div className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
          {AUTO_NOTE[d.lang]}
        </div>
      )}
      <article
        className="prose prose-invert mt-8 max-w-none prose-headings:text-white prose-a:text-brand"
        dangerouslySetInnerHTML={{ __html: d.content }}
      />
    </main>
  );
}
