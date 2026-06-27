import { Link } from "@tanstack/react-router";
import { Terminal, Github, Linkedin, Rss } from "lucide-react";

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function BehanceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7.443 5.35c.639 0 1.23.05 1.77.198.54.099.99.297 1.38.544.39.247.69.594.9 1.04.21.445.315.99.315 1.584 0 .693-.165 1.288-.494 1.733-.33.446-.81.792-1.44 1.04.87.247 1.515.693 1.935 1.337.42.644.63 1.436.63 2.327 0 .693-.135 1.288-.405 1.782-.27.495-.63.89-1.08 1.188-.45.297-.96.495-1.545.594-.585.1-1.17.148-1.77.148H1.5V5.35h5.943zm-.33 5.918c.525 0 .96-.124 1.305-.37.345-.248.51-.644.51-1.189 0-.297-.054-.544-.165-.742-.11-.198-.255-.346-.435-.445-.18-.099-.375-.165-.6-.198-.225-.033-.45-.05-.675-.05H4.32v3.019h2.793v-.025zm.15 6.166c.255 0 .495-.025.735-.074.24-.05.45-.124.63-.248.18-.123.33-.297.435-.52.105-.222.165-.519.165-.866 0-.693-.195-1.188-.585-1.485-.39-.297-.9-.445-1.53-.445H4.32v3.638h2.943zM20.505 15.96c.39.396.96.594 1.71.594.525 0 .99-.133 1.38-.396.39-.264.63-.545.72-.842h2.685c-.435 1.337-1.095 2.277-1.98 2.822-.885.544-1.965.841-3.24.841-.87 0-1.65-.148-2.34-.445-.69-.297-1.275-.693-1.755-1.239-.48-.544-.855-1.188-1.11-1.93-.255-.743-.375-1.535-.375-2.377 0-.842.12-1.634.375-2.376.255-.742.615-1.387 1.095-1.931.48-.545 1.065-.99 1.755-1.288.69-.297 1.455-.445 2.31-.445.96 0 1.785.198 2.49.594.705.396 1.275.94 1.71 1.634.435.693.735 1.485.9 2.376.105.544.135 1.139.12 1.733h-8.01c.06.941.33 1.634.72 2.03l-.16-.125zm3.015-5.423c-.315-.346-.81-.52-1.47-.52-.42 0-.78.075-1.065.223-.285.149-.51.347-.675.57-.165.222-.285.47-.345.717-.06.248-.09.47-.09.668h4.275c-.12-.742-.315-1.312-.63-1.658z"/>
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-glow-top mt-24 border-t border-border/40 bg-surface/30 backdrop-blur-sm">
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
            <a href="https://x.com/jalalnasser" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter"
               className="size-9 grid place-items-center rounded-md border border-border hover:border-brand hover:text-brand transition-colors">
              <XIcon className="size-4" />
            </a>
            <a href="https://github.com/Jalal-Nasser" target="_blank" rel="noopener noreferrer" aria-label="GitHub"
               className="size-9 grid place-items-center rounded-md border border-border hover:border-brand hover:text-brand transition-colors">
              <Github className="size-4" />
            </a>
            <a href="https://www.linkedin.com/in/jalalnasser" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
               className="size-9 grid place-items-center rounded-md border border-border hover:border-brand hover:text-brand transition-colors">
              <Linkedin className="size-4" />
            </a>
            <a href="https://www.behance.net/jalalnasser" target="_blank" rel="noopener noreferrer" aria-label="Behance"
               className="size-9 grid place-items-center rounded-md border border-border hover:border-brand hover:text-brand transition-colors">
              <BehanceIcon className="size-4" />
            </a>
            <a href="/sitemap.xml" aria-label="RSS / Sitemap"
               className="size-9 grid place-items-center rounded-md border border-border hover:border-brand hover:text-brand transition-colors">
              <Rss className="size-4" />
            </a>
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
