import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { reportsStats } from "@/lib/cms.functions";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Reports" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const q = useQuery({ queryKey: ["reports"], queryFn: () => reportsStats() });
  if (q.isLoading) return <AdminShell title="Reports"><div className="text-slate-500">Loading…</div></AdminShell>;
  const d = q.data!;
  return (
    <AdminShell title="Reports">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card title="Posts by Status">
          {Object.entries(d.byStatus).map(([k, v]) => <Row key={k} label={k} value={v as number} />)}
        </Card>
        <Card title="Posts by Category">
          {d.byCategory.length === 0 ? <Empty /> : d.byCategory.map((c) => <Row key={c.name} label={c.name} value={c.count} />)}
        </Card>
        <Card title="Posts by Author">
          {d.byAuthor.length === 0 ? <Empty /> : d.byAuthor.map((a) => <Row key={a.name} label={a.name} value={a.count} />)}
        </Card>
        <SimpleCard label="Published This Month" value={d.publishedThisMonth} />
        <SimpleCard label="Drafts Waiting for Review" value={d.draftsForReview} tone="amber" />
        <SimpleCard label="Posts with SEO Issues" value={d.seoIssueCount} tone="red" />
        <SimpleCard label="Posts Updated (30 days)" value={d.updated30} />
      </div>
    </AdminShell>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white rounded-lg border border-slate-200"><div className="px-4 py-3 font-semibold text-slate-900 border-b border-slate-200">{title}</div><div className="divide-y divide-slate-100">{children}</div></div>;
}
function Row({ label, value }: { label: string; value: number }) {
  return <div className="px-4 py-2 flex justify-between text-sm"><span className="text-slate-700">{label}</span><span className="font-medium">{value}</span></div>;
}
function Empty() { return <div className="px-4 py-3 text-slate-500 text-sm">No data.</div>; }
function SimpleCard({ label, value, tone }: { label: string; value: number; tone?: "amber" | "red" }) {
  const cls = tone === "amber" ? "text-amber-600" : tone === "red" ? "text-red-600" : "text-blue-600";
  return <div className="bg-white rounded-lg border border-slate-200 p-4"><div className="text-xs uppercase text-slate-500">{label}</div><div className={`text-3xl font-bold mt-2 ${cls}`}>{value}</div></div>;
}
