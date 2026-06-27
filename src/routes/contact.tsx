import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Mail, Clock, Send, CheckCircle, AlertCircle, Github, Linkedin } from "lucide-react";

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
  honeypot: string;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const submitContact = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as ContactPayload)
  .handler(async ({ data }) => {
    if (data.honeypot) return { ok: true };

    if (!data.name || !data.email || !data.subject || !data.message) {
      throw new Error("Missing fields");
    }

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
      throw new Error("Email service not configured");
    }

    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"BlogiFy Contact" <${user}>`,
      to: "jnasser1983@gmail.com",
      replyTo: data.email,
      subject: `[BlogiFy] ${data.subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#7c3aed">New message from BlogiFy</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#666;width:80px"><strong>Name</strong></td><td>${escapeHtml(data.name)}</td></tr>
            <tr><td style="padding:8px 0;color:#666"><strong>Email</strong></td><td>${escapeHtml(data.email)}</td></tr>
            <tr><td style="padding:8px 0;color:#666"><strong>Subject</strong></td><td>${escapeHtml(data.subject)}</td></tr>
          </table>
          <hr style="margin:16px 0;border-color:#eee"/>
          <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
        </div>
      `,
    });

    return { ok: true };
  });

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — BlogiFy" },
      { name: "description", content: "Get in touch with Jalal Nasser — questions, project inquiries, or just to say hi." },
    ],
  }),
  component: Contact,
});

function genMath() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: String(a + b) };
}

function Contact() {
  const send = useServerFn(submitContact);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", honeypot: "" });
  const [math] = useState(genMath);
  const [mathInput, setMathInput] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mathInput.trim() !== math.answer) {
      setErrorMsg("Incorrect answer — please try again.");
      setStatus("error");
      return;
    }
    if (!form.name || !form.email || !form.subject || !form.message) {
      setErrorMsg("Please fill in all fields.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      await send({ data: form });
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "", honeypot: "" });
      setMathInput("");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again or email directly.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 lg:px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">Get in Touch</h1>
        <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
          Have a project, a question, or just want to say hi? I usually respond within 24 hours.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <aside className="lg:col-span-2 flex flex-col gap-5">
          <div className="surface-card rounded-2xl border border-border p-6">
            <h2 className="font-display text-base font-semibold mb-4">Contact Info</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-lg bg-brand/10 grid place-items-center shrink-0">
                  <Mail className="size-4 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <a href="mailto:jnasser1983@gmail.com" className="text-sm hover:text-brand transition-colors">
                    jnasser1983@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-lg bg-brand/10 grid place-items-center shrink-0">
                  <Clock className="size-4 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Response time</p>
                  <p className="text-sm">Usually within 24 hours</p>
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card rounded-2xl border border-border p-6">
            <h2 className="font-display text-base font-semibold mb-4">Find Me Online</h2>
            <div className="space-y-3">
              <a href="https://x.com/jalalnasser" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-brand transition-colors group">
                <div className="size-8 rounded-md border border-border group-hover:border-brand grid place-items-center transition-colors">
                  <XIcon className="size-3.5" />
                </div>
                @jalalnasser
              </a>
              <a href="https://github.com/Jalal-Nasser" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-brand transition-colors group">
                <div className="size-8 rounded-md border border-border group-hover:border-brand grid place-items-center transition-colors">
                  <Github className="size-3.5" />
                </div>
                Jalal-Nasser
              </a>
              <a href="https://www.linkedin.com/in/jalalnasser" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-brand transition-colors group">
                <div className="size-8 rounded-md border border-border group-hover:border-brand grid place-items-center transition-colors">
                  <Linkedin className="size-3.5" />
                </div>
                jalalnasser
              </a>
            </div>
          </div>

          <div className="surface-card rounded-2xl border border-brand/20 bg-brand/5 p-6">
            <p className="text-sm font-semibold mb-1">Need freelance help?</p>
            <p className="text-xs text-muted-foreground mb-3">Full-stack & AI development — 100% rating on PeoplePerHour.</p>
            <a href="https://www.peopleperhour.com/hire/1648438511/2784711" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
              View my profile →
            </a>
          </div>
        </aside>

        <div className="lg:col-span-3">
          <div className="surface-card rounded-2xl border border-border p-6 lg:p-8">
            {status === "success" ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <div className="size-16 rounded-full bg-green-500/10 grid place-items-center">
                  <CheckCircle className="size-8 text-green-400" />
                </div>
                <h3 className="font-display text-xl font-bold">Message sent!</h3>
                <p className="text-muted-foreground text-sm max-w-xs">Thanks for reaching out. I'll get back to you within 24 hours.</p>
                <button onClick={() => setStatus("idle")} className="mt-2 text-sm text-brand hover:underline">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <input
                  type="text"
                  name="website"
                  value={form.honeypot}
                  onChange={set("honeypot")}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="absolute opacity-0 pointer-events-none w-0 h-0"
                  autoComplete="off"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name *</label>
                    <input
                      type="text" value={form.name} onChange={set("name")} required
                      placeholder="Jalal Nasser"
                      className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email *</label>
                    <input
                      type="email" value={form.email} onChange={set("email")} required
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject *</label>
                  <input
                    type="text" value={form.subject} onChange={set("subject")} required
                    placeholder="Project inquiry, question, feedback…"
                    className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message *</label>
                  <textarea
                    value={form.message} onChange={set("message")} required rows={6}
                    placeholder="Tell me what's on your mind…"
                    className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors resize-none"
                  />
                </div>

                <div className="rounded-lg border border-border bg-background/30 p-4 flex items-center gap-4">
                  <p className="text-sm font-mono font-semibold whitespace-nowrap">
                    {math.a} + {math.b} = ?
                  </p>
                  <input
                    type="text" value={mathInput} onChange={(e) => setMathInput(e.target.value)}
                    placeholder="Your answer"
                    inputMode="numeric"
                    className="w-28 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors"
                  />
                  <p className="text-xs text-muted-foreground">Spam check</p>
                </div>

                {status === "error" && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    <AlertCircle className="size-4 shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {status === "sending" ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
