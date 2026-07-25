import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { AdminShell, StatusBadge } from "@/components/admin/AdminShell";
import { listPosts, listCategories, listAuthors, archivePost, togglePostFeatured, listUncategorizedWithSuggestions, bulkFixCategoriesAndTags } from "@/lib/cms.functions";
import { Plus, Edit, Archive, Star, StarOff, Search, Wrench, Loader2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/posts/")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Posts" }] }),
  component: PostsPage,
});

function PostsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const posts = useQuery({ queryKey: ["posts"], queryFn: () => listPosts() });
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const authors = useQuery({ queryKey: ["authors"], queryFn: () => listAuthors() });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [fixOpen, setFixOpen] = useState(false);

  const catMap = useMemo(() => new Map((cats.data ?? []).map((c: any) => [c.id, c.name])), [cats.data]);
  const authMap = useMemo(() => new Map((authors.data ?? []).map((a: any) => [a.id, a.name])), [authors.data]);

  const filtered = (posts.data ?? []).filter((p: any) => {
    if (q && !p.title?.toLowerCase().includes(q.toLowerCase())) return false;
    if (status && p.status !== status) return false;
    if (categoryId && p.category_id !== categoryId) return false;
    if (authorId && p.author_id !== authorId) return false;
    return true;
  });

  const archiveMut = useMutation({
    mutationFn: (id: string) => archivePost({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["posts"] }); toast.success("Archived"); },
    onError: (e: any) => toast.error(e.message),
  });
  const featMut = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => togglePostFeatured({ data: { id, featured } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AdminShell title="Posts">
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-3 border-b border-slate-200 flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md" placeholder="Search title…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="text-sm border border-slate-300 rounded-md px-2 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option>Draft</option><option>In review</option><option>Scheduled</option><option>Published</option><option>Archived</option>
          </select>
          <select className="text-sm border border-slate-300 rounded-md px-2 py-2" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {(cats.data ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="text-sm border border-slate-300 rounded-md px-2 py-2" value={authorId} onChange={(e) => setAuthorId(e.target.value)}>
            <option value="">All authors</option>
            {(authors.data ?? []).map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button onClick={() => setFixOpen(true)} className="ml-auto inline-flex items-center gap-1.5 border border-slate-300 text-slate-700 text-sm px-3 py-2 rounded-md hover:bg-slate-50">
            <Wrench className="h-4 w-4" /> Fix Missing Categories &amp; Tags
          </button>
          <button onClick={() => navigate({ to: "/posts/new" })} className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Post
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>Title</Th><Th>Category</Th><Th>Author</Th><Th>Status</Th><Th>Featured</Th><Th>Published</Th><Th>Updated</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.isLoading ? <tr><td colSpan={8} className="px-4 py-6 text-slate-500">Loading…</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="px-4 py-6 text-slate-500">No posts.</td></tr>
              : filtered.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <Td><Link to="/posts/$id/edit" params={{ id: p.id }} className="font-medium text-slate-900 hover:text-blue-600">{p.title}</Link></Td>
                  <Td>{catMap.get(p.category_id) ?? "—"}</Td>
                  <Td>{authMap.get(p.author_id) ?? "—"}</Td>
                  <Td><StatusBadge status={p.status} /></Td>
                  <Td>
                    <button onClick={() => featMut.mutate({ id: p.id, featured: !p.featured })} className="text-amber-500 hover:text-amber-600">
                      {p.featured ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                    </button>
                  </Td>
                  <Td>{p.published_at ? new Date(p.published_at).toLocaleDateString() : "—"}</Td>
                  <Td>{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Link to="/posts/$id/edit" params={{ id: p.id }} className="text-slate-600 hover:text-blue-600"><Edit className="h-4 w-4" /></Link>
                      <button onClick={() => { if (confirm("Archive this post?")) archiveMut.mutate(p.id); }} className="text-slate-600 hover:text-red-600"><Archive className="h-4 w-4" /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {fixOpen && <FixTaxonomyModal onClose={() => setFixOpen(false)} onDone={() => { qc.invalidateQueries({ queryKey: ["posts"] }); setFixOpen(false); }} />}
    </AdminShell>
  );
}

function FixTaxonomyModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const suggestions = useQuery({ queryKey: ["uncategorized-suggestions"], queryFn: () => listUncategorizedWithSuggestions() });
  const [selections, setSelections] = useState<Record<string, { category_id: string | null; tag_ids: string[] }>>({});

  useMemo(() => {
    if (!suggestions.data) return;
    const init: Record<string, any> = {};
    for (const s of suggestions.data as any[]) {
      init[s.id] = { category_id: s.suggested_category_id, tag_ids: s.suggested_tag_ids ?? [] };
    }
    setSelections(init);
  }, [suggestions.data]);

  const applyMut = useMutation({
    mutationFn: () => bulkFixCategoriesAndTags({
      data: { changes: Object.entries(selections).map(([id, v]) => ({ id, ...v })) },
    }),
    onSuccess: (r: any) => { toast.success(`Updated ${r.updated} posts`); onDone(); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleTag = (id: string, tagId: string) => {
    setSelections((s) => {
      const cur = s[id] ?? { category_id: null, tag_ids: [] };
      const has = cur.tag_ids.includes(tagId);
      return { ...s, [id]: { ...cur, tag_ids: has ? cur.tag_ids.filter((t) => t !== tagId) : [...cur.tag_ids, tagId] } };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h2 className="font-semibold">Review taxonomy fixes</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-3">
          {suggestions.isLoading && <div className="text-slate-500 text-sm">Analyzing posts…</div>}
          {!suggestions.isLoading && (suggestions.data ?? []).length === 0 && <div className="text-slate-500 text-sm">All posts have categories.</div>}
          {(suggestions.data ?? []).map((s: any) => (
            <div key={s.id} className="border border-slate-200 rounded-md p-3">
              <div className="font-medium text-sm text-slate-900">{s.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">Suggested category: <span className="font-medium text-slate-700">{s.suggested_category_name ?? "Uncategorized"}</span></div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(s.suggested_tag_ids ?? []).length === 0 && <span className="text-xs text-slate-400">No tag suggestions</span>}
                {s.suggested_tag_ids?.map((tid: string, i: number) => {
                  const active = selections[s.id]?.tag_ids?.includes(tid);
                  return (
                    <button key={tid} type="button" onClick={() => toggleTag(s.id, tid)}
                      className={`text-xs px-2 py-0.5 rounded-md border ${active ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                      {s.suggested_tag_names?.[i] ?? tid}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 px-5 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm px-4 py-2 rounded-md border border-slate-300">Cancel</button>
          <button disabled={applyMut.isPending || (suggestions.data ?? []).length === 0}
            onClick={() => applyMut.mutate()}
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60">
            {applyMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Apply fixes
          </button>
        </div>
      </div>
    </div>
  );
}


const Th = ({ children }: { children: React.ReactNode }) => <th className="text-left font-medium px-4 py-2.5">{children}</th>;
const Td = ({ children }: { children: React.ReactNode }) => <td className="px-4 py-2.5 align-middle">{children}</td>;
