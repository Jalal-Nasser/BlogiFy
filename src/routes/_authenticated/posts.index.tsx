import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { AdminShell, StatusBadge } from "@/components/admin/AdminShell";
import { listPosts, listCategories, listAuthors, archivePost, togglePostFeatured } from "@/lib/cms.functions";
import { Plus, Edit, Archive, Star, StarOff, Search } from "lucide-react";

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
          <button onClick={() => navigate({ to: "/posts/new" })} className="ml-auto inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-700">
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
    </AdminShell>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => <th className="text-left font-medium px-4 py-2.5">{children}</th>;
const Td = ({ children }: { children: React.ReactNode }) => <td className="px-4 py-2.5 align-middle">{children}</td>;
