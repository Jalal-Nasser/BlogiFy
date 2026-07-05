import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

function ArabicLayout() {
  useEffect(() => {
    const html = document.documentElement;
    const prevDir = html.getAttribute("dir");
    const prevLang = html.getAttribute("lang");
    html.setAttribute("dir", "rtl");
    html.setAttribute("lang", "ar");
    return () => {
      if (prevDir) html.setAttribute("dir", prevDir); else html.removeAttribute("dir");
      html.setAttribute("lang", prevLang ?? "en");
    };
  }, []);

  return (
    <div dir="rtl" lang="ar" className="font-arabic text-right">
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/ar")({
  component: ArabicLayout,
});
