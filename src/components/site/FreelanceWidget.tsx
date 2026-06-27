import { useEffect, useRef } from "react";

export function FreelanceWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Inject the div the PPH script targets
    const div = document.createElement("div");
    div.id = "pph-hireme-" + Math.random().toString(36).slice(2);
    container.appendChild(div);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://www.peopleperhour.com/hire/1648438511/2784711.js?width=300&height=400&orientation=vertical&theme=dark&hourlies=1113922%2C1118452&rnd=" +
      parseInt((Math.random() * 10000).toString(), 10);
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div className="surface-card p-4 rounded-xl border border-border overflow-hidden">
      <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        Hire Me
      </h3>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
