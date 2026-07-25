import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { useEffect } from "react";

const LANGS = new Set(["ko", "fr", "ar"]);

export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    if (!LANGS.has(params.lang)) throw notFound();
  },
  component: LangLayout,
});

function LangLayout() {
  const { lang } = Route.useParams();
  const dir = lang === "ar" ? "rtl" : "ltr";
  useEffect(() => {
    const html = document.documentElement;
    const prevLang = html.getAttribute("lang");
    const prevDir = html.getAttribute("dir");
    html.setAttribute("lang", lang);
    html.setAttribute("dir", dir);
    return () => {
      if (prevLang) html.setAttribute("lang", prevLang); else html.removeAttribute("lang");
      if (prevDir) html.setAttribute("dir", prevDir); else html.removeAttribute("dir");
    };
  }, [lang, dir]);
  return (
    <div dir={dir} lang={lang} className={lang === "ar" ? "font-arabic" : undefined}>
      <Outlet />
    </div>
  );
}
