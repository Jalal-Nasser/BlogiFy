// Google AdSense placeholder. Drop in your AdSense markup where indicated.
export function AdSlot({ label = "Advertisement", size = "leaderboard" }: { label?: string; size?: "leaderboard" | "rectangle" | "sidebar" }) {
  const heights: Record<string, string> = {
    leaderboard: "min-h-[90px]",
    rectangle: "min-h-[250px]",
    sidebar: "min-h-[600px]",
  };
  return (
    <div className={`w-full ${heights[size]} flex items-center justify-center rounded-lg border border-dashed border-border/60 bg-surface/30 text-xs uppercase tracking-widest text-muted-foreground/60`}>
      {/* Google AdSense — replace this block with your ad unit */}
      {/* <ins class="adsbygoogle" ... /> */}
      <span>{label}</span>
    </div>
  );
}
