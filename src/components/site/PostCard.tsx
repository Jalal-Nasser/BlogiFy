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
          <img src={post.featured_image_url} alt={post.title} className="size-16 shrink-0 rounded-md object-cover" loading="lazy" />
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
          {post.featured_image_url ? (
            <img src={post.featured_image_url} alt={post.title} className="size-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="size-full bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950" />
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
    <Link to="/blog/$slug" params={{ slug: post.slug }} className="cursor-pointer group relative flex flex-col overflow-hidden rounded-xl border border-border surface-card transition-all duration-300 hover:border-brand/60 hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgb(0_212_255/0.35),0_18px_50px_-18px_rgb(0_212_255/0.45)]">
      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "radial-gradient(600px circle at var(--mx,50%) 0%, rgb(139 92 246 / 0.08), transparent 40%)" }} />
      <div className="aspect-[16/9] overflow-hidden">
        {post.featured_image_url ? (
          <img src={post.featured_image_url} alt={post.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="size-full bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 flex items-center justify-center">
            <span className="font-display text-4xl font-black text-white/10 select-none uppercase tracking-widest">
              {post.title.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        {post.categories && <CategoryBadge category={post.categories} asLink={false} />}
        <Link to="/blog/$slug" params={{ slug: post.slug }} className="hover:text-brand transition-colors">
          <h3 className="font-display text-lg font-semibold leading-snug tracking-tight line-clamp-2">
            {post.title}
          </h3>
        </Link>
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
