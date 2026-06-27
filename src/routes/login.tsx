import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, FileText, FolderTree, Tags, Users } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Admin Login" }] }),
  component: LoginPage,
});

function randPair() {
  return [Math.floor(Math.random() * 9) + 1, Math.floor(Math.random() * 9) + 1] as const;
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pair, setPair] = useState<readonly [number, number]>(() => randPair());
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  function regenerate() {
    setPair(randPair());
    setAnswer("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (parseInt(answer, 10) !== pair[0] + pair[1]) {
      setError("Incorrect answer, please try again.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "bg-[#0d1117] border border-[#1e2030] rounded-lg px-3 py-2.5 text-sm text-[#e6edf3] w-full focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/30 placeholder-[#8b949e]";

  const stats = [
    { Icon: FileText, label: "POSTS" },
    { Icon: FolderTree, label: "CATEGORIES" },
    { Icon: Tags, label: "TAGS" },
    { Icon: Users, label: "AUTHORS" },
  ];

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col justify-between p-10">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="https://kejgjwvesmlaorviofyl.supabase.co/storage/v1/object/public/media/2023/09/cropped-Jblogify-1.png"
              alt="BlogiFy"
              className="h-10 w-10 object-contain drop-shadow-[0_0_12px_rgba(0,212,255,0.6)]"
            />
            <div>
              <span className="font-bold text-xl text-white">
                Blogi
                <span
                  style={{
                    background: "linear-gradient(135deg,#00d4ff,#8b5cf6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Fy
                </span>
              </span>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#8b949e]">
                jalalnasser.com
              </div>
            </div>
          </div>

          <div className="mt-10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs uppercase tracking-widest px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            ✦ BLOG CONTROL
          </div>

          <h1
            style={{ fontFamily: "'Space Grotesk',sans-serif" }}
            className="mt-6 text-4xl font-bold leading-tight text-[#e6edf3]"
          >
            Admin Console for{" "}
            <span
              style={{
                background: "linear-gradient(135deg,#00d4ff,#8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              IT tech blog
              <br />
              content
            </span>
          </h1>

          <p className="mt-4 text-sm text-[#8b949e] max-w-sm leading-relaxed">
            Manage posts, categories, SEO audits, authors, and media from one secure platform.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {["Posts Management", "SEO Audit", "Content CMS"].map((l) => (
              <span
                key={l}
                className="border border-[#1e2030] rounded-full px-3 py-1 text-xs text-[#8b949e]"
              >
                {l}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ Icon, label }) => (
            <div
              key={label}
              className="bg-[#13141f] border border-[#1e2030] rounded-xl p-4 flex flex-col gap-2"
            >
              <Icon className="size-4 text-[#8b949e]" />
              <div className="text-xs uppercase tracking-widest text-[#8b949e]">{label}</div>
              <div className="h-0.5 w-full bg-[#1e2030] rounded-full">
                <div className="h-0.5 bg-[#00d4ff] rounded-full" style={{ width: "65%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex items-center justify-center p-6 pb-10 min-h-screen">
        <div className="bg-[#13141f] border border-[#1e2030] rounded-2xl p-8 w-full max-w-md shadow-[0_0_0_1px_rgb(0_212_255_/_0.08),0_24px_48px_-12px_rgb(0_0_0_/_0.8)]">
          <div className="inline-flex items-center gap-2 border border-[#1e2030] rounded-full px-3 py-1 text-xs text-[#8b949e] mb-6">
            <Lock size={12} /> SECURE ADMIN ACCESS
          </div>

          <h2 className="text-2xl font-bold text-[#e6edf3]">Sign in to BlogiFy Admin</h2>
          <p className="text-sm text-[#8b949e] mt-1 mb-6">
            Sign in with your admin email and password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#e6edf3] mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e6edf3] mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="mt-4">
              <div className="flex items-center">
                <span className="text-sm font-medium text-[#e6edf3]">Simple verification</span>
                <button
                  type="button"
                  onClick={regenerate}
                  className="text-xs text-[#8b949e] hover:text-[#00d4ff] ml-auto"
                >
                  ↺ New question
                </button>
              </div>
              <div className={`${inputCls} mt-1 block`}>
                What is {pair[0]} + {pair[1]}?
              </div>
              <input
                type="text"
                required
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className={`${inputCls} mt-2`}
                placeholder="Your answer"
              />
            </div>

            {error && <p className="text-sm text-[#f85149] mt-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-[#00d4ff] hover:bg-[#00bfe8] text-[#0a0a0f] font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
            >
              {loading && <Loader2 className="animate-spin h-4 w-4" />}
              Sign In
            </button>
          </form>

          <div className="mt-6 bg-[#0d1117] border border-[#1e2030] rounded-lg p-3 flex items-start gap-2 text-xs text-[#8b949e]">
            <Lock size={12} className="mt-0.5 shrink-0 text-[#00d4ff]" />
            <span>
              BlogiFy management data is protected. All access is logged and restricted to
              authorised admins.
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <div className="fixed bottom-0 inset-x-0 border-t border-[#1e2030] bg-[#0a0a0f]/80 backdrop-blur-md px-6 py-2 flex items-center justify-between text-xs text-[#8b949e]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            BlogiFy
          </span>
          <span>
            Scope: <span className="text-white">IT Blog Admin</span>
          </span>
          <span>
            Access: <span className="text-white">Admin only</span>
          </span>
        </div>
        <div className="hidden md:block">
          jalalnasser.com · Internal platform · Access restricted to authorised admins
        </div>
      </div>
    </div>
  );
}
