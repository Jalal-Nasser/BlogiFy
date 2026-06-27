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
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider"
      style={style}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: category.color }} />
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
