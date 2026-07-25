import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listPublishedTranslated } from "@/lib/translations.functions";

const SITE_BASE = "https://jalalnasser.com";

const LANG_LABELS: Record<string, { title: string; subtitle: string; readMore: string }> = {
  ko: { title: "최신 기사", subtitle: "Linux, 보안, AI 및 자체 호스팅에 관한 심층 가이드.", readMore: "자세히 보기 →" },
  fr: { title: "Derniers articles", subtitle: "Guides pratiques sur Linux, la sécurité, l'IA et l'auto-hébergement.", readMore: "Lire la suite →" },
  ar: { title: "أحدث المقالات", subtitle: "أدلة عملية حول لينكس والأمن والذكاء الاصطناعي والاستضافة الذاتية.", readMore: "اقرأ المزيد ←" },
};

function optionsFor(lang: string) {
  return queryOptions({
    queryKey: ["lang-index", lang],
    queryFn: () => listPublishedTranslated({ data: { lang: lang as any, limit: 24 } }),
  });
}

export const Route = createFileRoute("/$lang/")({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(optionsFor(params.lang)),
  head: ({ params }) => {
    const t = LANG_LABELS[params.lang];
    const url = `${SITE_BASE}/${params.lang}`;
    return {
      meta: [
        { title: `${t.title} — BlogiFy` },
        { name: "description", content: t.subtitle },
        { property: "og:title", content: `${t.title} — BlogiFy` },
        { property: "og:description", content: t.subtitle },
        { property: "og:url", content: url },
        { property: "og:locale", content: params.lang === "ar" ? "ar_AR" : params.lang === "ko" ? "ko_KR" : "fr_FR" },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "en", href: `${SITE_BASE}/` },
        { rel: "alternate", hrefLang: "ko", href: `${SITE_BASE}/ko` },
        { rel: "alternate", hrefLang: "fr", href: `${SITE_BASE}/fr` },
        { rel: "alternate", hrefLang: "ar", href: `${SITE_BASE}/ar` },
        { rel: "alternate", hrefLang: "x-default", href: `${SITE_BASE}/` },
      ],
    };
  },
  component: LangHome,
});

function LangHome() {
  const { lang } = Route.useParams();
  const { data } = useSuspenseQuery(optionsFor(lang));
  const t = LANG_LABELS[lang];
  return (
    <main className="mx-auto max-w-7xl px-4 lg:px-6 py-10">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white">{t.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.subtitle}</p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((p) => (
          <article key={p.id} className="rounded-lg border border-border/50 bg-surface/30 overflow-hidden">
            {p.featured_image_url && (
              <img src={p.featured_image_url} alt="" className="w-full h-40 object-cover" loading="lazy" />
            )}
            <div className="p-4">
              <h2 className="text-lg font-semibold text-white line-clamp-2">
                <Link to="/$lang/blog/$slug" params={{ lang, slug: p.slug }} className="hover:text-brand">
                  {p.title}
                </Link>
              </h2>
              {p.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>}
              <Link to="/$lang/blog/$slug" params={{ lang, slug: p.slug }} className="mt-3 inline-block text-sm text-brand">
                {t.readMore}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
