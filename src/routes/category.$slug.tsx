import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchCategoryBySlug, fetchPostsByCategory } from "@/lib/queries";
import { PostCard } from "@/components/site/PostCard";
import { Sidebar } from "@/components/site/Sidebar";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data: category } = useQuery({ queryKey: ["category", slug], queryFn: () => fetchCategoryBySlug(slug) });
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["category-posts", slug],
    queryFn: () => fetchPostsByCategory(slug),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-10">
      <header className="mb-10">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Category</div>
        <h1 className="mt-2 font-display text-4xl lg:text-5xl font-bold tracking-tight" style={{ color: category?.color }}>
          {category?.name ?? slug}
        </h1>
        {category?.description && <p className="mt-3 text-muted-foreground max-w-2xl">{category.description}</p>}
        <div className="mt-4 text-sm text-muted-foreground">{posts.length} {posts.length === 1 ? "article" : "articles"}</div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          {isLoading && <div className="grid gap-6 sm:grid-cols-2"><div className="h-72 animate-pulse rounded-xl bg-surface" /><div className="h-72 animate-pulse rounded-xl bg-surface" /></div>}
          {!isLoading && posts.length === 0 && <p className="text-muted-foreground">No posts in this category yet.</p>}
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
