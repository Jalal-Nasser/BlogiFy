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
    if (pos === null) return <span className="text-xs text-muted-foreground font-mono">—</span>;
    const color = pos <= 3 ? "text-green-400" : pos <= 10 ? "text-yellow-400" : "text-red-400";
    return <span className={`font-mono font-bold text-sm ${color}`}>#{pos}</span>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gradient-to-br from-brand to-accent grid place-items-center">
              <BarChart3 className="size-4 text-white" />
            </div>
            <span className="font-display font-bold">SEO Engine</span>
            <span className="text-xs bg-brand/10 text-brand rounded-full px-2 py-0.5 font-mono">US Market</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunCycle}
              disabled={runningCycle || keywords.length === 0}
              className="flex items-center gap-2 rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-50 transition-colors"
            >
              {runningCycle ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Run Full SEO Cycle
            </button>
            <button onClick={handleLogout} className="size-8 grid place-items-center rounded-lg border border-border hover:border-brand hover:text-brand transition-colors">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 grid lg:grid-cols-4 gap-6">
        {/* Left: Keyword list */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="surface-card rounded-xl border border-border p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Search className="size-3.5" /> Target Keywords
            </h2>
            <form onSubmit={handleAddKeyword} className="space-y-2 mb-3">
              <input
                value={newKw.keyword}
                onChange={e => setNewKw(p => ({ ...p, keyword: e.target.value }))}
                placeholder="Keyword"
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand/40 transition-colors"
              />
              <input
                value={newKw.target_url}
                onChange={e => setNewKw(p => ({ ...p, target_url: e.target.value }))}
                placeholder="Page URL (optional)"
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand/40 transition-colors"
              />
              <button
                type="submit" disabled={addingKw || !newKw.keyword}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 text-brand text-xs font-semibold py-2 hover:bg-brand/20 disabled:opacity-50 transition-colors"
              >
                {addingKw ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                Add Keyword
              </button>
            </form>

            <div className="space-y-1">
              {keywords.map(kw => {
                const rank = rankings.find(r => r.keyword_id === kw.id);
                return (
                  <div
                    key={kw.id}
                    onClick={() => setSelectedKw(selectedKw?.id === kw.id ? null : kw)}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${selectedKw?.id === kw.id ? "bg-brand/10 border border-brand/30" : "hover:bg-white/5 border border-transparent"}`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{kw.keyword}</p>
                      {kw.target_url && <p className="text-[10px] text-muted-foreground truncate">{kw.target_url}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <RankBadge pos={rank?.position ?? null} />
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteKeyword(kw.id); }}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {keywords.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No keywords yet</p>
              )}
            </div>
          </div>
        </aside>

        {/* Right: main panel */}
        <main className="lg:col-span-3 space-y-4">
          {/* Cycle log */}
          {cycleLog.length > 0 && (
            <div className="surface-card rounded-xl border border-brand/20 p-4">
              <p className="text-xs font-semibold text-brand mb-2">SEO Cycle Running…</p>
              <div className="font-mono text-xs space-y-0.5 text-muted-foreground">
                {cycleLog.map((l, i) => <p key={i}>{l}</p>)}
              </div>
            </div>
          )}

          {/* Selected keyword detail */}
          {selectedKw && (
            <div className="surface-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold">{selectedKw.keyword}</h3>
                  {selectedKw.target_url && <p className="text-xs text-muted-foreground mt-0.5">{selectedKw.target_url}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-500/10 text-blue-400 rounded-full px-2 py-0.5">🇺🇸 US</span>
                  <button
                    onClick={() => handleCheckRanking(selectedKw)}
                    disabled={checkingId === selectedKw.id}
                    className="flex items-center gap-1.5 rounded-lg bg-brand/10 border border-brand/30 text-brand text-xs font-semibold px-3 py-1.5 hover:bg-brand/20 disabled:opacity-50 transition-colors"
                  >
                    {checkingId === selectedKw.id ? <Loader2 className="size-3 animate-spin" /> : <Shield className="size-3" />}
                    Check Ranking
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {(() => {
                  const latest = rankings.find(r => r.keyword_id === selectedKw.id);
                  return (
                    <>
                      <div className="surface-card rounded-lg border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Top 3 Ranking</p>
                        {latest ? (
                          latest.position && latest.position <= 3
                            ? <p className="text-2xl font-bold text-green-400">#{latest.position}</p>
                            : <p className="text-sm text-muted-foreground">Not in top 3</p>
                        ) : <p className="text-sm text-muted-foreground">No data yet</p>}
                      </div>
                      <div className="surface-card rounded-lg border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Position</p>
                        {latest
                          ? <RankBadge pos={latest.position} />
                          : <p className="text-sm text-muted-foreground">—</p>}
                        {latest && <p className="text-[10px] text-muted-foreground mt-1">{latest.source}</p>}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Ranking history */}
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Ranking History</h4>
              <div className="space-y-1">
                {allRankingsForSelected.length === 0
                  ? <p className="text-xs text-muted-foreground">No rankings checked yet. Click "Check Ranking" above.</p>
                  : allRankingsForSelected.slice(0, 10).map(r => (
                    <div key={r.id} className="flex items-center gap-3 text-xs py-1.5 border-b border-border/40">
                      <RankBadge pos={r.position} />
                      <span className="text-muted-foreground truncate flex-1">{r.url || "Not ranked"}</span>
                      <span className="text-muted-foreground shrink-0">{new Date(r.checked_at).toLocaleDateString()}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{r.source}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border">
            {(["rankings", "audit", "keywords"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t === "rankings" ? "Rankings" : t === "audit" ? "Site Audit" : "All Keywords"}
              </button>
            ))}
          </div>

          {/* Rankings tab */}
          {tab === "rankings" && (
            <div className="surface-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold">Keyword Rankings — 🇺🇸 USA (Google)</h3>
                <p className="text-xs text-muted-foreground">Click a keyword on the left to check ranking</p>
              </div>
              <div className="divide-y divide-border">
                {filteredRankings.length === 0
                  ? <p className="text-sm text-muted-foreground p-6 text-center">No keywords added yet</p>
                  : filteredRankings.map(({ kw, rank }) => (
                    <div key={kw.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white/3 transition-colors">
                      <div className="w-8 text-center">
                        <RankBadge pos={rank?.position ?? null} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{kw.keyword}</p>
                        {rank?.url && <p className="text-xs text-muted-foreground truncate">{rank.url}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {rank && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(rank.checked_at).toLocaleDateString()}
                          </span>
                        )}
                        <button
                          onClick={() => handleCheckRanking(kw)}
                          disabled={checkingId === kw.id}
                          className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-brand hover:text-brand disabled:opacity-50 transition-colors"
                        >
                          {checkingId === kw.id ? <Loader2 className="size-3 animate-spin" /> : <Shield className="size-3" />}
                          Check
                        </button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Audit tab */}
          {tab === "audit" && (
            <div className="space-y-4">
              <div className="surface-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display font-semibold">Site Audit — jalalnasser.com</h3>
                    {audit && <p className="text-xs text-muted-foreground mt-0.5">Last run: {new Date(audit.checked_at).toLocaleString()} · {audit.metadata?.pages_crawled ?? 0} pages crawled</p>}
                  </div>
                  <button
                    onClick={handleRunAudit}
                    disabled={auditRunning}
                    className="flex items-center gap-2 rounded-lg bg-brand/10 border border-brand/30 text-brand text-sm font-semibold px-4 py-2 hover:bg-brand/20 disabled:opacity-50 transition-colors"
                  >
                    {auditRunning ? <><Loader2 className="size-4 animate-spin" /> Running…</> : <><Globe className="size-4" /> Run Audit</>}
                  </button>
                </div>

                {audit ? (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`size-20 rounded-full border-4 grid place-items-center text-2xl font-bold ${audit.score >= 80 ? "border-green-400 text-green-400" : audit.score >= 50 ? "border-yellow-400 text-yellow-400" : "border-red-400 text-red-400"}`}>
                        {audit.score}
                      </div>
                      <div>
                        <p className="font-semibold">{audit.score >= 80 ? "Good" : audit.score >= 50 ? "Needs Work" : "Critical Issues"}</p>
                        <p className="text-sm text-muted-foreground">{(audit.issues as Array<unknown>).length} issues found</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(audit.issues as Array<{ type: string; severity: string; url: string; detail: string }>).map((issue, i) => (
                        <div key={i} className={`flex items-start gap-3 rounded-lg p-3 border ${issue.severity === "high" ? "border-red-500/20 bg-red-500/5" : "border-yellow-500/20 bg-yellow-500/5"}`}>
                          <AlertTriangle className={`size-4 mt-0.5 shrink-0 ${issue.severity === "high" ? "text-red-400" : "text-yellow-400"}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{issue.type}</p>
                            <p className="text-xs text-muted-foreground truncate">{issue.url}</p>
                            <p className="text-xs text-muted-foreground">{issue.detail}</p>
                          </div>
                          <span className={`text-xs shrink-0 rounded-full px-2 py-0.5 ${issue.severity === "high" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                            {issue.severity}
                          </span>
                        </div>
                      ))}
                      {(audit.issues as Array<unknown>).length === 0 && (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle className="size-4" /> No issues found — site looks healthy!
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No audit data yet. Click "Run Audit" to crawl your site.</p>
                )}
              </div>
            </div>
          )}

          {/* All keywords tab */}
          {tab === "keywords" && (
            <div className="surface-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-display text-sm font-semibold">All Target Keywords</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-white/3">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Keyword</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Target URL</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Country</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Rank</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {keywords.map(kw => {
                    const rank = rankings.find(r => r.keyword_id === kw.id);
                    return (
                      <tr key={kw.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-4 py-2.5 font-medium">{kw.keyword}</td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{kw.target_url || "—"}</td>
                        <td className="px-4 py-2.5 text-xs">🇺🇸 US</td>
                        <td className="px-4 py-2.5"><RankBadge pos={rank?.position ?? null} /></td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => handleDeleteKeyword(kw.id)} className="text-red-400 hover:text-red-300 transition-colors">
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
