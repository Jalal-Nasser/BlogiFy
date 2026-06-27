import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { seoIssues, trafficStats } from "@/lib/cms.functions";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/seo")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "SEO" }] }),
  component: SeoPage,
});

function SeoPage() {
  const [days, setDays] = useState<7 | 30>(7);
  const [metric, setMetric] = useState<"views" | "visitors">("views");
  const traffic = useQuery({ queryKey: ["traffic", days], queryFn: () => trafficStats({ data: { days } }) });
  const issues = useQuery({ queryKey: ["seo-issues"], queryFn: () => seoIssues() });

  return (
    <AdminShell title="SEO">
      {/* ===== Traffic section ===== */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Traffic</h2>
            <p className="text-xs text-slate-500">Site analytics from your visitors.</p>
          </div>
          <div className="flex rounded-md border border-slate-200 bg-white overflow-hidden text-xs">
            {[7, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d as 7 | 30)}
                className={`px-3 py-1.5 ${days === d ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                Last {d} days
              </button>
            ))}
          </div>
        </div>

        {traffic.isLoading ? (
          <div className="text-slate-500 text-sm">Loading traffic…</div>
        ) : !traffic.data?.hasData ? (
          <div className="bg-white rounded-lg border border-slate-200 p-10 text-center text-slate-500 text-sm">
            No traffic data yet. Visits to your public site pages will appear here.
          </div>
        ) : (
          <TrafficWidgets data={traffic.data!} days={days} metric={metric} setMetric={setMetric} />
        )}
      </section>

      {/* ===== Existing SEO issues ===== */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">SEO Issues</h2>
        {issues.isLoading ? (
          <div className="text-slate-500 text-sm">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {([
              ["Missing SEO Title", issues.data!.missingSeoTitle],
              ["Missing Meta Description", issues.data!.missingMeta],
              ["Missing Featured Image", issues.data!.missingFeaturedImage],
              ["Missing Category", issues.data!.missingCategory],
              ["Missing Tags", issues.data!.missingTags],
              ["Missing Canonical URL", issues.data!.missingCanonical],
              ["Duplicate Slugs", issues.data!.duplicateSlugs],
            ] as const).map(([title, list]) => (
              <SeoCard key={title} title={title} list={list as any[]} />
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function TrafficWidgets({
  data,
  days,
  metric,
  setMetric,
}: {
  data: NonNullable<ReturnType<typeof trafficStats> extends Promise<infer T> ? T : never>;
  days: 7 | 30;
  metric: "views" | "visitors";
  setMetric: (m: "views" | "visitors") => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Today */}
      <Panel title="Today" subtitle="Since midnight">
        <div className="grid grid-cols-2 gap-4 py-2">
          <BigStat icon={<Eye className="h-4 w-4" />} label="Views" value={data.todayViews} />
          <BigStat icon={<Users className="h-4 w-4" />} label="Visitors" value={data.todayVisitors} />
        </div>
      </Panel>

      {/* Last 7 Days bar chart */}
      <Panel
        title="Last 7 Days"
        subtitle="Views per day"
        right={<DeltaBadge pct={data.last7.pctChange} />}
      >
        <div className="text-2xl font-semibold text-slate-900 mb-1">{data.last7.views.toLocaleString()}</div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.last7.daily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #e2e8f0" }}
                cursor={{ fill: "rgba(59,130,246,0.08)" }}
              />
              <Bar dataKey="views" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Views & Visitors trend */}
      <Panel
        title="Views & Visitors"
        subtitle={`Last ${days} days vs previous ${days}`}
        right={
          <div className="flex rounded-md border border-slate-200 overflow-hidden text-[11px]">
            {(["views", "visitors"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-2 py-1 capitalize ${metric === m ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {m}
              </button>
            ))}
          </div>
        }
      >
        <div className="text-xs text-slate-600 mb-2">
          Your {metric} in the last {days} days are{" "}
          <span className={data.period.pctChange >= 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
            {Math.abs(data.period.pctChange).toFixed(1)}%
          </span>{" "}
          {data.period.pctChange >= 0 ? "higher" : "lower"} than the previous {days} days.
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.period.trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #e2e8f0" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey={metric === "views" ? "current" : "currentVisitors"}
                name={`Last ${days} days`}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey={metric === "views" ? "previous" : "previousVisitors"}
                name={`Previous ${days} days`}
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Top Posts + Top Referrers */}
      <Panel title="Top Posts" subtitle={`Most viewed in last ${days} days`} className="lg:col-span-2">
        {data.topPosts.length === 0 && data.topPaths.length === 0 ? (
          <div className="text-sm text-slate-500 py-4">No posts viewed yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.topPosts.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                {p.slug ? (
                  <Link to="/blog/$slug" params={{ slug: p.slug }} className="text-slate-700 hover:text-blue-600 truncate pr-3">
                    {p.title}
                  </Link>
                ) : (
                  <span className="text-slate-700 truncate pr-3">{p.title}</span>
                )}
                <span className="font-medium text-slate-900 tabular-nums">{p.count.toLocaleString()}</span>
              </li>
            ))}
            {data.topPaths.slice(0, Math.max(0, 10 - data.topPosts.length)).map((p) => (
              <li key={p.path} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-500 truncate pr-3 font-mono text-xs">{p.path}</span>
                <span className="font-medium text-slate-900 tabular-nums">{p.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Top Referrers" subtitle={`Where visitors came from`}>
        {data.topReferrers.length === 0 ? (
          <div className="text-sm text-slate-500 py-4">No referrers yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.topReferrers.map((r) => (
              <li key={r.referrer} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700 truncate pr-3">{r.referrer}</span>
                <span className="font-medium text-slate-900 tabular-nums">{r.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-4 ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function BigStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="text-3xl font-semibold text-slate-900 mt-1 tabular-nums">{value.toLocaleString()}</div>
    </div>
  );
}

function DeltaBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-md ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
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
