import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, Plus, Trash2, RefreshCw, BarChart3, Shield,
  CheckCircle, XCircle, AlertTriangle, LogOut, Loader2,
  Globe, TrendingUp, ChevronUp, ChevronDown, Minus,
  LayoutDashboard, Settings2, ListFilter, Play, ExternalLink
} from "lucide-react";

// ── Server Functions ──────────────────────────────────────────────

const getKeywords = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await sb.from("seo_keywords").select("*").order("created_at", { ascending: false });
  return data ?? [];
});

const addKeyword = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { keyword: string; target_url: string })
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: row } = await sb.from("seo_keywords").insert({ keyword: data.keyword, target_url: data.target_url, country: "us" }).select().single();
    return row;
  });

const deleteKeyword = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { id: number })
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    await sb.from("seo_keywords").delete().eq("id", data.id);
    return { ok: true };
  });

const getRankings = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await sb.from("seo_rankings").select("*").order("checked_at", { ascending: false });
  return data ?? [];
});

const checkRanking = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { keyword_id: number; keyword: string })
  .handler(async ({ data }) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) throw new Error("FIRECRAWL_API_KEY not set");

    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: data.keyword, limit: 20, lang: "en", country: "us" }),
    });
    const json = await res.json() as { data?: Array<{ url: string; title: string }> };
    const results = json.data ?? [];

    let position: number | null = null;
    let matchedUrl = "";
    let matchedTitle = "";
    results.forEach((r, i) => {
      if (!position && r.url && r.url.includes("jalalnasser.com")) {
        position = i + 1;
        matchedUrl = r.url;
        matchedTitle = r.title;
      }
    });

    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: row } = await sb.from("seo_rankings").insert({
      keyword_id: data.keyword_id,
      keyword: data.keyword,
      position,
      url: matchedUrl || null,
      title: matchedTitle || null,
      source: "firecrawl_serp:us",
    }).select().single();
    return row;
  });

