import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

function getVisitorId(): string {
  try {
    const key = "bf_visitor_id";
    let id = localStorage.getItem(key);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function PageViewTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    const run = async () => {
      try {
        const visitor_id = getVisitorId();
        let referrer: string | null = null;
        try {
          const r = document.referrer;
          if (r && !r.startsWith(window.location.origin)) referrer = r;
        } catch {}

        let post_id: string | null = null;
        const m = pathname.match(/^\/blog\/([^/]+)$/);
        if (m) {
          const { data } = await supabase
            .from("posts")
            .select("id")
            .eq("slug", m[1])
            .maybeSingle();
          post_id = data?.id ?? null;
        }

        await supabase.from("page_views").insert({
          path: pathname,
          post_id,
          visitor_id,
          referrer,
        });
      } catch {
        /* ignore */
      }
    };
    // Fire-and-forget; don't block render
    void run();
  }, [pathname]);

  return null;
}
