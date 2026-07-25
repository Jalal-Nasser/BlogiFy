import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listPublishedTranslated } from "@/lib/translations.functions";

const SITE_BASE = "https://jalalnasser.com";

const T: Record<string, { h1: string; sub: string; read: string }> = {
  ko: { h1: "블로그", sub: "모든 기사", read: "자세히 보기 →" },
  fr: { h1: "Blog", sub: "Tous les articles", read: "Lire la suite →" },
  ar: { h1: "المدونة", sub: "جميع المقالات", read: "اقرأ المزيد ←" },
};

function options(lang: string) {
  return queryOptions({
    queryKey: ["lang-blog-index", lang],
    queryFn: () => listPublishedTranslated({ data: { lang: lang as any, limit: 60 } }),
  });
}

export const Route = createFileRoute("/$lang/blog/")({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(options(params.lang)),
  head: ({ params }) => {
    const t = T[params.lang];
    const url = `${SITE_BASE}/${params.lang}/blog`;
    return {
      meta: [
        { title: `${t.h1} — BlogiFy` },
        { name: "description", content: t.sub },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: LangBlogIndex,
});

function LangBlogIndex() {
  const { lang } = Route.useParams();
  const { data } = useSuspenseQuery(options(lang));
  const t = T[lang];
  return (
    <main className="mx-auto max-w-7xl px-4 lg:px-6 py-10">
      <h1 className="text-4xl font-bold text-white">{t.h1}</h1>
      <p className="mt-1 text-muted-foreground">{t.sub}</p>
      <ul className="mt-8 space-y-6">
        {data.map((p) => (
          <li key={p.id} className="border-b border-border/40 pb-6">
            <h2 className="text-xl font-semibold text-white">
              <Link to="/$lang/blog/$slug" params={{ lang, slug: p.slug }} className="hover:text-brand">
                {p.title}
              </Link>
            </h2>
            {p.excerpt && <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>}
            <Link to="/$lang/blog/$slug" params={{ lang, slug: p.slug }} className="mt-2 inline-block text-sm text-brand">
              {t.read}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
