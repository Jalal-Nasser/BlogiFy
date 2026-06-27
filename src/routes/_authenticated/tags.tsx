import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Modal } from "./categories";
import { listTags, saveTag, deleteTag } from "@/lib/cms.functions";
import { slugify } from "@/lib/slug";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tags")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Tags" }] }),
  component: TagsPage,
});

function TagsPage() {
  const qc = useQueryClient();
  const tags = useQuery({ queryKey: ["tags"], queryFn: () => listTags() });
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const saveMut = useMutation({
    mutationFn: (data: any) => saveTag({ data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tags"] }); toast.success("Saved"); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteTag({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tags"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AdminShell title="Tags">
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-3 border-b border-slate-200 flex justify-end">
          <button onClick={() => { setEditing({ name: "", slug: "" }); setOpen(true); }} className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-700"><Plus className="h-4 w-4" /> Add Tag</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr><th className="text-left px-4 py-2.5 font-medium">Name</th><th className="text-left px-4 py-2.5 font-medium">Slug</th><th className="text-left px-4 py-2.5 font-medium">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {tags.isLoading ? <tr><td colSpan={3} className="px-4 py-6 text-slate-500">Loading…</td></tr>
            : (tags.data ?? []).length === 0 ? <tr><td colSpan={3} className="px-4 py-6 text-slate-500">No tags.</td></tr>
            : (tags.data ?? []).map((t: any) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium">{t.name}</td>
                <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">{t.slug}</td>
                <td className="px-4 py-2.5"><div className="flex gap-2">
                  <button onClick={() => { setEditing({ ...t }); setOpen(true); }} className="text-slate-600 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => { if (confirm("Delete this tag?")) delMut.mutate(t.id); }} className="text-slate-600 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && editing && (
        <Modal title={editing.id ? "Edit Tag" : "Add Tag"} onClose={() => setOpen(false)}>
          <div><label className="block text-xs font-medium uppercase text-slate-500 mb-1.5">Name</label>
            <input className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} /></div>
          <div><label className="block text-xs font-medium uppercase text-slate-500 mb-1.5">Slug</label>
            <input className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
          <div className="flex justify-end gap-2">
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
