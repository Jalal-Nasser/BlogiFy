import { useEffect } from "react";

export function FreelanceWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://www.peopleperhour.com/hire/1648438511/2784711.js?width=300&height=320&orientation=vertical&theme=dark&hourlies=1113922%2C1118452&rnd=" +
      parseInt((Math.random() * 10000).toString(), 10);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
      const div = document.getElementById("pph-hireme");
      if (div) div.innerHTML = "";
    };
  }, []);

  return (
    <div className="surface-card p-4 rounded-xl border border-border overflow-hidden">
      <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Hire Me on PeoplePerHour
      </h3>
      <div id="pph-hireme" className="w-full min-h-[200px]" />
    </div>
  );
}
