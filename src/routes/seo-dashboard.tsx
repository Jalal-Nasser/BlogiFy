import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Trash2, RefreshCw, BarChart3, Shield, CheckCircle, XCircle, AlertTriangle, LogOut, Loader2, Globe, TrendingUp, LayoutDashboard, Settings2, ListFilter, Play, ExternalLink, Info, Activity, Calendar, Zap, Database } from "lucide-react";
void Search; void XCircle;

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
  const { data } = await sb.from("seo_audits").select("*").order("checked_at", { ascending: false }).limit(1).maybeSingle();
  return data;
});

const pingSite = createServerFn({ method: "GET" }).handler(async () => {
  const start = Date.now();
  try {
    const res = await fetch("https://jalalnasser.com", { method: "HEAD" });
    return { ok: res.ok, status: res.status, ms: Date.now() - start };
  } catch {
    return { ok: false, status: 0, ms: Date.now() - start };
  }
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

// ── Component ─────────────────────────────────────────────────────
function SeoDashboard() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [newKw, setNewKw] = useState({ keyword: "", target_url: "" });
  const [checkingId, setCheckingId] = useState<number | null>(null);
  const [runningCycle, setRunningCycle] = useState(false);
  const [addingKw, setAddingKw] = useState(false);
  const [auditRunning, setAuditRunning] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; status: string; time: string } | null>(null);
  const [pinging, setPinging] = useState(false);
  const [cycleLog, setCycleLog] = useState<string[]>([]);
  const [selectedKwId, setSelectedKwId] = useState<number | null>(null);
  const [filterText, setFilterText] = useState("");
  const [activeTab, setActiveTab] = useState<"rankings" | "audit" | "recommendations">("rankings");
  const [navSection, setNavSection] = useState<"overview" | "seo-summary" | "rankings" | "audit" | "connection-guide" | "settings">("overview");
  const [hoveredKwId, setHoveredKwId] = useState<number | null>(null);
  const [mathChallenge, setMathChallenge] = useState(() => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    return { a, b, answer: String(a + b) };
  });
  const [mathAnswer, setMathAnswer] = useState("");
  const [statusTime] = useState(() => new Date().toLocaleString());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (mathAnswer.trim() !== mathChallenge.answer) {
      setLoginError("Incorrect verification answer — please try again.");
      return;
    }
    setLoggingIn(true);
    setLoginError("");
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

  // Analytics: fire GA4 page_view on nav section change
  useEffect(() => {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof window !== "undefined" && w.gtag) {
      w.gtag("event", "page_view", {
        page_title: `SEO Dashboard – ${navSection}`,
        page_location: `/seo-dashboard#${navSection}`,
      });
    }
  }, [navSection]);

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
    if (selectedKwId === id) setSelectedKwId(null);
  }

  async function handleCheckRanking(kw: Keyword) {
    setCheckingId(kw.id);
    const row = await checkRanking({ data: { keyword_id: kw.id, keyword: kw.keyword } });
    setRankings(prev => [row as Ranking, ...prev.filter(r => r.keyword_id !== kw.id)]);
    setCheckingId(null);
  }

  async function handleCheckAll() {
    for (const kw of keywords) {
      setCheckingId(kw.id);
      const row = await checkRanking({ data: { keyword_id: kw.id, keyword: kw.keyword } });
      setRankings(prev => [row as Ranking, ...prev.filter(r => r.keyword_id !== kw.id)]);
      setCheckingId(null);
    }
    setLastEvent({ type: "check_all_rankings", status: `Checked ${keywords.length} keywords`, time: new Date().toLocaleString() });
  }

  async function handleRunCycle() {
    setRunningCycle(true);
    setCycleLog([]);
    const log = (msg: string) => setCycleLog(prev => [...prev, msg]);
    log("🔍 Checking keyword rankings...");
    for (const kw of keywords) {
      log(`  → ${kw.keyword}`);
      const row = await checkRanking({ data: { keyword_id: kw.id, keyword: kw.keyword } });
      setRankings(prev => [row as Ranking, ...prev.filter(r => r.keyword_id !== kw.id)]);
    }
    log("🕷️ Running site audit...");
    const aud = await runSiteAudit();
    setAudit(aud as Audit);
    log("✅ SEO cycle complete!");
    setLastEvent({ type: "full_seo_cycle", status: `${keywords.length} keywords + audit complete`, time: new Date().toLocaleString() });
    setRunningCycle(false);
  }

  async function handleRunAudit() {
    setAuditRunning(true);
    const aud = await runSiteAudit();
    setAudit(aud as Audit);
    setLastEvent({ type: "site_audit", status: `Score: ${(aud as Audit).score}/100`, time: new Date().toLocaleString() });
    setAuditRunning(false);
  }

  async function handlePingSite() {
    setPinging(true);
    const result = await pingSite();
    setLastEvent({ type: "site_ping", status: `HTTP: ${result.status} · ${result.ms}ms`, time: new Date().toLocaleString() });
    setPinging(false);
  }


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
        <div className="flex-1 grid lg:grid-cols-2">
          <div className="relative flex flex-col justify-between p-10 lg:p-14 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <img src="https://kejgjwvesmlaorviofyl.supabase.co/storage/v1/object/public/media/2023/09/cropped-Jblogify-1.png" alt="BlogiFy" className="h-10 w-10 object-contain" onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                <div>
                  <p className="font-display font-bold text-base text-white">BlogiFy</p>
                  <p className="text-[10px] font-mono tracking-widest text-brand uppercase">SEO Intelligence · Admin</p>
                </div>
              </div>
            </div>
            <div className="relative z-10 my-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 mb-6">
                <span className="size-1.5 rounded-full bg-brand animate-pulse" />
                <span className="text-xs font-mono text-brand tracking-wider">SEO COMMAND CENTER</span>
              </div>
              <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
                SEO control for<br /><span className="text-gradient">jalalnasser.com</span>
              </h1>
              <p className="text-muted-foreground max-w-sm leading-relaxed">Monitor keyword rankings, audit your site, and run automated SEO cycles targeting the US market.</p>
            </div>
            <div className="relative z-10 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-green-400" />
              <span className="font-semibold text-foreground">BlogiFy</span>
              <span>·</span>
              <span>US SEO Engine · Admin only</span>
            </div>
          </div>
          <div className="flex items-center justify-center p-8 lg:p-14 bg-surface/20">
            <div className="w-full max-w-md">
              <div className="surface-card rounded-2xl border border-border p-8 shadow-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 mb-6">
                  <Shield className="size-3 text-brand" />
                  <span className="text-xs font-mono text-brand tracking-wider">SECURE ADMIN ACCESS</span>
                </div>
                <h2 className="font-display text-2xl font-bold mb-1">Sign in to SEO Dashboard</h2>
                <p className="text-sm text-muted-foreground mb-6">Admin email, password, and verification answer required.</p>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email</label>
                    <input type="email" required value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" className="w-full rounded-lg border border-border bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Password</label>
                    <input type="password" required value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" className="w-full rounded-lg border border-border bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Simple verification</label>
                      <button type="button" onClick={() => { const a = Math.floor(Math.random()*9)+1; const b = Math.floor(Math.random()*9)+1; setMathChallenge({a,b,answer:String(a+b)}); setMathAnswer(""); }} className="text-xs text-brand hover:underline flex items-center gap-1">
                        <RefreshCw className="size-3" /> New question
                      </button>
                    </div>
                    <div className="rounded-lg border border-border bg-background/30 px-4 py-2.5 text-sm font-mono text-muted-foreground">What is {mathChallenge.a} + {mathChallenge.b}?</div>
                    <input type="text" value={mathAnswer} onChange={e => setMathAnswer(e.target.value)} placeholder="Your answer" inputMode="numeric" className="w-full rounded-lg border border-border bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors" />
                  </div>
                  {loginError && <div className="flex items-center gap-2 text-xs text-red-400"><XCircle className="size-3.5 shrink-0" /> {loginError}</div>}
                  <button type="submit" disabled={loggingIn} className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                    {loggingIn ? <><Loader2 className="size-4 animate-spin" /> Signing in…</> : "Sign in"}
                  </button>
                </form>
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/50 bg-background/20 p-3 text-xs text-muted-foreground">
                  <Shield className="size-3.5 shrink-0 mt-0.5 text-brand" />
                  Access is restricted to authorised admins only.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Post-login helpers ──
  function RankBadge({ pos }: { pos: number | null }) {
    if (pos === null) return <span className="rounded px-2 py-0.5 text-xs font-mono bg-gray-100 text-gray-500">—</span>;
    const cls = pos <= 3 ? "bg-green-100 text-green-700" : pos <= 10 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
    return <span className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${cls}`}>#{pos}</span>;
  }

  const selectedKw = keywords.find(k => k.id === selectedKwId) ?? null;
  const filteredKws = keywords.filter(k => k.keyword.toLowerCase().includes(filterText.toLowerCase()));
  const latestRankMap = new Map(keywords.map(k => [k.id, rankings.find(r => r.keyword_id === k.id) ?? null]));
  const allRankingsForSelected = selectedKwId ? rankings.filter(r => r.keyword_id === selectedKwId) : [];
  const lastChecked = rankings.length > 0 ? new Date(rankings[0].checked_at).toLocaleDateString() : "Never";
  const top10Count = Array.from(latestRankMap.values()).filter(r => r?.position != null && r.position <= 10).length;
  const top20Count = Array.from(latestRankMap.values()).filter(r => r?.position != null && r.position > 10 && r.position <= 20).length;
  const notRankedCount = Array.from(latestRankMap.values()).filter(r => !r?.position).length;

  const navItems = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
    { id: "seo-summary" as const, label: "SEO Summary", icon: BarChart3 },
    { id: "rankings" as const, label: "Rankings", icon: TrendingUp },
    { id: "audit" as const, label: "Site Audit", icon: Shield },
    { id: "connection-guide" as const, label: "Connection Guide", icon: Info },
    { id: "settings" as const, label: "Settings", icon: Settings2 },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f8fafc" }}>

      {/* SIDEBAR */}
      <aside className="w-52 flex-shrink-0 flex flex-col border-r border-slate-800" style={{ backgroundColor: "#0f172a" }}>
        <div className="px-4 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <img src="https://kejgjwvesmlaorviofyl.supabase.co/storage/v1/object/public/media/2023/09/cropped-Jblogify-1.png" alt="BlogiFy" className="h-8 w-8 object-contain flex-shrink-0" onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <div>
              <p className="text-white font-bold text-sm leading-none">BlogiFy</p>
              <p className="text-slate-400 text-xs mt-0.5">SEO Dashboard</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setNavSection(id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors text-left ${navSection === id ? "text-white" : "text-slate-400 hover:text-white"}`} style={navSection === id ? { backgroundColor: "#1e3a5f" } : {}}>
              <Icon className="size-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        <div className="px-2 py-3 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm text-red-400 hover:text-red-300 transition-colors">
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">SEO Engine Console</h1>
            <p className="text-sm text-gray-500">Target keyword workflow · jalalnasser.com · US Market</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Status as of {statusTime}</span>
            <button onClick={loadData} className="flex items-center gap-1.5 border border-gray-200 rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <RefreshCw className="size-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="px-6 py-4 flex gap-4 flex-shrink-0 border-b border-gray-100 bg-white">
          <div className="flex-1 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Firecrawl</p>
            <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Connected</span>
            <p className="text-sm text-gray-500 mt-1">Last checked: {lastChecked}</p>
          </div>
          <div className="flex-1 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Keywords</p>
            <p className="text-2xl font-bold text-gray-900">{keywords.length}</p>
            <p className="text-sm text-gray-500">{keywords.length} active</p>
          </div>
          <div className="flex-1 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Last Ranking</p>
            <p className="text-lg font-semibold text-gray-900">{lastChecked}</p>
            <p className="text-sm text-gray-500">Top10: {top10Count} · Top20: {top20Count} · Not ranked: {notRankedCount}</p>
          </div>
          <div className="flex-1 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Site Score</p>
            {audit ? (
              <>
                <p className={`text-2xl font-bold ${audit.score >= 70 ? "text-green-600" : audit.score >= 50 ? "text-amber-600" : "text-red-600"}`}>{audit.score}<span className="text-sm font-normal text-gray-400">/100</span></p>
                <p className="text-sm text-gray-500">{(audit.issues as unknown[]).length} issues · {new Date(audit.checked_at).toLocaleDateString()}</p>
              </>
            ) : (
              <><p className="text-2xl font-bold text-gray-300">—</p><p className="text-sm text-gray-400">No audit yet</p></>
            )}
          </div>
        </div>

        {/* Section content — changes based on nav */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── OVERVIEW (default) ── keyword management two-panel */}
          {navSection === "overview" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Operations panel */}
              <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Operations</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handlePingSite} disabled={pinging} className="flex items-center gap-1.5 border border-gray-200 rounded px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-colors">
                    {pinging ? <Loader2 className="size-3.5 animate-spin" /> : <Globe className="size-3.5" />}
                    Ping Site
                  </button>
                  <button onClick={handleCheckAll} disabled={runningCycle || keywords.length === 0} className="flex items-center gap-1.5 border border-gray-200 rounded px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-colors">
                    {checkingId !== null ? <Loader2 className="size-3.5 animate-spin" /> : <TrendingUp className="size-3.5" />}
                    Check All Rankings
                  </button>
                  <button onClick={handleRunAudit} disabled={auditRunning} className="flex items-center gap-1.5 border border-gray-200 rounded px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-colors">
                    {auditRunning ? <Loader2 className="size-3.5 animate-spin" /> : <Shield className="size-3.5" />}
                    Run Site Audit
                  </button>
                  <button onClick={handleRunCycle} disabled={runningCycle || keywords.length === 0} className="flex items-center gap-1.5 bg-slate-900 text-white rounded px-3 py-2 text-xs font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors">
                    {runningCycle ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                    Run Full SEO Cycle
                  </button>
                  <button onClick={loadData} className="flex items-center gap-1.5 border border-gray-200 rounded px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                    <RefreshCw className="size-3.5" />
                    Refresh Data
                  </button>
                </div>
                {cycleLog.length > 0 && (
                  <div className="mt-3 bg-gray-50 rounded text-xs font-mono px-3 py-2 max-h-24 overflow-y-auto space-y-0.5 text-gray-600">
                    {cycleLog.map((l, i) => <p key={i}>{l}</p>)}
                  </div>
                )}
                {lastEvent && (
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
                    <span className="font-medium text-gray-700">Last event:</span>
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{lastEvent.type}</span>
                    <span>{lastEvent.status}</span>
                    <span className="ml-auto text-gray-400">{lastEvent.time}</span>
                  </div>
                )}
              </div>

              {/* Two-panel */}
              <div className="flex flex-1 overflow-hidden">
              {/* LEFT PANEL */}
              <div className="w-80 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <ListFilter className="size-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-800">Target Keywords</span>
                </div>
                <div className="px-4 py-3 border-b border-gray-100">
                  <form onSubmit={handleAddKeyword} className="space-y-2">
                    <input value={newKw.keyword} onChange={e => setNewKw(p => ({ ...p, keyword: e.target.value }))} placeholder="Keyword" className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400" />
                    <input value={newKw.target_url} onChange={e => setNewKw(p => ({ ...p, target_url: e.target.value }))} placeholder="Target URL (optional)" className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400" />
                    <button type="submit" disabled={addingKw || !newKw.keyword} className="w-full bg-slate-900 text-white rounded py-2 text-sm hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5">
                      {addingKw ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                      + Add Keyword
                    </button>
                  </form>
                </div>
                <div className="px-4 py-3 border-b border-gray-100 grid grid-cols-2 gap-2">
                  <button onClick={handleCheckAll} disabled={runningCycle || keywords.length === 0} className="border border-gray-200 rounded py-2 px-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">Check All Rankings</button>
                  <button onClick={handleRunCycle} disabled={runningCycle || keywords.length === 0} className="border border-gray-200 rounded py-2 px-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-1">
                    {runningCycle ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
                    Run SEO Cycle
                  </button>
                </div>
                {cycleLog.length > 0 && (
                  <div className="mx-4 my-2 bg-gray-50 rounded text-xs font-mono px-3 py-2 max-h-32 overflow-y-auto space-y-0.5 text-gray-600">
                    {cycleLog.map((l, i) => <p key={i}>{l}</p>)}
                  </div>
                )}
                <div className="px-4 py-2 border-b border-gray-100">
                  <input value={filterText} onChange={e => setFilterText(e.target.value)} placeholder="Filter keywords..." className="w-full py-1.5 text-sm bg-transparent focus:outline-none text-gray-700 placeholder:text-gray-300" />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredKws.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">No keywords yet — add one above</p>
                  ) : filteredKws.map(kw => {
                    const rank = latestRankMap.get(kw.id);
                    const isSelected = selectedKwId === kw.id;
                    return (
                      <div key={kw.id} onClick={() => setSelectedKwId(isSelected ? null : kw.id)} onMouseEnter={() => setHoveredKwId(kw.id)} onMouseLeave={() => setHoveredKwId(null)} className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors ${isSelected ? "bg-slate-50" : "hover:bg-gray-50"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-800 truncate flex-1">{kw.keyword}</span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <RankBadge pos={rank?.position ?? null} />
                            {hoveredKwId === kw.id && (
                              <button onClick={e => { e.stopPropagation(); handleDeleteKeyword(kw.id); }} className="text-red-400 hover:text-red-300 transition-colors">
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {kw.target_url && <p className="text-xs text-gray-400 truncate mt-0.5">{kw.target_url}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT PANEL */}
              <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "#f8fafc" }}>
                {!selectedKw ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-gray-400">Select a keyword from the left panel to begin.</p>
                  </div>
                ) : (
                  <div>
                    <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">{selectedKw.keyword}</h2>
                        {selectedKw.target_url && (
                          <a href={selectedKw.target_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 flex items-center gap-1 hover:underline mt-0.5">
                            {selectedKw.target_url} <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleCheckRanking(selectedKw)} disabled={checkingId === selectedKw.id} className="border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                          {checkingId === selectedKw.id ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                          Check Ranking
                        </button>
                        <button onClick={() => handleDeleteKeyword(selectedKw.id)} className="border border-red-200 rounded px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1.5">
                          <Trash2 className="size-3" /> Delete
                        </button>
                      </div>
                    </div>
                    <div className="px-6 py-4 grid grid-cols-2 gap-4">
                      {(() => {
                        const latest = latestRankMap.get(selectedKw.id);
                        return (
                          <>
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Current Ranking</p>
                              {latest ? <><RankBadge pos={latest.position} /><p className="text-xs text-gray-400 mt-1">Last checked: {new Date(latest.checked_at).toLocaleDateString()}</p></> : <p className="text-sm text-gray-400">No data yet</p>}
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Target Page</p>
                              {selectedKw.target_url ? <a href={selectedKw.target_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">{selectedKw.target_url}</a> : <p className="text-sm text-gray-400">No URL set</p>}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <div className="px-6 border-b border-gray-200 flex gap-6 bg-white">
                      {(["rankings", "audit", "recommendations"] as const).map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} className={`py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === t ? "border-slate-900 text-slate-900" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                          {t === "rankings" ? "Rankings" : t === "audit" ? "Site Audit" : "Recommendations"}
                        </button>
                      ))}
                    </div>
                    <div className="px-6 py-4">
                      {activeTab === "rankings" && (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          {allRankingsForSelected.length === 0 ? (
                            <p className="text-sm text-gray-400 p-6 text-center">No rankings data yet. Click "Check Ranking" above to start.</p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead className="border-b border-gray-100 bg-gray-50"><tr>
                                <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Date</th>
                                <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Position</th>
                                <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">URL found at</th>
                              </tr></thead>
                              <tbody className="divide-y divide-gray-50">
                                {allRankingsForSelected.map(r => (
                                  <tr key={r.id}>
                                    <td className="px-4 py-2.5 text-gray-500 text-xs">{new Date(r.checked_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-2.5"><RankBadge pos={r.position} /></td>
                                    <td className="px-4 py-2.5 text-xs text-gray-500 truncate max-w-xs">{r.url || "Not ranked"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                      {activeTab === "audit" && (
                        <div className="bg-white border border-gray-200 rounded-lg p-5">
                          {audit ? (
                            <>
                              <div className="flex items-center gap-4 mb-4">
                                <div className={`size-16 rounded-full border-4 grid place-items-center text-xl font-bold ${audit.score >= 70 ? "border-green-400 text-green-600" : audit.score >= 50 ? "border-amber-400 text-amber-600" : "border-red-400 text-red-600"}`}>{audit.score}</div>
                                <div>
                                  <p className="font-semibold text-gray-800">{audit.score >= 70 ? "Good" : audit.score >= 50 ? "Needs Work" : "Critical Issues"}</p>
                                  <p className="text-sm text-gray-500">{(audit.issues as unknown[]).length} issues · {audit.metadata?.pages_crawled ?? 0} pages crawled</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {(audit.issues as Array<{ type: string; severity: string; url: string; detail: string }>).map((issue, i) => (
                                  <div key={i} className={`flex items-start gap-3 rounded-lg p-3 border text-sm ${issue.severity === "high" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                                    <AlertTriangle className={`size-4 mt-0.5 shrink-0 ${issue.severity === "high" ? "text-red-500" : "text-amber-500"}`} />
                                    <div><p className="font-medium text-gray-800">{issue.type}</p><p className="text-xs text-gray-500">{issue.url}</p><p className="text-xs text-gray-500">{issue.detail}</p></div>
                                  </div>
                                ))}
                                {(audit.issues as unknown[]).length === 0 && <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircle className="size-4" /> No issues found!</p>}
                              </div>
                            </>
                          ) : <p className="text-sm text-gray-400 text-center py-8">No audit data yet. Go to Site Audit in the sidebar to run one.</p>}
                        </div>
                      )}
                      {activeTab === "recommendations" && (
                        <div className="bg-white border border-gray-200 rounded-lg p-5">
                          <p className="text-sm text-gray-400 text-center py-8">No recommendations yet. Run Full SEO Cycle to generate recommendations.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
          )}

          {/* ── RANKINGS section ── */}
          {navSection === "rankings" && (
            <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: "#f8fafc" }}>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">All Keyword Rankings — US Market</h2>
                  <button onClick={handleCheckAll} disabled={runningCycle || keywords.length === 0} className="border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                    {runningCycle ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                    Check All Rankings
                  </button>
                </div>
                {keywords.length === 0 ? (
                  <p className="text-sm text-gray-400 p-8 text-center">No keywords added yet. Go to Overview to add keywords.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">Keyword</th>
                        <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">Position</th>
                        <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">Target URL</th>
                        <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">Ranked URL</th>
                        <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">Last Checked</th>
                        <th className="px-6 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {keywords.map(kw => {
                        const rank = latestRankMap.get(kw.id);
                        return (
                          <tr key={kw.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3 font-medium text-gray-800">{kw.keyword}</td>
                            <td className="px-6 py-3"><RankBadge pos={rank?.position ?? null} /></td>
                            <td className="px-6 py-3 text-xs text-gray-500 max-w-xs truncate">{kw.target_url || "—"}</td>
                            <td className="px-6 py-3 text-xs text-gray-500 max-w-xs truncate">{rank?.url || "Not ranked"}</td>
                            <td className="px-6 py-3 text-xs text-gray-400">{rank ? new Date(rank.checked_at).toLocaleDateString() : "Never"}</td>
                            <td className="px-6 py-3">
                              <button onClick={() => handleCheckRanking(kw)} disabled={checkingId === kw.id} className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-1">
                                {checkingId === kw.id ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                                Check
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── SITE AUDIT section ── */}
          {navSection === "audit" && (
            <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: "#f8fafc" }}>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Site Audit — jalalnasser.com</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Crawls your site and checks for SEO issues</p>
                  </div>
                  <button onClick={handleRunAudit} disabled={auditRunning} className="bg-slate-900 text-white rounded px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2">
                    {auditRunning ? <><Loader2 className="size-4 animate-spin" /> Running audit…</> : <><Globe className="size-4" /> Run Site Audit</>}
                  </button>
                </div>
                {audit ? (
                  <>
                    <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className={`size-20 rounded-full border-4 grid place-items-center text-2xl font-bold flex-shrink-0 ${audit.score >= 70 ? "border-green-400 text-green-600" : audit.score >= 50 ? "border-amber-400 text-amber-600" : "border-red-400 text-red-600"}`}>{audit.score}</div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{audit.score >= 70 ? "Good" : audit.score >= 50 ? "Needs Work" : "Critical Issues"}</p>
                        <p className="text-sm text-gray-500">{(audit.issues as unknown[]).length} issues found · {audit.metadata?.pages_crawled ?? 0} pages crawled</p>
                        <p className="text-xs text-gray-400 mt-0.5">Last run: {new Date(audit.checked_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {(audit.issues as Array<{ type: string; severity: string; url: string; detail: string }>).length === 0 ? (
                        <div className="flex items-center gap-2 text-green-600 p-4"><CheckCircle className="size-5" /><span>No issues found — site looks healthy!</span></div>
                      ) : (audit.issues as Array<{ type: string; severity: string; url: string; detail: string }>).map((issue, i) => (
                        <div key={i} className={`flex items-start gap-3 rounded-lg p-4 border ${issue.severity === "high" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                          <AlertTriangle className={`size-4 mt-0.5 shrink-0 ${issue.severity === "high" ? "text-red-500" : "text-amber-500"}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-medium text-gray-800">{issue.type}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${issue.severity === "high" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>{issue.severity}</span>
                            </div>
                            <p className="text-xs text-gray-500">{issue.url}</p>
                            <p className="text-xs text-gray-500">{issue.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 text-gray-400">
                    <Globe className="size-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No audit data yet.</p>
                    <p className="text-xs mt-1">Click "Run Site Audit" above to crawl jalalnasser.com</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SETTINGS section ── */}
          {navSection === "settings" && (
            <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: "#f8fafc" }}>
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Dashboard Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Target Site</p>
                        <p className="text-xs text-gray-500">The domain being tracked</p>
                      </div>
                      <span className="text-sm text-gray-700 font-mono bg-gray-100 px-3 py-1 rounded">jalalnasser.com</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Search Market</p>
                        <p className="text-xs text-gray-500">Country for ranking checks</p>
                      </div>
                      <span className="text-sm text-gray-700 font-mono bg-gray-100 px-3 py-1 rounded">🇺🇸 US</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Firecrawl API</p>
                        <p className="text-xs text-gray-500">Used for ranking checks and site crawls</p>
                      </div>
                      <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Connected</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Total Keywords Tracked</p>
                        <p className="text-xs text-gray-500">Keywords in the database</p>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{keywords.length}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Session</p>
                        <p className="text-xs text-gray-500">Current admin session</p>
                      </div>
                      <button onClick={handleLogout} className="text-xs text-red-500 border border-red-200 rounded px-3 py-1.5 hover:bg-red-50 transition-colors flex items-center gap-1.5">
                        <LogOut className="size-3" /> Sign out
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Danger Zone</h3>
                  <p className="text-sm text-gray-500 mb-4">Actions that affect all SEO data.</p>
                  <button onClick={handleRunCycle} disabled={runningCycle || keywords.length === 0} className="bg-slate-900 text-white rounded px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2">
                    {runningCycle ? <><Loader2 className="size-4 animate-spin" /> Running…</> : <><Play className="size-4" /> Run Full SEO Cycle</>}
                  </button>
                  {cycleLog.length > 0 && (
                    <div className="mt-3 bg-gray-50 rounded text-xs font-mono px-3 py-2 max-h-40 overflow-y-auto space-y-0.5 text-gray-600">
                      {cycleLog.map((l, i) => <p key={i}>{l}</p>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


