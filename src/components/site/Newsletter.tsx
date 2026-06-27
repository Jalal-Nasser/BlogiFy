import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { subscribeEmail } from "@/lib/queries";

export function Newsletter({ variant = "card" }: { variant?: "card" | "inline" }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Please enter a valid email.");
    setLoading(true);
    try {
      await subscribeEmail(email.trim().toLowerCase());
      toast.success("Subscribed! Check your inbox soon.");
      setEmail("");
    } catch (err: any) {
      if (err?.code === "23505") toast.success("You're already subscribed.");
      else toast.error("Subscription failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const wrapClass = variant === "card"
    ? "surface-card p-6 relative overflow-hidden"
    : "rounded-xl border border-border bg-surface/50 p-5";

  return (
    <div className={wrapClass}>
      {variant === "card" && (
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
      )}
      <div className="relative">
        <div className="flex items-center gap-2 text-brand">
          <Mail className="size-4" />
          <span className="text-xs font-mono uppercase tracking-widest">Newsletter</span>
        </div>
        <h3 className="mt-2 font-display text-lg font-semibold">The IT brief, weekly.</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Hand-picked tutorials, security alerts, and infrastructure deep-dives. No spam.
        </p>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            required
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-input/60"
          />
          <Button type="submit" disabled={loading} className="bg-brand text-brand-foreground hover:bg-brand/90">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Subscribe"}
          </Button>
        </form>
      </div>
    </div>
  );
}
