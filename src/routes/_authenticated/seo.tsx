import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { seoIssues } from "@/lib/cms.functions";
import { ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/seo")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "SEO" }] }),
  component: SeoPage,
});

function SeoPage() {
  const q = useQuery({ queryKey: ["seo-issues"], queryFn: () => seoIssues() });
  if (q.isLoading) return <AdminShell title="SEO"><div className="text-slate-500">Loading…</div></AdminShell>;
  const d = q.data!;
  const sections = [
    ["Missing SEO Title", d.missingSeoTitle],
    ["Missing Meta Description", d.missingMeta],
    ["Missing Featured Image", d.missingFeaturedImage],
    ["Missing Category", d.missingCategory],
    ["Missing Tags", d.missingTags],
    ["Missing Canonical URL", d.missingCanonical],
    ["Duplicate Slugs", d.duplicateSlugs],
  ] as const;
  return (
    <AdminShell title="SEO">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sections.map(([title, list]) => <SeoCard key={title} title={title} list={list} />)}
      </div>
    </AdminShell>
  );
}

function SeoCard({ title, list }: { title: string; list: any[] }) {
  const [open, setOpen] = useState(false);
  const has = list.length > 0;
  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <button onClick={() => setOpen((v) => !v)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50">
        <div className="flex items-center gap-2">
          {has ? <AlertTriangle className="h-4 w-4 text-red-500" /> : null}
          <span className="font-medium text-slate-900">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm px-2 py-0.5 rounded-md ${has ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{list.length}</span>
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 border-t border-slate-100 divide-y divide-slate-100">
          {list.length === 0 ? <div className="py-3 text-sm text-slate-500">No issues.</div>
          : list.map((p: any) => (
            <Link key={p.id} to="/posts/$id/edit" params={{ id: p.id }} className="block py-2 text-sm text-slate-700 hover:text-blue-600 truncate">
              {p.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
