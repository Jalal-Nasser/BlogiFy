import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Modal } from "./categories";
import { listPosts, listCategories, togglePostFeatured } from "@/lib/cms.functions";
import { Plus, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/featured")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Featured" }] }),
  component: FeaturedPage,
});

function FeaturedPage() {
  const qc = useQueryClient();
  const posts = useQuery({ queryKey: ["posts"], queryFn: () => listPosts() });
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const catMap = new Map((cats.data ?? []).map((c: any) => [c.id, c.name]));
  const [open, setOpen] = useState(false);

  const featured = (posts.data ?? []).filter((p: any) => p.featured);
  const candidates = (posts.data ?? []).filter((p: any) => p.status === "Published" && !p.featured);

  const mut = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => togglePostFeatured({ data: { id, featured } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["posts"] }); toast.success("Updated"); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AdminShell title="Featured">
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-3 border-b border-slate-200 flex justify-end">
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-700"><Plus className="h-4 w-4" /> Add to Featured</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr>{["Title", "Category", "Published", "Action"].map((h) => <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {posts.isLoading ? <tr><td colSpan={4} className="px-4 py-6 text-slate-500">Loading…</td></tr>
            : featured.length === 0 ? <tr><td colSpan={4} className="px-4 py-6 text-slate-500">No featured posts.</td></tr>
            : featured.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5"><Link to="/posts/$id/edit" params={{ id: p.id }} className="font-medium hover:text-blue-600">{p.title}</Link></td>
                <td className="px-4 py-2.5">{catMap.get(p.category_id) ?? "—"}</td>
                <td className="px-4 py-2.5 text-xs">{p.published_at ? new Date(p.published_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-2.5"><button onClick={() => mut.mutate({ id: p.id, featured: false })} className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-xs"><X className="h-3 w-3" /> Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <Modal title="Add to Featured" onClose={() => setOpen(false)}>
          {candidates.length === 0 ? <p className="text-sm text-slate-500">No published posts available.</p>
          : <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {candidates.map((p: any) => (
              <button key={p.id} disabled={mut.isPending} onClick={() => mut.mutate({ id: p.id, featured: true })} className="w-full text-left px-3 py-2.5 hover:bg-slate-50 text-sm">{p.title}</button>
            ))}
          </div>}
        </Modal>
      )}
    </AdminShell>
  );
}
