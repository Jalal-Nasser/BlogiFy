import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell, StatusBadge } from "@/components/admin/AdminShell";
import { Modal } from "./categories";
import { listAuthors, saveAuthor, deleteAuthor, listPosts } from "@/lib/cms.functions";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/authors")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Authors" }] }),
  component: AuthorsPage,
});

const inp = "w-full border border-slate-300 rounded-md px-3 py-2 text-sm";

function AuthorsPage() {
  const qc = useQueryClient();
  const authors = useQuery({ queryKey: ["authors"], queryFn: () => listAuthors() });
  const posts = useQuery({ queryKey: ["posts"], queryFn: () => listPosts() });
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const counts = new Map<string, number>();
  (posts.data ?? []).forEach((p: any) => { if (p.author_id) counts.set(p.author_id, (counts.get(p.author_id) ?? 0) + 1); });

  const saveMut = useMutation({
    mutationFn: (d: any) => saveAuthor({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["authors"] }); toast.success("Saved"); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteAuthor({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["authors"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AdminShell title="Authors">
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-3 border-b border-slate-200 flex justify-end">
          <button onClick={() => { setEditing({ name: "", email: "", bio: "", avatar_url: "", role: "Author", status: "Active" }); setOpen(true); }} className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-700"><Plus className="h-4 w-4" /> Add Author</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr>{["Name", "Email", "Role", "Posts", "Status", "Actions"].map((h) => <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {authors.isLoading ? <tr><td colSpan={6} className="px-4 py-6 text-slate-500">Loading…</td></tr>
            : (authors.data ?? []).length === 0 ? <tr><td colSpan={6} className="px-4 py-6 text-slate-500">No authors yet.</td></tr>
            : (authors.data ?? []).map((a: any) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium">{a.name}</td>
                <td className="px-4 py-2.5 text-slate-600">{a.email ?? "—"}</td>
                <td className="px-4 py-2.5">{a.role}</td>
                <td className="px-4 py-2.5">{counts.get(a.id) ?? 0}</td>
                <td className="px-4 py-2.5"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-2.5"><div className="flex gap-2">
                  <button onClick={() => { setEditing({ ...a }); setOpen(true); }} className="text-slate-600 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => { if (confirm("Delete author?")) delMut.mutate(a.id); }} className="text-slate-600 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && editing && (
        <Modal title={editing.id ? "Edit Author" : "Add Author"} onClose={() => setOpen(false)}>
          <F label="Name"><input className={inp} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></F>
          <F label="Email"><input className={inp} value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></F>
          <F label="Bio"><textarea rows={3} className={inp} value={editing.bio ?? ""} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} /></F>
          <F label="Avatar URL"><input className={inp} value={editing.avatar_url ?? ""} onChange={(e) => setEditing({ ...editing, avatar_url: e.target.value })} /></F>
          <F label="Role"><select className={inp} value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })}><option>Author</option><option>Editor</option><option>Admin</option></select></F>
          <F label="Status"><select className={inp} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}><option>Active</option><option>Inactive</option></select></F>
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="text-sm px-4 py-2 rounded-md border border-slate-300">Cancel</button>
            <button disabled={saveMut.isPending} onClick={() => {
              const payload = { ...editing };
              if (!payload.email) payload.email = null;
              saveMut.mutate(payload);
            }} className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60">
              {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium uppercase text-slate-500 mb-1.5">{label}</label>{children}</div>;
}
