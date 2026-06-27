import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell, StatusBadge } from "@/components/admin/AdminShell";
import { listPosts, listCategories, listAuthors } from "@/lib/cms.functions";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/published")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Published" }] }),
  component: PublishedPage,
});

function PublishedPage() {
  const posts = useQuery({ queryKey: ["posts"], queryFn: () => listPosts() });
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const authors = useQuery({ queryKey: ["authors"], queryFn: () => listAuthors() });
  const catMap = new Map((cats.data ?? []).map((c: any) => [c.id, c.name]));
  const authMap = new Map((authors.data ?? []).map((a: any) => [a.id, a.name]));
  const list = (posts.data ?? []).filter((p: any) => p.status === "Published");

  return (
    <AdminShell title="Published">
      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr>{["Title", "Category", "Author", "Published", "Updated", "Featured", "View"].map((h) => <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {posts.isLoading ? <tr><td colSpan={7} className="px-4 py-6 text-slate-500">Loading…</td></tr>
            : list.length === 0 ? <tr><td colSpan={7} className="px-4 py-6 text-slate-500">No published posts.</td></tr>
            : list.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5"><Link to="/posts/$id/edit" params={{ id: p.id }} className="font-medium text-slate-900 hover:text-blue-600">{p.title}</Link></td>
                <td className="px-4 py-2.5">{catMap.get(p.category_id) ?? "—"}</td>
                <td className="px-4 py-2.5">{authMap.get(p.author_id) ?? "—"}</td>
                <td className="px-4 py-2.5 text-xs">{p.published_at ? new Date(p.published_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-2.5 text-xs">{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-2.5">{p.featured ? <StatusBadge status="Featured" /> : "—"}</td>
                <td className="px-4 py-2.5">
                  <a target="_blank" rel="noreferrer" href={p.canonical_url || `/blog/${p.slug}`} className="text-blue-600 hover:underline inline-flex items-center gap-1 text-xs"><ExternalLink className="h-3 w-3" /> view</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
