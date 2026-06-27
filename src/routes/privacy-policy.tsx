import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — BlogiFy" },
      { name: "description", content: "Privacy policy for BlogiFy — how we collect and use your data." },
      { property: "og:title", content: "Privacy Policy — BlogiFy" },
      { property: "og:description", content: "How BlogiFy handles cookies, analytics, and any personal data you share with us." },
      { property: "og:url", content: "https://jalalnasser.com/privacy-policy" },
      { name: "twitter:title", content: "Privacy Policy — BlogiFy" },
      { name: "twitter:description", content: "How BlogiFy handles cookies, analytics, and personal data." },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "https://jalalnasser.com/privacy-policy" }],
  }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 lg:px-6 py-16">
      <h1 className="font-display text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: June 2025</p>

      <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Overview</h2>
          <p>BlogiFy ("we", "us", "our") is operated by Jalal Nasser at jalalnasser.com. This policy explains what information we collect, how we use it, and your rights regarding your data.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Information We Collect</h2>
          <p>We do not collect personally identifiable information unless you voluntarily submit it (e.g. via our contact form or newsletter signup). We collect the following automatically:</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Usage data (pages visited, time on page, browser type) via Google Analytics 4</li>
            <li>IP address (anonymised by Google Analytics)</li>
            <li>Ad impression and click data via Google AdSense</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Cookies</h2>
          <p>We use cookies for analytics and advertising. Specifically:</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li><strong className="text-foreground">Google Analytics</strong> — sets cookies (_ga, _gid) to measure site traffic. These are only loaded after you accept cookies.</li>
            <li><strong className="text-foreground">Google AdSense</strong> — sets cookies to serve personalised ads. These are only loaded after you accept cookies.</li>
            <li><strong className="text-foreground">Consent cookie</strong> — we store your cookie preference (cookie_consent) in your browser's localStorage.</li>
          </ul>
          <p className="mt-2">You can withdraw consent at any time by clearing your browser's localStorage or using the "Decline" option in the cookie banner.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Google Services</h2>
          <p>We use Google Analytics 4 and Google AdSense, both operated by Google LLC. Google may use your data according to its own privacy policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-2">policies.google.com/privacy</a>.</p>
          <p className="mt-2">To opt out of Google Analytics across all websites, use the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-2">Google Analytics Opt-out Browser Add-on</a>.</p>
          <p className="mt-2">To opt out of personalised ads, visit <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-2">Google Ads Settings</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Newsletter & Contact Form</h2>
          <p>If you subscribe to our newsletter or use the contact form, we store your name and email address in our database (Supabase). We use this only to send you updates or respond to your enquiry. We do not share this data with third parties. You can unsubscribe at any time.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Your Rights (GDPR)</h2>
          <p>If you are located in the European Economic Area, you have the right to:</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request correction or deletion of your data</li>
            <li>Object to or restrict processing of your data</li>
            <li>Withdraw consent at any time (without affecting lawfulness of prior processing)</li>
          </ul>
          <p className="mt-2">To exercise these rights, contact us at the address below.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Data Retention</h2>
          <p>Contact form submissions and newsletter subscribers are retained until you request deletion. Google Analytics data is retained for 14 months by default.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Contact</h2>
          <p>For any privacy-related questions, contact us via the <a href="/contact" className="text-brand underline underline-offset-2">Contact page</a>.</p>
        </section>

      </div>
    </div>
  );
}
