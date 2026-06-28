import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchPosts } from "@/lib/queries";
import { Newsletter } from "./Newsletter";
import { PostCard } from "./PostCard";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { DonationWidget } from "./DonationWidget";
import { PphHireWidget } from "./PphHireWidget";

export function Sidebar() {
  const { data: recent = [] } = useQuery({ queryKey: ["posts", "recent"], queryFn: () => fetchPosts(8) });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const parents = categories.filter((c) => !c.parent_slug).slice(0, 12);

  return (
    <aside className="space-y-8">
      <Newsletter />

      <div className="surface-card p-6">
        <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">Recent Posts</h3>
        <div className="mt-4 space-y-4">
          {recent.slice(0, 8).map((p) => <PostCard key={p.id} post={p} variant="compact" />)}
        </div>
      </div>

      <div className="surface-card p-6">
        <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">Categories</h3>
        <div className="mt-4 flex flex-col divide-y divide-border/40">
          {parents.map((c) => (
            <Link
              key={c.id}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="group flex items-center gap-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}` }}
              />
              <span className="flex-1 truncate">{c.name}</span>
              <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-brand transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      <DonationWidget />

      <PphHireWidget />



    </aside>
  );
}
