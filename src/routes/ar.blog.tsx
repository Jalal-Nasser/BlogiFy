import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

const CANONICAL = "https://jalalnasser.com/ar/blog";
const TITLE = "مقالات عربية عن الذكاء الاصطناعي والنماذج اللغوية الكبيرة";
const DESCRIPTION =
  "تصفح مقالات تقنية حول الذكاء الاصطناعي، النماذج اللغوية الكبيرة، هندسة الأوامر، وتطبيقات الذكاء الاصطناعي في تطوير البرمجيات والأعمال.";

// Curated Arabic summaries for the 3 latest AI/LLM articles.
// Full Arabic translations will follow in later phases.
const FEATURED: Array<{ slug: string; summary: string }> = [
  {
    slug: "how-large-language-models-are-changing-modern-software-development",
    summary:
      "كيف تُغيّر النماذج اللغوية الكبيرة طريقة كتابة البرمجيات: توليد الكود، مراجعة الطلبات، التوثيق التلقائي، وأثرها على تدفق عمل المطوّر.",
  },
  {
    slug: "the-future-of-ai-agents-in-everyday-business-workflows",
    summary:
      "وكلاء الذكاء الاصطناعي في بيئة العمل: كيف تنتقل الشركات من الأتمتة البسيطة إلى وكلاء مستقلين ينفّذون مهام متعددة الخطوات.",
  },
  {
    slug: "prompt-engineering-best-practices-for-better-ai-results",
    summary:
      "أفضل ممارسات هندسة الأوامر للحصول على نتائج دقيقة من النماذج اللغوية: بنية الأمر، السياق، القيود، وأمثلة تطبيقية.",
  },
];

async function fetchFeatured() {
  const slugs = FEATURED.map((f) => f.slug);
  const { data, error } = await supabase
    .from("posts")
    .select("slug,title,read_time_minutes,published_at")
    .in("slug", slugs)
    .eq("status", "published");
  if (error) throw error;
  const bySlug = new Map((data ?? []).map((p) => [p.slug, p]));
  return FEATURED.map((f) => ({ ...f, post: bySlug.get(f.slug) ?? null }));
}

export const Route = createFileRoute("/ar/blog")({
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
  const { data, isLoading } = useQuery({
    queryKey: ["ar-featured-posts"],
    queryFn: fetchFeatured,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 lg:py-24">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-brand">المقالات</p>
      <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
        مقالات عن الذكاء الاصطناعي وتطوير البرمجيات
      </h1>
      <p className="mt-6 text-base leading-relaxed text-muted-foreground">
        هذه قائمة بأحدث المقالات المنشورة على المدونة. حالياً المحتوى الكامل متوفر باللغة الإنجليزية،
        وسيتم إضافة النسخ العربية الكاملة تدريجياً في المراحل القادمة. في الأسفل تجد ملخصاً عربياً
        قصيراً لكل مقال مع رابط للمقال الأصلي.
      </p>

      <div className="mt-4 rounded-md border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-brand-foreground/90">
        ملاحظة: النسخ العربية الكاملة للمقالات ستُضاف في مرحلة لاحقة. الروابط التالية تفتح
        المقال الأصلي باللغة الإنجليزية.
      </div>

      <ul className="mt-10 space-y-5">
        {isLoading && (
          <li className="rounded-lg border border-border bg-surface/40 p-6 text-sm text-muted-foreground">
            جارٍ تحميل المقالات…
          </li>
        )}
        {data?.map(({ slug, summary, post }) => (
          <li
            key={slug}
            className="rounded-lg border border-border bg-surface/40 p-6 transition-colors hover:border-brand/50"
          >
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded bg-brand/10 px-2 py-0.5 font-mono uppercase tracking-wider text-brand">
                EN
              </span>
              {post?.read_time_minutes ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  {post.read_time_minutes} دقيقة قراءة
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 font-display text-lg font-semibold" dir="ltr">
              {post?.title ?? slug}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{summary}</p>
            <Link
              to="/blog/$slug"
              params={{ slug }}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              اقرأ المقال الأصلي
              <ExternalLink className="size-3.5" />
            </Link>
          </li>
        ))}
      </ul>

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
          <ArrowLeft className="size-4 rotate-180" />
          English homepage
        </Link>
      </div>
    </div>
  );
}
