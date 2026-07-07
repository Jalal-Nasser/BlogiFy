import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, ExternalLink } from "lucide-react";
import { ARABIC_ARTICLES } from "@/lib/arabic-articles";

const CANONICAL = "https://jalalnasser.com/ar/blog";
const TITLE = "مقالات عربية عن الذكاء الاصطناعي والنماذج اللغوية الكبيرة";
const DESCRIPTION =
  "تصفح مقالات تقنية بالعربية حول الذكاء الاصطناعي، النماذج اللغوية الكبيرة، هندسة الأوامر، وتطبيقات الذكاء الاصطناعي في تطوير البرمجيات وأتمتة الأعمال.";

export const Route = createFileRoute("/ar/blog/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
      { property: "og:locale", content: "ar_AR" },
      { property: "og:locale:alternate", content: "en_US" },
    ],
    links: [
      { rel: "canonical", href: CANONICAL },
      { rel: "alternate", hrefLang: "ar", href: CANONICAL },
      { rel: "alternate", hrefLang: "en", href: "https://jalalnasser.com/" },
      { rel: "alternate", hrefLang: "x-default", href: "https://jalalnasser.com/" },
    ],
  }),
  component: ArabicBlog,
});

function ArabicBlog() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 lg:py-24">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-brand">المقالات</p>
      <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
        مقالات عن الذكاء الاصطناعي وتطوير البرمجيات
      </h1>
      <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
        مجموعة مقالات مترجمة إلى العربية بلغة احترافية ومباشرة. كل مقال يعرض المفاهيم بأمثلة
        عملية وقسم أسئلة شائعة. النسخة الإنجليزية الأصلية متاحة لكل مقال عبر رابط في الأعلى.
      </p>
      <div className="mt-6 max-w-3xl rounded-md border border-brand/30 bg-brand/5 p-4 text-sm leading-relaxed text-foreground/90">
        <strong>ملاحظة:</strong> نضيف ترجمات عربية جديدة تدريجياً. تظهر هنا حالياً {" "}
        <span className="font-mono">{ARABIC_ARTICLES.length}</span> مقالاً من أصل ٤٩ مقالاً منشوراً
        باللغة الإنجليزية، وسيصلها المزيد قريباً.
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {ARABIC_ARTICLES.map((a) => (
          <article
            key={a.slug}
            className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface/40 transition-colors hover:border-brand/50"
          >
            <Link
              to="/ar/blog/$slug"
              params={{ slug: a.slug }}
              className="block overflow-hidden"
            >
              <img
                src={a.image}
                alt={a.imageAlt}
                className="aspect-[16/9] w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            </Link>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded bg-brand/10 px-2 py-0.5 font-mono uppercase tracking-wider text-brand">
                  {a.category}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  {a.readTime} دقائق قراءة
                </span>
              </div>
              <h2 className="mt-3 font-display text-lg font-semibold leading-snug">
                <Link
                  to="/ar/blog/$slug"
                  params={{ slug: a.slug }}
                  className="hover:text-brand"
                >
                  {a.title}
                </Link>
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {a.excerpt}
              </p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <Link
                  to="/ar/blog/$slug"
                  params={{ slug: a.slug }}
                  className="font-medium text-brand hover:underline"
                >
                  اقرأ المقال ←
                </Link>
                <a
                  href={`/blog/${a.slug}`}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  dir="ltr"
                >
                  English <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          to="/ar"
          className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface"
        >
          الصفحة الرئيسية بالعربية
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface"
        >
          English homepage
        </Link>
      </div>
    </div>
  );
}
