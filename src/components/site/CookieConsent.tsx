import { useState, useEffect } from "react";
import { Cookie, X, Check } from "lucide-react";

function loadGA4() {
  if (document.getElementById("ga4-script")) return;
  const s = document.createElement("script");
  s.id = "ga4-script";
  s.src = "https://www.googletagmanager.com/gtag/js?id=G-4HQ2LPF7ZQ";
  s.async = true;
  document.head.appendChild(s);
  const i = document.createElement("script");
  i.id = "ga4-init";
  i.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-4HQ2LPF7ZQ');`;
  document.head.appendChild(i);
}

function loadAdSense() {
  if (document.getElementById("adsense-script")) return;
  const s = document.createElement("script");
  s.id = "adsense-script";
  s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4702782931000986";
  s.async = true;
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (consent === "accepted") {
      loadGA4();
      loadAdSense();
    } else if (consent === "declined") {
      // do nothing
    } else {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem("cookie_consent", "accepted");
    loadGA4();
    loadAdSense();
    setVisible(false);
  }

  function decline() {
    localStorage.setItem("cookie_consent", "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-surface/95 backdrop-blur-md shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Cookie className="size-5 text-brand shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">We use cookies</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              We use Google Analytics and Google AdSense to improve your experience and serve relevant ads. By clicking Accept, you consent to our use of cookies.{" "}
              <a href="/privacy-policy" className="underline underline-offset-2 hover:text-brand transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            aria-label="Decline cookies"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            <X className="size-3" aria-hidden="true" /> Decline
          </button>
          <button
            onClick={accept}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:bg-brand/90 transition-colors"
          >
            <Check className="size-3" /> Accept
          </button>
        </div>
      </div>
    </div>
  );
}
