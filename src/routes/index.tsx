import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPosts } from "@/lib/queries";
import { PostCard } from "@/components/site/PostCard";
import { Sidebar } from "@/components/site/Sidebar";
import { Sparkles, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BlogiFy — IT, Security & Tech Tutorials" },
      { name: "description", content: "Hands-on tutorials and analysis on Linux, cybersecurity, WordPress, self-hosting, crypto, and digital marketing." },
      { property: "og:title", content: "BlogiFy — IT, Security & Tech Tutorials" },
      { property: "og:description", content: "Hands-on tutorials and analysis on Linux, cybersecurity, WordPress, self-hosting, crypto, and digital marketing." },
      { property: "og:url", content: "https://jalalnasser.com/" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/5a66d952-8ed6-481a-8519-01913766574e" },
      { name: "twitter:title", content: "BlogiFy — IT, Security & Tech Tutorials" },
      { name: "twitter:description", content: "Hands-on tutorials and analysis on Linux, cybersecurity, WordPress, self-hosting, crypto, and digital marketing." },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/5a66d952-8ed6-481a-8519-01913766574e" },
    ],
    links: [{ rel: "canonical", href: "https://jalalnasser.com/" }],
  }),
  component: Home,
});

function Home() {
  const { data: posts = [], isLoading } = useQuery({ queryKey: ["posts", "home"], queryFn: () => fetchPosts(20) });

  const [hero, ...rest] = posts;
  const secondary = rest.slice(0, 3);
  const grid = rest.slice(3);

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-6">
      {/* Hero intro */}
      <section className="mb-6">
        <div className="flex items-center gap-2 text-brand">
          <Sparkles className="size-4" />
          <span className="font-mono text-xs uppercase tracking-widest">Latest from BlogiFy</span>
        </div>
        <h1 className="mt-3 font-display text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight leading-none lg:whitespace-nowrap">
          The IT publication for people who actually <span className="text-gradient">ship</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Practical guides on Linux, security, WordPress, self-hosting, crypto, and digital marketing — written by Jalal Nasser.
        </p>
      </section>

      {/* Full-width featured hero */}
      {isLoading && <div className="h-96 animate-pulse rounded-2xl bg-surface mb-6" />}
      {hero && (
        <section className="mb-6">
          <PostCard post={hero} variant="featured" />
        </section>
      )}

      {/* 3-column secondary row — fills the gap, no height mismatch */}
      {secondary.length > 0 && (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          {secondary.map((p) => <PostCard key={p.id} post={p} />)}
        </section>
      )}

      <div className="border-b border-border/30" />

      {/* Grid + Sidebar */}
      <section className="mt-6 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="size-4 text-brand" />
            <h2 className="font-display text-xl font-semibold">More to read</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {grid.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </div>
        <Sidebar />
      </section>
    </div>
  );
}
