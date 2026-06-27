import { createFileRoute, Link } from "@tanstack/react-router";
import { Terminal, Code2, Shield, Server, Globe, TrendingUp, ExternalLink } from "lucide-react";

const BASE = "https://jalalnasser.com";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Jalal Nasser — BlogiFy" },
      { name: "description", content: "Full-Stack & AI Developer, sysadmin, and blogger. Founder of BlogiFy — hands-on tutorials on Linux, security, WordPress, and the modern tech stack." },
      { property: "og:title", content: "About Jalal Nasser — Founder of BlogiFy" },
      { property: "og:description", content: "Meet Jalal Nasser — Full-Stack & AI Developer behind BlogiFy. Skills, services, and the story behind the blog." },
      { property: "og:url", content: "https://jalalnasser.com/about" },
      { property: "og:image", content: "https://jalalnasser.com/jalal-nasser.jpg" },
      { name: "twitter:title", content: "About Jalal Nasser — Founder of BlogiFy" },
      { name: "twitter:description", content: "Meet Jalal Nasser — Full-Stack & AI Developer behind BlogiFy." },
      { name: "twitter:image", content: "https://jalalnasser.com/jalal-nasser.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://jalalnasser.com/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          "name": "Jalal Nasser",
          "url": `${BASE}/about`,
          "image": `${BASE}/jalal-nasser.jpg`,
          "jobTitle": "Full-Stack & AI Developer, Sysadmin, Blogger",
          "worksFor": {
            "@type": "Organization",
            "name": "BlogiFy",
            "url": BASE,
          },
          "sameAs": [
            "https://x.com/jalalnasser",
            "https://github.com/Jalal-Nasser",
            "https://www.linkedin.com/in/jalalnasser",
            "https://www.behance.net/jalalnasser",
            "https://www.peopleperhour.com/hire/1648438511/2784711",
          ],
        }),
      },
    ],
  }),
  component: About,
});

const SKILLS = [
  { icon: Code2, label: "Full-Stack Development", desc: "React, Node.js, TypeScript, Lovable, Vercel, Supabase — building modern web apps and SaaS products from scratch." },
  { icon: Terminal, label: "Linux & Self-Hosting", desc: "Server administration, VPS hardening, Nginx, Docker, and self-hosted stacks. If it runs on a terminal, I enjoy it." },
  { icon: Shield, label: "Cybersecurity", desc: "Penetration testing concepts, WordPress security, SSL/TLS, firewall configuration, and hardening guides." },
  { icon: Server, label: "WordPress & CMS", desc: "Custom theme development, plugin configuration, migration, performance tuning, and WooCommerce integrations." },
  { icon: Globe, label: "Crypto & Web3", desc: "Wallets, DeFi concepts, staking, and practical guides for navigating the blockchain ecosystem safely." },
  { icon: TrendingUp, label: "Digital Marketing", desc: "SEO, Google Analytics, AdSense optimisation, and content strategy for tech blogs and SaaS products." },
];

const SERVICES = [
  { title: "Build any AI WebApp", subtitle: "Lovable · Vercel · Replit · Bolt", price: "From $185", href: "https://www.peopleperhour.com/hire/1648438511/2784711" },
  { title: "Modern MVP & SaaS System", subtitle: "Full AI Stack", price: "From $900", href: "https://www.peopleperhour.com/hire/1648438511/2784711" },
];

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 lg:px-6 py-16">

      {/* Hero */}
      <section className="flex flex-col sm:flex-row items-start gap-8 mb-16">
        <div className="size-24 shrink-0 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(109,31,204,0.4)] ring-2 ring-brand/30">
          <img
            src="/jalal-nasser.jpg"
            alt="Jalal Nasser"
            className="size-full object-cover object-top"
          />
        </div>
        <div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">
            Jalal Nasser
          </h1>
          <p className="mt-2 text-brand font-mono text-sm tracking-widest uppercase">
            Full-Stack &amp; AI Developer · Sysadmin · Blogger
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
            I'm a full-stack web developer and AI builder with a passion for Linux, cybersecurity, and the open web. I run <strong className="text-foreground">BlogiFy</strong> — a hands-on IT publication where I share practical tutorials on everything from server hardening to building SaaS products with the modern AI stack.
          </p>
          <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl">
            With years of experience across WordPress, self-hosted infrastructure, crypto ecosystems, and now AI-driven app development, I write the guides I wish existed when I was figuring things out — detailed, opinionated, and built to actually work.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="https://www.peopleperhour.com/hire/1648438511/2784711" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 transition-colors">
              Hire Me on PeoplePerHour <ExternalLink className="size-3.5" />
            </a>
            <Link to="/contact"
               className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:border-brand hover:text-brand transition-colors">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* What I Do */}
      <section className="mb-16">
        <h2 className="font-display text-2xl font-bold mb-6">What I Do</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SKILLS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="surface-card p-5 rounded-xl border border-border hover:border-brand/40 transition-colors">
              <Icon className="size-5 text-brand mb-3" />
              <h3 className="font-display text-sm font-semibold mb-1">{label}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Freelance */}
      <section className="mb-16">
        <h2 className="font-display text-2xl font-bold mb-2">Freelance Services</h2>
        <p className="text-muted-foreground text-sm mb-6">Available for hire on PeoplePerHour · 100% rating</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <a key={s.title} href={s.href} target="_blank" rel="noopener noreferrer"
               className="group surface-card p-5 rounded-xl border border-border hover:border-brand/60 hover:-translate-y-0.5 transition-all">
              <p className="font-display text-base font-semibold group-hover:text-brand transition-colors">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.subtitle}</p>
              <p className="text-brand font-mono font-semibold mt-3">{s.price}</p>
            </a>
          ))}
        </div>
      </section>

      {/* BlogiFy */}
      <section className="mb-16 surface-card rounded-2xl border border-border p-8">
        <h2 className="font-display text-2xl font-bold mb-3">About BlogiFy</h2>
        <p className="text-muted-foreground leading-relaxed">
          BlogiFy started as a place to document solutions to problems I kept solving over and over — Linux configuration, WordPress quirks, VPS setups, security hardening. Over time it became a full IT publication covering tutorials, tool reviews, crypto guides, and digital marketing strategy.
        </p>
        <p className="text-muted-foreground leading-relaxed mt-3">
          Every article is written from hands-on experience. No filler, no SEO padding — just practical information that gets to the point. If you're a sysadmin, developer, or tech enthusiast who prefers reading over watching 20-minute YouTube videos, BlogiFy is for you.
        </p>
      </section>

      {/* Contact CTA */}
      <section className="text-center surface-card rounded-2xl border border-border/40 p-10">
        <h2 className="font-display text-2xl font-bold mb-2">Let's work together</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">Have a project in mind, a question about an article, or just want to say hi? I'm always happy to connect.</p>
        <Link to="/contact" className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90 transition-colors">
          Send a Message
        </Link>
      </section>

    </div>
  );
}
