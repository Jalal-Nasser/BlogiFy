import { useEffect, useRef, useState } from "react";

export function PphHireWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const injectedRef = useRef(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (injectedRef.current) return;
    injectedRef.current = true;

    const rnd = parseInt((Math.random() * 10000).toString(), 10);
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = `https://www.peopleperhour.com/hire/1648438511/2784711.js?width=245&height=320&orientation=vertical&theme=dark&hourlies=1113922%2C1118452&rnd=${rnd}`;

    script.onerror = () => {
      setShowFallback(true);
    };

    const target = containerRef.current ?? document.body;
    target.appendChild(script);

    const timer = setTimeout(() => {
      const iframe = document.querySelector("#pph-hireme iframe");
      if (!iframe) {
        setShowFallback(true);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="surface-card p-6 rounded-xl border border-border">
      <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        Hire me on PeoplePerHour
      </h3>
      <div
        ref={containerRef}
        className="flex justify-center items-center overflow-hidden"
        style={{ minHeight: 320 }}
      >
        {showFallback ? (
          <a
            href="https://www.peopleperhour.com/hire/1648438511/2784711"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 transition-colors"
          >
            Hire me on PeoplePerHour →
          </a>
        ) : (
          <div id="pph-hireme" style={{ width: 245 }} />
        )}
      </div>
    </div>
  );
}
