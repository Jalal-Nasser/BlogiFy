import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell, StatusBadge } from "@/components/admin/AdminShell";
import { dashboardStats, listActivity } from "@/lib/cms.functions";
import { FileText, CheckCircle2, FileEdit, Clock, Star, FolderTree, Tags, Users, AlertTriangle, Image as ImageIcon, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Dashboard" }] }),
  component: DashboardPage,
});

function Kpi({ icon: Icon, label, value, tone = "default" }: { icon: any; label: string; value: number | string; tone?: "default" | "amber" | "red" | "green" }) {
  const toneCls = tone === "amber" ? "text-amber-600" : tone === "red" ? "text-red-600" : tone === "green" ? "text-green-600" : "text-blue-600";
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
        <Icon className={`h-4 w-4 ${toneCls}`} />
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function DashboardPage() {
  const stats = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => dashboardStats() });
  const activity = useQuery({ queryKey: ["activity", 10], queryFn: () => listActivity({ data: { limit: 10 } }) });

  const s = stats.data;
  return (
    <AdminShell title="Dashboard">
      {stats.isLoading ? (
        <div className="text-slate-500">Loading…</div>
      ) : !s ? (
        <div className="text-slate-500">No data yet.</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <Kpi icon={FileText} label="Total Posts" value={s.totalPosts} />
            <Kpi icon={CheckCircle2} label="Published" value={s.published} tone="green" />
            <Kpi icon={FileEdit} label="Drafts" value={s.drafts} tone="amber" />
            <Kpi icon={Clock} label="Scheduled" value={s.scheduled} tone="amber" />
            <Kpi icon={Star} label="Featured" value={s.featured} />
            <Kpi icon={FolderTree} label="Categories" value={s.categories} />
            <Kpi icon={Tags} label="Tags" value={s.tags} />
            <Kpi icon={Users} label="Authors" value={s.authors} />
            <Kpi icon={AlertTriangle} label="Missing SEO Title" value={s.missingSeoTitle} tone="red" />
            <Kpi icon={AlertTriangle} label="Missing Meta" value={s.missingMeta} tone="red" />
            <Kpi icon={ImageIcon} label="Missing Image" value={s.missingFeaturedImage} tone="red" />
            <Kpi icon={RefreshCw} label="Updated (7d)" value={s.recentUpdated} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="Recent Posts">
              {s.recent.length === 0 ? <Empty /> : s.recent.map((p: any) => (
                <Row key={p.id}>
                  <Link to="/posts/$id/edit" params={{ id: p.id }} className="font-medium text-slate-900 hover:text-blue-600 truncate">{p.title}</Link>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <StatusBadge status={p.status} />
                    <span>{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}</span>
                  </div>
                </Row>
              ))}
            </Section>
            <Section title="Drafts Needing Review">
              {s.needReview.length === 0 ? <Empty msg="No posts in review." /> : s.needReview.map((p: any) => (
                <Row key={p.id}>
                  <Link to="/posts/$id/edit" params={{ id: p.id }} className="font-medium text-slate-900 hover:text-blue-600 truncate">{p.title}</Link>
                  <StatusBadge status={p.status} />
                </Row>
              ))}
            </Section>
            <Section title="SEO Issues">
              {s.seoIssues.length === 0 ? <Empty msg="No SEO issues." /> : s.seoIssues.map((p: any) => (
                <Row key={p.id}>
                  <Link to="/posts/$id/edit" params={{ id: p.id }} className="font-medium text-slate-900 hover:text-blue-600 truncate">{p.title}</Link>
                  <span className="text-xs text-red-600">
                    {!p.seo_title && "no SEO title"} {!p.seo_title && !p.meta_description && "•"} {!p.meta_description && "no meta"}
                  </span>
                </Row>
              ))}
            </Section>
            <Section title="Recent Activity">
              {activity.isLoading ? <div className="text-slate-500 text-sm">Loading…</div>
              : !activity.data || activity.data.length === 0 ? <Empty msg="No activity yet." />
              : activity.data.map((a: any) => (
                <Row key={a.id}>
                  <span className="text-sm text-slate-700 truncate">{a.description}</span>
                  <span className="text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</span>
                </Row>
              ))}
            </Section>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">{title}</div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-3 flex items-center justify-between gap-3">{children}</div>;
}
function Empty({ msg = "Nothing yet." }: { msg?: string }) {
  return <div className="px-4 py-6 text-sm text-slate-500">{msg}</div>;
}
