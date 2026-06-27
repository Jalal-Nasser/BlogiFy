import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/queries";



export function Header() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const topCats = categories
    .filter((c) => !c.parent_slug)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 12);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    navigate({ to: "/search", search: { q: q.trim() } });
    setOpen(false);
  }

  return (
    <header className={`sticky top-0 z-40 border-b border-border/50 backdrop-blur-xl transition-colors ${scrolled ? "bg-background/85" : "bg-background/40"}`}>
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex h-16 items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <img src="https://gwynqitgepkfzzenlfyu.supabase.co/storage/v1/object/public/media/2023/09/cropped-Jblogify-1.png" alt="BlogiFy" className="h-10 w-10 object-contain drop-shadow-[0_0_12px_rgba(0,212,255,0.6)]" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <div className="leading-none">
              <span className="font-display text-lg font-bold tracking-tight text-white text-glow">Blogi<span className="text-gradient">Fy</span></span>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">jalalnasser.com</div>
            </div>
          </Link>

          <form onSubmit={onSearch} className="ml-auto hidden md:flex items-center w-full max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search tutorials, tools, topics…"
                className="w-full rounded-full border border-border bg-input/60 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </form>

          <nav className="ml-auto hidden lg:flex items-center gap-1">
            <Link to="/about" className="nav-underline px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/contact" className="nav-underline px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          </nav>

          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>

        {/* Category strip */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 -mb-px scrollbar-none">
          {topCats.map((c) => (
            <Link
              key={c.id}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
              activeProps={{ className: "shrink-0 rounded-full px-3 py-1 text-xs font-medium text-brand bg-brand/10" }}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-3">
            <form onSubmit={onSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search…"
                  className="w-full rounded-full border border-border bg-input py-2 pl-9 pr-4 text-sm outline-none focus:border-brand"
                />
              </div>
            </form>
            <div className="flex flex-col">
              <Link to="/about" onClick={() => setOpen(false)} className="py-2 text-sm">About</Link>
              <Link to="/contact" onClick={() => setOpen(false)} className="py-2 text-sm">Contact</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
