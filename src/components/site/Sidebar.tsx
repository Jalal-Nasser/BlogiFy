import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchPosts } from "@/lib/queries";
import { Newsletter } from "./Newsletter";
import { PostCard } from "./PostCard";
import { Link } from "@tanstack/react-router";
import { AdSlot } from "./AdSlot";

export function Sidebar() {
  const { data: recent = [] } = useQuery({ queryKey: ["posts", "recent"], queryFn: () => fetchPosts(5) });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const parents = categories.filter((c) => !c.parent_slug).slice(0, 10);

  return (
    <aside className="space-y-8">
      <Newsletter />

      <div className="surface-card p-6">
        <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">Recent Posts</h3>
        <div className="mt-4 space-y-4">
          {recent.slice(0, 4).map((p) => <PostCard key={p.id} post={p} variant="compact" />)}
        </div>
      </div>

      <div className="surface-card p-6">
        <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">Categories</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {parents.map((c) => (
            <Link key={c.id} to="/category/$slug" params={{ slug: c.slug }}
              className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-brand hover:text-brand transition-colors"
              style={{ borderColor: `${c.color}40` }}>
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <AdSlot size="rectangle" label="Sidebar Ad" />
    </aside>
  );
}
