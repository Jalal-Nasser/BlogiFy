import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { listPosts, listCategories, listAuthors } from "@/lib/cms.functions";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/drafts")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Drafts" }] }),
  component: DraftsPage,
});

function DraftsPage() {
  const posts = useQuery({ queryKey: ["posts"], queryFn: () => listPosts() });
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const authors = useQuery({ queryKey: ["authors"], queryFn: () => listAuthors() });
  const catMap = new Map((cats.data ?? []).map((c: any) => [c.id, c.name]));
  const authMap = new Map((authors.data ?? []).map((a: any) => [a.id, a.name]));
  const list = (posts.data ?? []).filter((p: any) => p.status === "Draft" || p.status === "In review");

  const Ind = ({ ok }: { ok: boolean }) =>
    ok ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-500" />;

  return (
    <AdminShell title="Drafts">
      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>{["Title", "Author", "Category", "Updated", "SEO Title", "Meta", "Image", "Action"].map((h) => <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {posts.isLoading ? <tr><td colSpan={8} className="px-4 py-6 text-slate-500">Loading…</td></tr>
            : list.length === 0 ? <tr><td colSpan={8} className="px-4 py-6 text-slate-500">No drafts.</td></tr>
            : list.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium">{p.title}</td>
                <td className="px-4 py-2.5">{authMap.get(p.author_id) ?? "—"}</td>
                <td className="px-4 py-2.5">{catMap.get(p.category_id) ?? "—"}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-2.5"><Ind ok={!!p.seo_title} /></td>
                <td className="px-4 py-2.5"><Ind ok={!!p.meta_description} /></td>
                <td className="px-4 py-2.5"><Ind ok={!!p.featured_image_url} /></td>
                <td className="px-4 py-2.5"><Link to="/posts/$id/edit" params={{ id: p.id }} className="text-blue-600 hover:underline text-xs font-medium">Quick edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