const runSiteAudit = createServerFn({ method: "POST" }).handler(async () => {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not set");

  const res = await fetch("https://api.firecrawl.dev/v1/crawl", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url: "https://jalalnasser.com",
      limit: 20,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: false },
    }),
  });
  const crawlJob = await res.json() as { id?: string };
  const jobId = crawlJob.id;
  if (!jobId) throw new Error("Crawl job failed to start");

  // Poll for completion (max 30s)
  let pages: Array<{ url: string; metadata?: { title?: string; description?: string; statusCode?: number } }> = [];
  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`https://api.firecrawl.dev/v1/crawl/${jobId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    const status = await statusRes.json() as { status: string; data?: typeof pages };
    if (status.status === "completed") { pages = status.data ?? []; break; }
  }

  // Analyse issues
  const issues: Array<{ type: string; severity: string; url: string; detail: string }> = [];
  let score = 100;

  pages.forEach(p => {
    if (!p.metadata?.title) { issues.push({ type: "Missing Title", severity: "high", url: p.url, detail: "Page has no <title> tag" }); score -= 5; }
    if (!p.metadata?.description) { issues.push({ type: "Missing Meta Description", severity: "medium", url: p.url, detail: "No meta description found" }); score -= 3; }
    if (p.metadata?.statusCode && p.metadata.statusCode >= 400) { issues.push({ type: "HTTP Error", severity: "high", url: p.url, detail: `Status ${p.metadata.statusCode}` }); score -= 10; }
  });

  score = Math.max(0, score);
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: row } = await sb.from("seo_audits").insert({ url: "https://jalalnasser.com", score, issues, metadata: { pages_crawled: pages.length } }).select().single();
  return row;
});

const getLatestAudit = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await sb.from("seo_audits").select("*").order("checked_at", { ascending: false }).limit(1).single();
  return data;
});

// ── Route ─────────────────────────────────────────────────────────

export const Route = createFileRoute("/seo-dashboard")({
  head: () => ({
    meta: [
      { title: "SEO Dashboard — BlogiFy Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SeoDashboard,
});

// ── Types ─────────────────────────────────────────────────────────
type Keyword = { id: number; keyword: string; target_url: string | null; country: string; status: string };
type Ranking = { id: number; keyword_id: number; keyword: string; position: number | null; url: string | null; checked_at: string; source: string };
type Audit = { id: number; url: string; score: number; issues: Array<{ type: string; severity: string; url: string; detail: string }>; metadata: { pages_crawled?: number }; checked_at: string };

type Tab = "rankings" | "audit" | "keywords";

// ── Component ─────────────────────────────────────────────────────
function SeoDashboard() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState<Tab>("rankings");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [newKw, setNewKw] = useState({ keyword: "", target_url: "" });
  const [checkingId, setCheckingId] = useState<number | null>(null);
  const [runningCycle, setRunningCycle] = useState(false);
  const [auditRunning, setAuditRunning] = useState(false);
  const [addingKw, setAddingKw] = useState(false);
  const [cycleLog, setCycleLog] = useState<string[]>([]);
  const [selectedKw, setSelectedKw] = useState<Keyword | null>(null);
  const [mathChallenge, setMathChallenge] = useState(() => { const a = Math.floor(Math.random()*9)+1; const b = Math.floor(Math.random()*9)+1; return {a,b,answer:String(a+b)}; });
  const [mathAnswer, setMathAnswer] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (mathAnswer.trim() !== mathChallenge.answer) {
      setLoginError("Incorrect verification answer — please try again.");
      return;
    }
    setLoggingIn(true); setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email: loginForm.email, password: loginForm.password });
    setLoggingIn(false);
    if (error) { setLoginError(error.message); return; }
    setAuthed(true);
    loadData();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setAuthed(false);
  }

  async function loadData() {
    const [kws, rnks, aud] = await Promise.all([getKeywords(), getRankings(), getLatestAudit()]);
    setKeywords(kws as Keyword[]);
    setRankings(rnks as Ranking[]);
    setAudit(aud as Audit | null);
  }

  useEffect(() => { if (authed) loadData(); }, [authed]);

  async function handleAddKeyword(e: React.FormEvent) {
    e.preventDefault();
    if (!newKw.keyword) return;
    setAddingKw(true);
    await addKeyword({ data: newKw });
    setNewKw({ keyword: "", target_url: "" });
    const kws = await getKeywords();
    setKeywords(kws as Keyword[]);
    setAddingKw(false);
  }

  async function handleDeleteKeyword(id: number) {
    await deleteKeyword({ data: { id } });
    setKeywords(prev => prev.filter(k => k.id !== id));
    setRankings(prev => prev.filter(r => r.keyword_id !== id));
  }

  async function handleCheckRanking(kw: Keyword) {
    setCheckingId(kw.id);
    const row = await checkRanking({ data: { keyword_id: kw.id, keyword: kw.keyword } });
    setRankings(prev => [row as Ranking, ...prev.filter(r => r.keyword_id !== kw.id)]);
    setCheckingId(null);
  }

  async function handleRunAudit() {
    setAuditRunning(true);
    const row = await runSiteAudit();
    setAudit(row as Audit);
    setAuditRunning(false);
  }

  async function handleRunCycle() {
    setRunningCycle(true);
    setCycleLog([]);
    const log = (msg: string) => setCycleLog(prev => [...prev, msg]);

    log("🔍 Checking keyword rankings...");
    for (const kw of keywords) {
      log(`  Checking: ${kw.keyword}`);
      const row = await checkRanking({ data: { keyword_id: kw.id, keyword: kw.keyword } });
      setRankings(prev => [row as Ranking, ...prev.filter(r => r.keyword_id !== kw.id)]);
    }

    log("🕷️ Running site audit...");
    const aud = await runSiteAudit();
    setAudit(aud as Audit);

    log("✅ SEO cycle complete!");
    setRunningCycle(false);
  }

  // Get latest ranking per keyword
  const latestRankings = keywords.map(kw => ({
    kw,
    rank: rankings.find(r => r.keyword_id === kw.id) ?? null,
  }));

  const filteredRankings = selectedKw
    ? latestRankings.filter(r => r.kw.id === selectedKw.id)
    : latestRankings;

  const allRankingsForSelected = selectedKw
    ? rankings.filter(r => r.keyword_id === selectedKw.id)
    : [];

  // Suppress unused warnings for imports kept for future use
  void navigate; void TrendingUp; void ChevronUp; void ChevronDown; void Minus;

  if (authed === null) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Main split */}
        <div className="flex-1 grid lg:grid-cols-2">

          {/* ── Left panel ── */}
          <div className="relative flex flex-col justify-between p-10 lg:p-14 overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-accent/5 pointer-events-none" />
            <div className="absolute -top-40 -left-40 size-96 rounded-full bg-brand/5 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 right-0 size-80 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

            {/* Brand */}
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src="https://kejgjwvesmlaorviofyl.supabase.co/storage/v1/object/public/media/2023/09/cropped-Jblogify-1.png"
                    alt="BlogiFy"
                    className="h-10 w-10 object-contain drop-shadow-[0_0_12px_rgba(0,212,255,0.6)]"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div>
                    <p className="font-display font-bold text-base text-white">Blogi<span className="text-gradient">Fy</span></p>
                    <p className="text-[10px] font-mono tracking-widest text-brand uppercase">SEO Intelligence · Admin</p>
                  </div>
                </div>
            </div>

            {/* Headline */}
            <div className="relative z-10 my-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 mb-6">
                <span className="size-1.5 rounded-full bg-brand animate-pulse" />
                <span className="text-xs font-mono text-brand tracking-wider">SEO COMMAND CENTER</span>
              </div>
              <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
                SEO control for<br />
                <span className="text-gradient">jalalnasser.com</span>
              </h1>
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                Monitor keyword rankings, audit your site, and run automated SEO cycles targeting the US market — all from one secure dashboard.
              </p>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-2 mt-6">
                {["Keyword Rankings", "Site Audit", "SEO Cycle", "US Market"].map(tag => (
                  <span key={tag} className="rounded-full border border-border bg-surface/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
                {[
                  { icon: Search, label: "KEYWORDS", color: "text-brand" },
                  { icon: BarChart3, label: "RANKINGS", color: "text-accent" },
                  { icon: Globe, label: "SITE AUDIT", color: "text-green-400" },
                  { icon: TrendingUp, label: "US TRAFFIC", color: "text-yellow-400" },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="surface-card rounded-xl border border-border p-3">
                    <Icon className={`size-4 ${color} mb-2`} />
                    <p className="text-[10px] font-mono tracking-widest text-muted-foreground">{label}</p>
                    <div className="mt-1.5 h-0.5 rounded-full bg-border overflow-hidden">
                      <div className={`h-full w-2/3 rounded-full bg-gradient-to-r from-brand to-accent`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="relative z-10 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-green-400" />
              <span className="font-semibold text-foreground">BlogiFy</span>
              <span>·</span>
              <span>Scope: <span className="text-brand font-medium">US SEO Engine</span></span>
              <span>·</span>
              <span>Access: <span className="text-foreground font-medium">Admin only</span></span>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="flex items-center justify-center p-8 lg:p-14 bg-surface/20">
            <div className="w-full max-w-md">
              <div className="surface-card rounded-2xl border border-border p-8 shadow-2xl">
                {/* Header badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 mb-6">
                  <Shield className="size-3 text-brand" />
                  <span className="text-xs font-mono text-brand tracking-wider">SECURE ADMIN ACCESS</span>
                </div>

                <h2 className="font-display text-2xl font-bold mb-1">Sign in to SEO Dashboard</h2>
                <p className="text-sm text-muted-foreground mb-6">Sign in with your admin email, password, and the verification answer.</p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email</label>
                    <input
                      type="email" required value={loginForm.email}
                      onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-border bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Password</label>
                    <input
                      type="password" required value={loginForm.password}
                      onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-border bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors"
                    />
                  </div>

                  {/* Math CAPTCHA */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Simple verification</label>
                      <button type="button" onClick={() => { const a = Math.floor(Math.random()*9)+1; const b = Math.floor(Math.random()*9)+1; setMathChallenge({a,b,answer:String(a+b)}); setMathAnswer(""); }} className="text-xs text-brand hover:underline flex items-center gap-1">
                        <RefreshCw className="size-3" /> New question
                      </button>
                    </div>
                    <div className="rounded-lg border border-border bg-background/30 px-4 py-2.5 text-sm font-mono text-muted-foreground">
                      What is {mathChallenge.a} + {mathChallenge.b}?
                    </div>
                    <input
                      type="text" value={mathAnswer} onChange={e => setMathAnswer(e.target.value)}
                      placeholder="Your answer" inputMode="numeric"
                      className="w-full rounded-lg border border-border bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors"
                    />
                  </div>

                  {loginError && (
                    <div className="flex items-center gap-2 text-xs text-red-400">
                      <XCircle className="size-3.5 shrink-0" /> {loginError}
                    </div>
                  )}

                  <button
                    type="submit" disabled={loggingIn}
                    className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    {loggingIn ? <><Loader2 className="size-4 animate-spin" /> Signing in…</> : "Sign in"}
                  </button>
                </form>

                {/* Security note */}
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/50 bg-background/20 p-3 text-xs text-muted-foreground">
                  <Shield className="size-3.5 shrink-0 mt-0.5 text-brand" />
                  Admin data and ranking reports are protected. All access is logged and restricted to authorised admins.
                </div>
              </div>

              {/* Footer */}
              <p className="text-center text-xs text-muted-foreground mt-4">
                BlogiFy · Internal platform · Access restricted to authorised admins
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function RankBadge({ pos }: { pos: number | null }) {
    if (pos === null) return <span className="text-xs text-gray-400 font-mono">—</span>;
    const cls = pos <= 3
      ? "bg-green-100 text-green-700"
      : pos <= 10
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";
    return <span className={`font-mono font-semibold text-xs rounded px-2 py-0.5 ${cls}`}>#{pos}</span>;
  }

  type NavKey = "overview" | "rankings" | "audit" | "settings";
  type DetailTab = "rankings" | "audit" | "recs";

  // Local UI state for redesigned dashboard
  const [navKey, setNavKey] = useState<NavKey>("overview");
  const [detailTab, setDetailTab] = useState<DetailTab>("rankings");
  const [filter, setFilter] = useState("");

  const activeKeywords = keywords.filter(k => k.status !== "archived");
  const latestRankingDate = rankings[0]?.checked_at ?? null;
  const top10 = latestRankings.filter(r => r.rank?.position && r.rank.position <= 10).length;
  const top20 = latestRankings.filter(r => r.rank?.position && r.rank.position <= 20).length;
  const notRanking = latestRankings.filter(r => !r.rank?.position).length;
  const auditScore = audit?.score ?? null;
  const auditIssuesCount = audit ? (audit.issues as Array<unknown>).length : 0;

  const filteredKeywords = keywords.filter(k =>
    !filter || k.keyword.toLowerCase().includes(filter.toLowerCase())
  );

  const navItems: Array<{ key: NavKey; label: string; icon: typeof LayoutDashboard }> = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "rankings", label: "Rankings", icon: TrendingUp },
    { key: "audit", label: "Site Audit", icon: Shield },
    { key: "settings", label: "Settings", icon: Settings2 },
  ];

  void tab; void setTab; void filteredRankings;

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* ── Sidebar ── */}
      <aside className="w-[210px] shrink-0 bg-[#0f172a] text-slate-200 flex flex-col border-r border-slate-800">
        <div className="px-4 py-5 flex items-center gap-2.5 border-b border-slate-800">
          <img
            src="https://kejgjwvesmlaorviofyl.supabase.co/storage/v1/object/public/media/2023/09/cropped-Jblogify-1.png"
            alt="BlogiFy"
            className="h-8 w-8 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-tight">BlogiFy</p>
            <p className="text-[10px] text-slate-400 leading-tight">SEO Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ key, label, icon: Icon }) => {
            const active = navKey === key;
            return (
              <button
                key={key}
                onClick={() => setNavKey(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  active ? "bg-[#1e3a5f] text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="px-2 py-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-red-400 hover:text-red-300 hover:bg-slate-800/50 transition-colors"
          >
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">SEO Engine Console</h1>
            <p className="text-sm text-gray-500 mt-0.5">Target keyword workflow · jalalnasser.com · US Market</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Status as of {new Date().toLocaleString()}</span>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="size-3.5" /> Refresh
            </button>
          </div>
        </header>

        {/* Status cards */}
        <div className="px-6 py-4 flex gap-4 bg-gray-50">
          {/* FIRECRAWL */}
          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Firecrawl</p>
            <div className="mt-2">
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Connected</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Last checked: {latestRankingDate ? new Date(latestRankingDate).toLocaleString() : "Never"}
            </p>
          </div>

          {/* KEYWORDS */}
          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Keywords</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{keywords.length}</p>
            <p className="text-sm text-gray-500 mt-1">{activeKeywords.length} active keywords</p>
          </div>

          {/* LAST RANKING */}
          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Last Ranking</p>
            <p className="text-sm font-semibold text-gray-900 mt-2">
              {latestRankingDate ? new Date(latestRankingDate).toLocaleDateString() : "Never"}
            </p>
            <p className="text-sm text-gray-500 mt-1">Top10: {top10} · Top20: {top20} · Not ranking: {notRanking}</p>
          </div>

          {/* SITE SCORE */}
          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Site Score</p>
            <p className={`text-2xl font-bold mt-1 ${
              auditScore === null ? "text-gray-400"
                : auditScore >= 70 ? "text-green-600"
                : auditScore >= 50 ? "text-amber-600" : "text-red-600"
            }`}>
              {auditScore !== null ? `${auditScore}/100` : "—"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {auditIssuesCount} issues found · Last: {audit ? new Date(audit.checked_at).toLocaleDateString() : "Never"}
            </p>
          </div>
        </div>

        {/* Two-panel content */}
        <div className="flex flex-1 overflow-hidden border-t border-gray-200">
          {/* LEFT PANEL */}
          <div className="w-80 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 font-semibold text-sm text-gray-800">
              <ListFilter className="size-4 text-gray-500" /> Target Keywords
            </div>

            <form onSubmit={handleAddKeyword} className="px-4 py-3 border-b border-gray-100 space-y-2">
              <input
                value={newKw.keyword}
                onChange={e => setNewKw(p => ({ ...p, keyword: e.target.value }))}
                placeholder="Keyword"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <input
                value={newKw.target_url}
                onChange={e => setNewKw(p => ({ ...p, target_url: e.target.value }))}
                placeholder="Target URL (optional)"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <button
                type="submit" disabled={addingKw || !newKw.keyword}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-900 text-white rounded py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {addingKw ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                Add Keyword
              </button>
            </form>

            <div className="px-4 py-3 border-b border-gray-100 grid grid-cols-2 gap-2">
              <button
                onClick={async () => { for (const kw of keywords) { await handleCheckRanking(kw); } }}
                disabled={checkingId !== null || runningCycle || keywords.length === 0}
                className="flex items-center justify-center gap-1 border border-gray-200 rounded text-xs py-2 px-3 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className="size-3" /> Check All
              </button>
              <button
                onClick={handleRunCycle}
                disabled={runningCycle || keywords.length === 0}
                className="flex items-center justify-center gap-1 border border-gray-200 rounded text-xs py-2 px-3 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {runningCycle ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
                Run Full Cycle
              </button>
            </div>

            {runningCycle && cycleLog.length > 0 && (
              <div className="mx-4 my-2 bg-gray-50 rounded text-xs font-mono px-3 py-2 max-h-32 overflow-y-auto text-gray-700 space-y-0.5">
                {cycleLog.map((l, i) => <p key={i}>{l}</p>)}
              </div>
            )}

            <div className="px-4 py-2">
              <input
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Filter keywords..."
                className="w-full bg-transparent border-0 border-b border-gray-100 py-2 text-sm focus:outline-none focus:border-gray-300"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredKeywords.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No keywords {filter ? "match" : "yet"}</p>
              ) : (
                filteredKeywords.map(kw => {
                  const rank = rankings.find(r => r.keyword_id === kw.id);
                  const selected = selectedKw?.id === kw.id;
                  return (
                    <div
                      key={kw.id}
                      onClick={() => setSelectedKw(kw)}
                      className={`group px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors ${
                        selected ? "bg-slate-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">{kw.keyword}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <RankBadge pos={rank?.position ?? null} />
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteKeyword(kw.id); }}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                      {kw.target_url && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{kw.target_url}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {!selectedKw ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">Select a keyword from the left panel to begin.</p>
              </div>
            ) : (
              <>
                {/* Keyword detail header */}
                <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-start justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-gray-900">{selectedKw.keyword}</h2>
                    {selectedKw.target_url && (
                      <a
                        href={selectedKw.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <ExternalLink className="size-3" /> {selectedKw.target_url}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => handleCheckRanking(selectedKw)}
                      disabled={checkingId === selectedKw.id}
                      className="flex items-center gap-1 border border-gray-200 rounded text-xs px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      {checkingId === selectedKw.id ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                      Check Ranking
                    </button>
                    <button
                      onClick={() => { handleDeleteKeyword(selectedKw.id); setSelectedKw(null); }}
                      className="flex items-center gap-1 border border-gray-200 rounded text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="size-3" /> Delete
                    </button>
                  </div>
                </div>

                {/* Summary cards */}
                <div className="px-6 py-4 grid grid-cols-2 gap-4">
                  {(() => {
                    const latest = rankings.find(r => r.keyword_id === selectedKw.id);
                    return (
                      <>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Current Ranking</p>
                          <p className={`text-2xl font-bold mt-1 ${
                            !latest?.position ? "text-gray-400"
                              : latest.position <= 3 ? "text-green-600"
                              : latest.position <= 10 ? "text-amber-600" : "text-red-600"
                          }`}>
                            {latest?.position ? `#${latest.position}` : "Not in Top 20"}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Last checked: {latest ? new Date(latest.checked_at).toLocaleString() : "Never"}
                          </p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Target Page</p>
                          <p className="text-sm font-medium text-gray-800 mt-1 truncate">
                            {selectedKw.target_url || "—"}
                          </p>
                          {selectedKw.target_url && (
                            <a
                              href={selectedKw.target_url}
                              target="_blank" rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                            >
                              <ExternalLink className="size-3" /> View page
                            </a>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-gray-200 flex gap-4 bg-gray-50">
                  {([
                    { key: "rankings", label: "Rankings" },
                    { key: "audit", label: "Site Audit" },
                    { key: "recs", label: "Recommendations" },
                  ] as Array<{ key: DetailTab; label: string }>).map(t => (
                    <button
                      key={t.key}
                      onClick={() => setDetailTab(t.key)}
                      className={`py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        detailTab === t.key
                          ? "border-slate-900 text-slate-900"
                          : "border-transparent text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="px-6 py-4">
                  {detailTab === "rankings" && (
                    allRankingsForSelected.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">No rankings data yet. Run "Check All Rankings" to start.</p>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Position</th>
                              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">URL found at</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {allRankingsForSelected.map(r => (
                              <tr key={r.id}>
                                <td className="px-4 py-2.5 text-gray-700">{new Date(r.checked_at).toLocaleString()}</td>
                                <td className="px-4 py-2.5"><RankBadge pos={r.position} /></td>
                                <td className="px-4 py-2.5 text-gray-500 truncate max-w-xs">{r.url || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}

                  {detailTab === "audit" && (
                    !audit ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-400 mb-3">No audit data yet. Run Full SEO Cycle.</p>
                        <button
                          onClick={handleRunAudit}
                          disabled={auditRunning}
                          className="inline-flex items-center gap-1.5 border border-gray-200 rounded text-xs px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {auditRunning ? <Loader2 className="size-3 animate-spin" /> : <Globe className="size-3" />}
                          Run Site Audit
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-lg p-5">
                        <div className="flex items-center gap-4 mb-5">
                          <div className={`size-16 rounded-full border-4 grid place-items-center text-xl font-bold ${
                            audit.score >= 70 ? "border-green-500 text-green-600"
                              : audit.score >= 50 ? "border-amber-500 text-amber-600" : "border-red-500 text-red-600"
                          }`}>
                            {audit.score}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {audit.score >= 70 ? "Healthy" : audit.score >= 50 ? "Needs Work" : "Critical"}
                            </p>
                            <p className="text-sm text-gray-500">{(audit.issues as Array<unknown>).length} issues · {audit.metadata?.pages_crawled ?? 0} pages crawled</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {(audit.issues as Array<{ type: string; severity: string; url: string; detail: string }>).length === 0 ? (
                            <div className="flex items-center gap-2 text-green-600 text-sm">
                              <CheckCircle className="size-4" /> No issues found — site looks healthy!
                            </div>
                          ) : (
                            (audit.issues as Array<{ type: string; severity: string; url: string; detail: string }>).map((issue, i) => (
                              <div key={i} className={`flex items-start gap-3 rounded-lg p-3 border ${
                                issue.severity === "high" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                              }`}>
                                <AlertTriangle className={`size-4 mt-0.5 shrink-0 ${issue.severity === "high" ? "text-red-500" : "text-amber-500"}`} />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-900">{issue.type}</p>
                                  <p className="text-xs text-gray-500 truncate">{issue.url}</p>
                                  <p className="text-xs text-gray-600 mt-0.5">{issue.detail}</p>
                                </div>
                                <span className={`text-xs shrink-0 rounded-full px-2 py-0.5 font-medium ${
                                  issue.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                }`}>
                                  {issue.severity}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {detailTab === "recs" && (
                    <p className="text-sm text-gray-400 text-center py-8">No recommendations yet.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

