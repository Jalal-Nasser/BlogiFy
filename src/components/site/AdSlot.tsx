import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, isAdminPathname } from "@/lib/ads";

type AdSlotProps = {
  /** AdSense ad-unit slot ID. Empty string → renders nothing. */
  slot: string;
  /** AdSense data-ad-format. Use "fluid" together with layout="in-article". */
  format?: string;
  className?: string;
  /** Optional data-ad-layout, e.g. "in-article". */
  layout?: string;
};

export function AdSlot({ slot, format = "auto", className, layout }: AdSlotProps) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!slot) return;
    if (typeof window === "undefined") return;
    if (isAdminPathname(window.location.pathname)) return;
    const el = insRef.current;
    if (!el || el.dataset.adPushed === "true") return;
    try {
      el.dataset.adPushed = "true";
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded yet or blocked — fail silently.
    }
  }, [slot]);

  if (!slot) return null;

  return (
    <div className={className}>
      <p className="mb-1 text-center text-xs text-muted-foreground">Advertisement</p>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(layout ? { "data-ad-layout": layout } : {})}
        data-full-width-responsive="true"
      />
    </div>
  );
}
