import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminShell } from "./AdminShell";
import { savePost, getPost, listCategories, listAuthors, listTags } from "@/lib/cms.functions";
import { slugify } from "@/lib/slug";
import { Loader2 } from "lucide-react";

type Tab = "content" | "seo" | "publishing";
const STATUSES = ["Draft", "In review", "Scheduled", "Published", "Archived"];

export default function PostEditor({ postId }: { postId?: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("content");

  const existing = useQuery({
    queryKey: ["post", postId],
    queryFn: () => getPost({ data: { id: postId! } }),
    enabled: !!postId,
  });
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const authors = useQuery({ queryKey: ["authors"], queryFn: () => listAuthors() });
  const tags = useQuery({ queryKey: ["tags"], queryFn: () => listTags() });

  const [form, setForm] = useState<any>({
    title: "", slug: "", excerpt: "", content: "", featured_image_url: "", featured: false,
    seo_title: "", meta_description: "", canonical_url: "",
    author_id: "", category_id: "", status: "Draft", published_at: "",
    tag_ids: [] as string[],
  });
  const [touchedSlug, setTouchedSlug] = useState(false);

  useEffect(() => {
    if (existing.data?.post) {
      const p = existing.data.post;
      setForm({
        title: p.title ?? "", slug: p.slug ?? "", excerpt: p.excerpt ?? "", content: p.content ?? "",
        featured_image_url: p.featured_image_url ?? "", featured: !!p.featured,
        seo_title: p.seo_title ?? "", meta_description: p.meta_description ?? "", canonical_url: p.canonical_url ?? "",
        author_id: p.author_id ?? "", category_id: p.category_id ?? "",
        status: p.status ?? "Draft",
        published_at: p.published_at ? new Date(p.published_at).toISOString().slice(0, 16) : "",
        tag_ids: existing.data.tag_ids ?? [],
      });
      setTouchedSlug(true);
    }
  }, [existing.data]);

  const saveMut = useMutation({
    mutationFn: (override?: { status?: string }) => savePost({
      data: {
        id: postId,
        title: form.title,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt || null,
        content: form.content || "",
        category_id: form.category_id || null,
        author_id: form.author_id || null,
        status: override?.status ?? form.status,
        featured: !!form.featured,
        featured_image_url: form.featured_image_url || null,
        seo_title: form.seo_title || null,
        meta_description: form.meta_description || null,
        canonical_url: form.canonical_url || null,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
        tag_ids: form.tag_ids,
      },
    }),
    onSuccess: (res) => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["activity", 10] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      if (!postId && res?.id) navigate({ to: "/posts/$id/edit", params: { id: res.id } });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function setField(k: string, v: any) {
    setForm((f: any) => ({ ...f, [k]: v }));
  }

  return (
    <AdminShell title={postId ? "Edit Post" : "New Post"}>
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 px-2 flex gap-1">
          {(["content", "seo", "publishing"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium capitalize border-b-2 ${tab === t ? "border-blue-600 text-blue-700" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="p-5 space-y-4">
          {tab === "content" && (
            <>
              <Field label="Title">
                <input className={inp} value={form.title}
                  onChange={(e) => { setField("title", e.target.value); if (!touchedSlug) setField("slug", slugify(e.target.value)); }} />
              </Field>
              <Field label="Slug">
                <input className={inp} value={form.slug} onChange={(e) => { setTouchedSlug(true); setField("slug", e.target.value); }} />
              </Field>
              <Field label="Excerpt">
                <textarea rows={2} className={inp} value={form.excerpt} onChange={(e) => setField("excerpt", e.target.value)} />
              </Field>
              <Field label="Content">
                <textarea rows={14} className={`${inp} font-mono text-sm`} value={form.content} onChange={(e) => setField("content", e.target.value)} />
              </Field>
              <Field label="Featured Image URL">
                <input className={inp} value={form.featured_image_url} onChange={(e) => setField("featured_image_url", e.target.value)} />
              </Field>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured} onChange={(e) => setField("featured", e.target.checked)} />
                Mark as featured
              </label>
            </>
          )}
          {tab === "seo" && (
            <>
              <Field label="SEO Title"><input className={inp} value={form.seo_title} onChange={(e) => setField("seo_title", e.target.value)} /></Field>
              <Field label="Meta Description"><textarea rows={3} className={inp} value={form.meta_description} onChange={(e) => setField("meta_description", e.target.value)} /></Field>
              <Field label="Canonical URL"><input className={inp} value={form.canonical_url} onChange={(e) => setField("canonical_url", e.target.value)} /></Field>
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
                <div className="text-xs uppercase text-slate-500 mb-2">Search preview</div>
                <div className="text-blue-700 text-base truncate">{form.seo_title || form.title || "Untitled"}</div>
                <div className="text-green-700 text-xs truncate">{form.canonical_url || `https://example.com/blog/${form.slug || "slug"}`}</div>
                <div className="text-slate-600 text-sm mt-1 line-clamp-2">{form.meta_description || form.excerpt || "No meta description set."}</div>
              </div>
            </>
          )}
          {tab === "publishing" && (
            <>
              <Field label="Author">
                <select className={inp} value={form.author_id} onChange={(e) => setField("author_id", e.target.value)}>
                  <option value="">— none —</option>
                  {(authors.data ?? []).map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select className={inp} value={form.category_id} onChange={(e) => setField("category_id", e.target.value)}>
                  <option value="">— none —</option>
                  {(cats.data ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Tags">
                <select multiple className={`${inp} h-32`} value={form.tag_ids}
                  onChange={(e) => setField("tag_ids", Array.from(e.target.selectedOptions).map((o) => o.value))}>
                  {(tags.data ?? []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <div className="text-xs text-slate-500 mt-1">Cmd/Ctrl-click to select multiple.</div>
              </Field>
              <Field label="Status">
                <select className={inp} value={form.status} onChange={(e) => setField("status", e.target.value)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              {form.status === "Scheduled" && (
                <Field label="Publish Date">
                  <input type="datetime-local" className={inp} value={form.published_at} onChange={(e) => setField("published_at", e.target.value)} />
                </Field>
              )}
            </>
          )}
          <div className="flex gap-2 pt-4 border-t border-slate-200">
            <button disabled={saveMut.isPending} onClick={() => saveMut.mutate(undefined)} className="inline-flex items-center gap-1.5 bg-slate-700 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-800 disabled:opacity-60">
              {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
            <button disabled={saveMut.isPending} onClick={() => { setField("status", "Published"); saveMut.mutate({ status: "Published" }); }} className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60">
              Publish
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

const inp = "w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
