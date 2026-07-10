import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSettings, saveSettings, listAuthors } from "@/lib/cms.functions";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, KeyRound } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Settings" }] }),
  component: SettingsPage,
});

const inp = "w-full border border-slate-300 rounded-md px-3 py-2 text-sm";

function SettingsPage() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });
  const authors = useQuery({ queryKey: ["authors"], queryFn: () => listAuthors() });
  const [form, setForm] = useState<any>({ blog_name: "", blog_description: "", default_author_id: "", seo_title_pattern: "%title% | %blog_name%" });

  useEffect(() => {
    if (settings.data) setForm({
      id: settings.data.id,
      blog_name: settings.data.blog_name ?? "",
      blog_description: settings.data.blog_description ?? "",
      default_author_id: settings.data.default_author_id ?? "",
      seo_title_pattern: settings.data.seo_title_pattern ?? "%title% | %blog_name%",
    });
  }, [settings.data]);

  const mut = useMutation({
    mutationFn: () => saveSettings({ data: {
      id: form.id,
      blog_name: form.blog_name,
      blog_description: form.blog_description || null,
      default_author_id: form.default_author_id || null,
      seo_title_pattern: form.seo_title_pattern,
    } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Settings saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AdminShell title="Settings">
      <div className="max-w-2xl bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <F label="Blog Name"><input className={inp} value={form.blog_name} onChange={(e) => setForm({ ...form, blog_name: e.target.value })} /></F>
        <F label="Blog Description"><textarea rows={3} className={inp} value={form.blog_description} onChange={(e) => setForm({ ...form, blog_description: e.target.value })} /></F>
        <F label="Default Author">
          <select className={inp} value={form.default_author_id} onChange={(e) => setForm({ ...form, default_author_id: e.target.value })}>
            <option value="">— none —</option>
            {(authors.data ?? []).map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </F>
        <F label="SEO Title Pattern"><input className={inp} value={form.seo_title_pattern} onChange={(e) => setForm({ ...form, seo_title_pattern: e.target.value })} /><p className="text-xs text-slate-500 mt-1">Use %title% and %blog_name% placeholders.</p></F>
        <button disabled={mut.isPending} onClick={() => mut.mutate()} className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60">
          {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save settings
        </button>
      </div>
    </AdminShell>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium uppercase text-slate-500 mb-1.5">{label}</label>{children}</div>;
}
