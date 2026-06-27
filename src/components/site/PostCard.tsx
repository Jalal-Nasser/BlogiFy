import { Link } from "@tanstack/react-router";
import { Clock, Eye } from "lucide-react";
import type { Post } from "@/lib/types";
import { CategoryBadge } from "./CategoryBadge";

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function PostCard({ post, variant = "default" }: { post: Post; variant?: "default" | "featured" | "compact" }) {
  if (variant === "compact") {
    return (
      <Link to="/blog/$slug" params={{ slug: post.slug }} className="group flex gap-3">
        {post.featured_image_url && (
          <img src={post.featured_image_url} alt="" className="size-16 shrink-0 rounded-md object-cover" loading="lazy" />
        )}
        <div className="min-w-0">
          <h4 className="text-sm font-medium leading-snug group-hover:text-brand transition-colors line-clamp-2">{post.title}</h4>
          <p className="mt-1 text-xs text-muted-foreground">{fmtDate(post.published_at)}</p>
        </div>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link to="/blog/$slug" params={{ slug: post.slug }} className="group relative block overflow-hidden rounded-2xl border border-border surface-card">
        <div className="relative aspect-[16/10] overflow-hidden">
          {post.featured_image_url && (
            <img src={post.featured_image_url} alt={post.title} className="size-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
            {post.categories && <CategoryBadge category={post.categories} asLink={false} />}
            <h2 className="mt-3 font-display text-2xl lg:text-3xl font-bold tracking-tight leading-tight group-hover:text-brand transition-colors">
              {post.title}
            </h2>
            {post.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-2 max-w-2xl">{post.excerpt}</p>}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span>{fmtDate(post.published_at)}</span>
              <span className="flex items-center gap-1"><Clock className="size-3" /> {post.read_time_minutes} min</span>
              <span className="flex items-center gap-1"><Eye className="size-3" /> {post.views.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to="/blog/$slug" params={{ slug: post.slug }} className="group flex flex-col overflow-hidden rounded-xl border border-border surface-card transition-all hover:border-brand/40 hover:-translate-y-0.5">
      {post.featured_image_url && (
        <div className="aspect-[16/9] overflow-hidden">
          <img src={post.featured_image_url} alt={post.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {post.categories && <CategoryBadge category={post.categories} asLink={false} />}
        <h3 className="font-display text-lg font-semibold leading-snug tracking-tight group-hover:text-brand transition-colors line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
        <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground pt-2">
          <span>{fmtDate(post.published_at)}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Clock className="size-3" /> {post.read_time_minutes} min</span>
        </div>
      </div>
    </Link>
  );
}
