import { useEffect, useRef } from "react";

export function PphHireWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const injectedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (injectedRef.current) return;
    injectedRef.current = true;

    const rnd = parseInt((Math.random() * 10000).toString(), 10);
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = `https://www.peopleperhour.com/hire/1648438511/2784711.js?width=245&height=320&orientation=vertical&theme=dark&hourlies=1113922%2C538009&rnd=${rnd}`;
    (containerRef.current ?? document.body).appendChild(script);
  }, []);

  return (
    <div className="surface-card p-6 rounded-xl border border-border">
      <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        Hire me on PeoplePerHour
      </h3>
      <div ref={containerRef} className="flex justify-center overflow-hidden">
        <div id="pph-hireme" style={{ width: 245 }} />
      </div>
    </div>
  );
}
