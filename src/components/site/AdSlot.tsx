// Google AdSense placeholder. Drop in your AdSense markup where indicated.
export function AdSlot({ label = "Advertisement", size = "leaderboard" }: { label?: string; size?: "leaderboard" | "rectangle" | "sidebar" }) {
  return <ins className="adsbygoogle" style={{ display: "block" }} />;
}
