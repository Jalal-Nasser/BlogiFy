import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { firecrawlSearchEN, firecrawlScrapeEN } from "@/lib/firecrawl.functions";
import { Loader2, Globe, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Research" }] }),
  component: ResearchPage,
});

function ResearchPage() {
  const [query, setQuery] = useState("");
  const [url, setUrl] = useState("");

  const searchMut = useMutation({
    mutationFn: (q: string) => firecrawlSearchEN({ data: { query: q, limit: 10 } }),
    onError: (e: any) => toast.error(e?.message ?? "Search failed"),
  });
  const scrapeMut = useMutation({
    mutationFn: (u: string) => firecrawlScrapeEN({ data: { url: u } }),
    onError: (e: any) => toast.error(e?.message ?? "Scrape failed"),
  });

  return (
    <AdminShell title="Research (English-only)">
      <div className="space-y-8">
        <section className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Web Search</h2>
            <span className="text-xs text-slate-500">rotates US · GB · CA · AU · IE · NZ</span>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (query.trim()) searchMut.mutate(query.trim()); }}
            className="flex gap-2"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. self-hosted mail server hardening 2026"
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={searchMut.isPending}
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
            >
              {searchMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Search
            </button>
          </form>
          {searchMut.data && (
            <div className="mt-4">
              <div className="text-xs text-slate-500 mb-2">
                {searchMut.data.kept.length} kept · {searchMut.data.dropped} non-English dropped · geo: {searchMut.data.country}
              </div>
              <ul className="space-y-3">
                {searchMut.data.kept.map((r: any) => (
                  <li key={r.url} className="border border-slate-200 rounded-md p-3">
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-700 hover:underline">
                      {r.title || r.url}
                    </a>
                    <div className="text-xs text-slate-500 truncate">{r.url}</div>
                    {r.description && <p className="mt-1 text-sm text-slate-700">{r.description}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Scrape URL</h2>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (url.trim()) scrapeMut.mutate(url.trim()); }}
            className="flex gap-2"
          >
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={scrapeMut.isPending}
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
            >
              {scrapeMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Scrape
            </button>
          </form>
          {scrapeMut.data && (
            <div className="mt-4">
              <div className="text-xs text-slate-500 mb-2">
                geo: {scrapeMut.data.country} · language: {scrapeMut.data.language ?? "unknown"} · {scrapeMut.data.english ? "kept" : "dropped (non-English)"}
              </div>
              {scrapeMut.data.english ? (
                <>
                  {scrapeMut.data.summary && (
                    <div className="mb-3 rounded-md bg-blue-50 border border-blue-100 p-3 text-sm text-blue-900">
                      {scrapeMut.data.summary}
                    </div>
                  )}
                  <pre className="whitespace-pre-wrap max-h-96 overflow-auto text-xs bg-slate-50 border border-slate-200 rounded-md p-3">
                    {scrapeMut.data.markdown.slice(0, 8000)}
                  </pre>
                </>
              ) : (
                <div className="text-sm text-slate-500">Result was discarded because the page is not in English.</div>
              )}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
