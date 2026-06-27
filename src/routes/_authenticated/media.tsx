import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Modal } from "./categories";
import { listMedia, saveMedia, deleteMedia, listPosts } from "@/lib/cms.functions";
import { Plus, Edit, Trash2, ExternalLink, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/media")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Media" }] }),
  component: MediaPage,
});
const inp = "w-full border border-slate-300 rounded-md px-3 py-2 text-sm";

function MediaPage() {
  const qc = useQueryClient();
  const media = useQuery({ queryKey: ["media"], queryFn: () => listMedia() });
  const posts = useQuery({ queryKey: ["posts"], queryFn: () => listPosts() });
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const postMap = new Map((posts.data ?? []).map((p: any) => [p.id, p.title]));

  const saveMut = useMutation({
    mutationFn: (d: any) => saveMedia({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["media"] }); toast.success("Saved"); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteMedia({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["media"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AdminShell title="Media">
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-3 border-b border-slate-200 flex justify-end">
          <button onClick={() => { setEditing({ title: "", alt_text: "", file_url: "", file_type: "", post_id: "" }); setOpen(true); }} className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-700"><Plus className="h-4 w-4" /> Add Media</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr>{["Thumb", "Title", "Alt", "URL", "Linked Post", "Uploaded", ""].map((h, i) => <th key={i} className="text-left px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {media.isLoading ? <tr><td colSpan={7} className="px-4 py-6 text-slate-500">Loading…</td></tr>
            : (media.data ?? []).length === 0 ? <tr><td colSpan={7} className="px-4 py-6 text-slate-500">No media. Add an asset.</td></tr>
            : (media.data ?? []).map((m: any) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5"><img src={m.file_url} alt={m.alt_text ?? ""} className="h-10 w-10 object-cover rounded border border-slate-200" /></td>
                <td className="px-4 py-2.5 font-medium">{m.title ?? "—"}</td>
                <td className="px-4 py-2.5 text-slate-600">{m.alt_text ?? "—"}</td>
                <td className="px-4 py-2.5"><a href={m.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 text-xs"><ExternalLink className="h-3 w-3" /> open</a></td>
                <td className="px-4 py-2.5 text-slate-600 truncate max-w-[150px]">{m.post_id ? postMap.get(m.post_id) ?? "—" : "—"}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{new Date(m.uploaded_at).toLocaleDateString()}</td>
                <td className="px-4 py-2.5"><div className="flex gap-2">
                  <button onClick={() => { setEditing({ ...m }); setOpen(true); }} className="text-slate-600 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => { if (confirm("Delete this media asset?")) delMut.mutate(m.id); }} className="text-slate-600 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && editing && (
        <Modal title={editing.id ? "Edit Media" : "Add Media"} onClose={() => setOpen(false)}>
          <F label="Title"><input className={inp} value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></F>
          <F label="Alt Text"><input className={inp} value={editing.alt_text ?? ""} onChange={(e) => setEditing({ ...editing, alt_text: e.target.value })} /></F>
          <F label="File URL"><input className={inp} value={editing.file_url} onChange={(e) => setEditing({ ...editing, file_url: e.target.value })} /></F>
          <F label="File Type"><input className={inp} placeholder="image/png" value={editing.file_type ?? ""} onChange={(e) => setEditing({ ...editing, file_type: e.target.value })} /></F>
          <F label="Linked Post">
            <select className={inp} value={editing.post_id ?? ""} onChange={(e) => setEditing({ ...editing, post_id: e.target.value })}>
              <option value="">— none —</option>
              {(posts.data ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </F>
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="text-sm px-4 py-2 rounded-md border border-slate-300">Cancel</button>
            <button disabled={saveMut.isPending} onClick={() => {
              const p = { ...editing };
              if (!p.post_id) p.post_id = null;
              if (!p.title) p.title = null;
              if (!p.alt_text) p.alt_text = null;
              if (!p.file_type) p.file_type = null;
              saveMut.mutate(p);
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
