import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — BlogiFy" },
      { name: "description", content: "Terms of service for BlogiFy by Jalal Nasser." },
      { property: "og:title", content: "Terms of Service — BlogiFy" },
      { property: "og:description", content: "The terms that govern your use of BlogiFy and its content." },
      { property: "og:url", content: "https://jalalnasser.com/terms" },
      { name: "twitter:title", content: "Terms of Service — BlogiFy" },
      { name: "twitter:description", content: "The terms that govern your use of BlogiFy." },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "https://jalalnasser.com/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 lg:px-6 py-16">
      <h1 className="font-display text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: June 2025</p>

      <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance</h2>
          <p>By accessing BlogiFy (jalalnasser.com), you agree to these Terms of Service. If you disagree with any part, please do not use the site.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Content</h2>
          <p>All articles, tutorials, and guides are provided for informational purposes only. While we strive for accuracy, we make no warranties that the content is complete, error-free, or up to date. Use it at your own risk.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Intellectual Property</h2>
          <p>All content on BlogiFy — including text, images, and code snippets — is owned by Jalal Nasser unless otherwise stated. You may share excerpts with attribution and a link back to the original article. Reproduction of full articles without permission is prohibited.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Third-Party Services</h2>
          <p>This site uses Google Analytics, Google AdSense, Supabase, and PeoplePerHour widgets. Each of these is governed by their own terms and privacy policies. We are not responsible for third-party content or services.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Advertising</h2>
          <p>This site displays advertisements via Google AdSense. Ads are served automatically based on content and your browsing history. We do not endorse any advertised products or services.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Limitation of Liability</h2>
          <p>BlogiFy and Jalal Nasser shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of this site or any information found on it.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Changes</h2>
          <p>We reserve the right to update these terms at any time. Continued use of the site after changes constitutes acceptance of the new terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Contact</h2>
          <p>Questions? Use the <a href="/contact" className="text-brand underline underline-offset-2">Contact page</a>.</p>
        </section>

      </div>
    </div>
  );
}
