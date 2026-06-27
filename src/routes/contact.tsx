import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Send, Loader2 } from "lucide-react";
import { fetchPageBySlug, submitContact } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — BlogiFy" }, { name: "description", content: "Get in touch with Jalal Nasser." }] }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(2000),
});

function Contact() {
  const { data: page } = useQuery({ queryKey: ["page", "contact"], queryFn: () => fetchPageBySlug("contact") });
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    try {
      await submitContact(parsed.data.name, parsed.data.email, parsed.data.message);
      toast.success("Message sent. Jalal will reply soon.");
      setForm({ name: "", email: "", message: "" });
    } catch { toast.error("Failed to send. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 lg:px-6 pt-10">
      <div className="flex items-center gap-2 text-brand"><Mail className="size-4" /><span className="font-mono text-xs uppercase tracking-widest">Get in touch</span></div>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">{page?.title ?? "Contact"}</h1>
      {page?.content && <div className="prose-article mt-4" dangerouslySetInnerHTML={{ __html: page.content }} />}

      <form onSubmit={onSubmit} className="mt-8 surface-card p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Name</label>
            <Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Email</label>
            <Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={200} />
          </div>
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Message</label>
          <Textarea className="mt-1 min-h-[160px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required maxLength={2000} />
        </div>
        <Button type="submit" disabled={loading} className="bg-brand text-brand-foreground hover:bg-brand/90">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <><Send className="size-4 mr-2" /> Send message</>}
        </Button>
      </form>
    </div>
  );
}
