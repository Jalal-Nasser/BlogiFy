import { Link } from "@tanstack/react-router";
import type { Category } from "@/lib/types";

export function CategoryBadge({ category, asLink = true }: { category: Pick<Category, "name" | "slug" | "color">; asLink?: boolean }) {
  const style = {
    backgroundColor: `${category.color}22`,
    color: category.color,
    borderColor: `${category.color}55`,
  };
  const content = (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em]"
      style={style}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: category.color, boxShadow: `0 0 8px ${category.color}` }} />
      {category.name}
    </span>
  );
  if (!asLink) return content;
  return (
    <Link to="/category/$slug" params={{ slug: category.slug }} className="hover:opacity-80 transition-opacity">
      {content}
    </Link>
  );
}
