import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPosts } from "@/lib/queries";
import { PostCard } from "@/components/site/PostCard";
import { Sidebar } from "@/components/site/Sidebar";
import { AdSlot } from "@/components/site/AdSlot";
import { Sparkles, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BlogiFy — IT, Security & Tech Tutorials" },
      { name: "description", content: "Hands-on tutorials and analysis on Linux, cybersecurity, WordPress, self-hosting, crypto, and digital marketing." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: posts = [], isLoading } = useQuery({ queryKey: ["posts", "home"], queryFn: () => fetchPosts(20) });

  const [hero, ...rest] = posts;
  const secondary = rest.slice(0, 2);
  const grid = rest.slice(2);

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-6">
      {/* Hero */}
      <section className="mb-6">
        <div className="flex items-center gap-2 text-brand">
          <Sparkles className="size-4" />
          <span className="font-mono text-xs uppercase tracking-widest">Latest from BlogiFy</span>
        </div>
        <h1 className="mt-3 font-display text-3xl lg:text-5xl font-bold tracking-tight leading-tight max-w-3xl">
          The IT publication for people who actually <span className="text-gradient">ship</span>.
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Practical guides on Linux, security, WordPress, self-hosting, crypto, and digital marketing — written by Jalal Nasser.
        </p>
      </section>

      {/* Featured */}
      {isLoading && <div className="h-96 animate-pulse rounded-2xl bg-surface" />}
      {hero && (
        <section className="grid gap-6 lg:grid-cols-3 mb-6">
          <div className="lg:col-span-2"><PostCard post={hero} variant="featured" /></div>
          <div className="grid gap-6 content-start">
            {secondary.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
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
          <div className="mt-8">
            <AdSlot size="leaderboard" label="Below-Grid Ad" />
          </div>
        </div>
        <Sidebar />
      </section>
    </div>
  );
}
