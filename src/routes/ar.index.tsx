import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen } from "lucide-react";

const CANONICAL = "https://jalalnasser.com/ar";
const TITLE = "المدونة العربية | الذكاء الاصطناعي وتطوير البرمجيات";
const DESCRIPTION =
  "مدونة عربية متخصصة في الذكاء الاصطناعي، النماذج اللغوية الكبيرة، تطوير البرمجيات، أتمتة الأعمال، وهندسة الأوامر.";

export const Route = createFileRoute("/ar/")({
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
  component: ArabicHome,
});

const TOPICS = [
  "الذكاء الاصطناعي",
  "النماذج اللغوية الكبيرة",
  "تطوير البرمجيات",
  "أتمتة الأعمال",
  "هندسة الأوامر",
];

function ArabicHome() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 lg:py-24">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-brand">النسخة العربية</p>
      <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
        <span className="text-gradient">بلوجيفاي</span> — تقنية بالعربية
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        مساحة شخصية أشارك فيها ما أتعلمه وأبنيه في عالم التقنية الحديثة: من الذكاء الاصطناعي
        والنماذج اللغوية الكبيرة، إلى تطوير البرمجيات، وأتمتة الأعمال، وهندسة الأوامر.
        هدفي هو تقريب هذه المفاهيم للقارئ العربي بأسلوب عملي ومباشر.
      </p>

      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold">المواضيع الرئيسية</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <li
              key={t}
              className="rounded-full border border-border bg-surface/60 px-3 py-1 text-sm text-foreground"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          to="/ar/blog"
          className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90"
        >
          <BookOpen className="size-4" />
          تصفح المقالات
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
