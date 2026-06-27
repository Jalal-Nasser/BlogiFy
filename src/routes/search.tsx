import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useState } from "react";
import { Search } from "lucide-react";
import { searchPosts } from "@/lib/queries";
import { PostCard } from "@/components/site/PostCard";

const schema = z.object({ q: fallback(z.string(), "").default("") });

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(schema),
  head: () => ({
    meta: [
      { title: "Search — BlogiFy" },
      { name: "description", content: "Search BlogiFy tutorials on Linux, cybersecurity, WordPress, crypto, and more." },
      { property: "og:title", content: "Search BlogiFy" },
      { property: "og:description", content: "Find tutorials and articles across Linux, security, WordPress, crypto, and digital marketing." },
      { property: "og:url", content: "https://jalalnasser.com/search" },
      { name: "twitter:title", content: "Search BlogiFy" },
      { name: "twitter:description", content: "Find tutorials and articles across all BlogiFy topics." },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "https://jalalnasser.com/search" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [input, setInput] = useState(q);
  const { data: results = [], isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchPosts(q),
    enabled: q.length > 0,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 lg:px-6 pt-10">
      <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight">Search</h1>
      <form
        className="mt-6 relative"
        onSubmit={(e) => { e.preventDefault(); navigate({ search: { q: input.trim() } }); }}
      >
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search articles, tutorials, topics…"
          className="w-full rounded-full border border-border bg-input/60 py-4 pl-12 pr-4 text-base outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </form>

      <div className="mt-8">
        {q && <p className="text-sm text-muted-foreground mb-4">
          {isLoading ? "Searching…" : `${results.length} result${results.length === 1 ? "" : "s"} for "${q}"`}
        </p>}
        <div className="grid gap-6 sm:grid-cols-2">
          {results.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
        {!q && <p className="text-muted-foreground">Type a query above to search across the entire blog.</p>}
      </div>
    </div>
  );
}
