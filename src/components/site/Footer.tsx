import { Link } from "@tanstack/react-router";
import { Terminal, Github, Twitter, Rss } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-accent text-brand-foreground">
              <Terminal className="size-4" />
            </div>
            <span className="font-display text-lg font-bold">Blogi<span className="text-gradient">Fy</span></span>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Hands-on tutorials and analysis on Linux, security, self-hosting, WordPress, and the modern IT stack. Written by Jalal Nasser.
          </p>
          <div className="mt-4 flex gap-2">
            <a href="#" aria-label="Twitter" className="size-9 grid place-items-center rounded-md border border-border hover:border-brand hover:text-brand transition-colors"><Twitter className="size-4" /></a>
            <a href="#" aria-label="GitHub" className="size-9 grid place-items-center rounded-md border border-border hover:border-brand hover:text-brand transition-colors"><Github className="size-4" /></a>
            <a href="#" aria-label="RSS" className="size-9 grid place-items-center rounded-md border border-border hover:border-brand hover:text-brand transition-colors"><Rss className="size-4" /></a>
          </div>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/category/$slug" params={{ slug: "linux" }} className="hover:text-foreground">Linux</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "security" }} className="hover:text-foreground">Security</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "wordpress" }} className="hover:text-foreground">WordPress</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "crypto" }} className="hover:text-foreground">Crypto</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider">BlogiFy</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-foreground">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 lg:px-6 py-5 flex flex-col gap-2 sm:flex-row sm:justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} BlogiFy — Jalal Nasser. All rights reserved.</span>
          <span className="font-mono">jalalnasser.com</span>
        </div>
      </div>
    </footer>
  );
}
