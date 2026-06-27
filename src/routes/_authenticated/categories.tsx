import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell, StatusBadge } from "@/components/admin/AdminShell";
import { listCategories, saveCategory, archiveCategory, listPosts } from "@/lib/cms.functions";
import { slugify } from "@/lib/slug";
import { Plus, Edit, Archive, X, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/categories")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Categories" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const qc = useQueryClient();
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const posts = useQuery({ queryKey: ["posts"], queryFn: () => listPosts() });
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const counts = new Map<string, number>();
  (posts.data ?? []).forEach((p: any) => { if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1); });

  const saveMut = useMutation({
    mutationFn: (data: any) => saveCategory({ data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast.success("Saved"); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const archiveMut = useMutation({
    mutationFn: (id: string) => archiveCategory({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast.success("Archived"); },
    onError: (e: any) => toast.error(e.message),
  });

  function openNew() { setEditing({ name: "", slug: "", description: "", status: "Active" }); setOpen(true); }
  function openEdit(c: any) { setEditing({ ...c }); setOpen(true); }

  return (
    <AdminShell title="Categories">
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-3 border-b border-slate-200 flex justify-end">
          <button onClick={openNew} className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Category
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr><th className="text-left px-4 py-2.5 font-medium">Name</th><th className="text-left px-4 py-2.5 font-medium">Slug</th><th className="text-left px-4 py-2.5 font-medium">Description</th><th className="text-left px-4 py-2.5 font-medium">Posts</th><th className="text-left px-4 py-2.5 font-medium">Status</th><th className="text-left px-4 py-2.5 font-medium">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cats.isLoading ? <tr><td colSpan={6} className="px-4 py-6 text-slate-500">Loading…</td></tr>
            : (cats.data ?? []).length === 0 ? <tr><td colSpan={6} className="px-4 py-6 text-slate-500">No categories. Add one.</td></tr>
            : (cats.data ?? []).map((c: any) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-2.5 text-slate-600 truncate max-w-xs">{c.description ?? "—"}</td>
                <td className="px-4 py-2.5">{counts.get(c.id) ?? 0}</td>
                <td className="px-4 py-2.5"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="text-slate-600 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => { if (confirm("Archive this category?")) archiveMut.mutate(c.id); }} className="text-slate-600 hover:text-red-600"><Archive className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && editing && (
        <Modal title={editing.id ? "Edit Category" : "Add Category"} onClose={() => setOpen(false)}>
          <Field label="Name"><input className={inp} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} /></Field>
          <Field label="Slug"><input className={inp} value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
          <Field label="Description"><textarea rows={3} className={inp} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
          <Field label="Status">
            <select className={inp} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
              <option>Active</option><option>Archived</option>
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setOpen(false)} className="text-sm px-4 py-2 rounded-md border border-slate-300">Cancel</button>
            <button disabled={saveMut.isPending} onClick={() => saveMut.mutate(editing)} className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60">
              {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}

const inp = "w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium uppercase text-slate-500 mb-1.5">{label}</label>{children}</div>;
}
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}
