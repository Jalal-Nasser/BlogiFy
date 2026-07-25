import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";
const COUNTRIES = ["US", "GB", "CA", "AU", "IE", "NZ"] as const;
const ACCEPT_LANGUAGE = "en-US,en-GB,en;q=0.9";

function nextCountry(): (typeof COUNTRIES)[number] {
  return COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
}

// Lightweight English heuristic. No external deps.
// Trusts metadata.language when present; otherwise checks
// (a) share of ASCII/latin characters and (b) presence of very common English words.
const EN_STOPWORDS = new Set([
  "the","and","for","that","with","this","from","have","are","was","were","will","not","you","your","our","but","can","has","one","two","its","who","how","what","when","where","why","which","been","more","also","into","about","their","them","they","just","some","other","than","then","only","over","most","such","these","those","because","between","through","under","after","before","while","would","could","should",
]);

export function isEnglish(text: string, metadataLang?: string | null): boolean {
  if (metadataLang && /^en/i.test(metadataLang)) return true;
  if (!text) return false;
  const sample = text.replace(/<[^>]+>/g, " ").slice(0, 4000);
  if (sample.length < 40) return false;
  // ASCII ratio
  const ascii = sample.replace(/[^\x00-\x7F]/g, "").length;
  if (ascii / sample.length < 0.85) return false;
  // Common-word ratio
  const words = sample.toLowerCase().split(/[^a-z']+/).filter((w) => w.length > 2);
  if (words.length < 20) return false;
  let hits = 0;
  for (const w of words) if (EN_STOPWORDS.has(w)) hits++;
  return hits / words.length >= 0.03;
}

function requireKey() {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) throw new Error("FIRECRAWL_API_KEY is not configured");
  return key;
}

async function firecrawlFetch(path: string, body: unknown) {
  const key = requireKey();
  const res = await fetch(`${FIRECRAWL_V2}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "Accept-Language": ACCEPT_LANGUAGE,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firecrawl ${path} failed [${res.status}]: ${text.slice(0, 400)}`);
  }
  return res.json();
}

async function requireAdmin(context: any) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

export const firecrawlSearchEN = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      query: z.string().min(2).max(300),
      limit: z.number().int().min(1).max(20).default(10),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const country = nextCountry();
    const result = await firecrawlFetch("/search", {
      query: data.query,
      limit: data.limit,
      lang: "en",
      country: country.toLowerCase(),
      scrapeOptions: { formats: ["markdown"] },
      location: { country, languages: ["en"] },
    });
    const rows = (result?.data ?? result?.web ?? []) as any[];
    const kept: any[] = [];
    let dropped = 0;
    for (const r of rows) {
      const md = r.markdown || r.description || r.title || "";
      const lang = r?.metadata?.language;
      if (isEnglish(md, lang)) {
        kept.push({
          url: r.url,
          title: r.title ?? "",
          description: r.description ?? "",
          markdown: r.markdown ?? "",
          language: lang ?? "en",
        });
      } else {
        dropped++;
      }
    }
    return { kept, dropped, country };
  });

export const firecrawlScrapeEN = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ url: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const country = nextCountry();
    const result = await firecrawlFetch("/scrape", {
      url: data.url,
      formats: ["markdown", "summary"],
      onlyMainContent: true,
      location: { country, languages: ["en"] },
    });
    const payload = result?.data ?? result;
    const md: string = payload?.markdown ?? "";
    const lang = payload?.metadata?.language;
    const english = isEnglish(md, lang);
    return {
      country,
      english,
      dropped: english ? 0 : 1,
      title: payload?.metadata?.title ?? "",
      url: payload?.metadata?.sourceURL ?? data.url,
      language: lang ?? null,
      markdown: english ? md : "",
      summary: english ? (payload?.summary ?? "") : "",
    };
  });
