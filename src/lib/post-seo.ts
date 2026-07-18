// Per-post SEO overrides for the 5 new AI/Tech articles.
// Kept as plain serializable primitives so route loaders stay Seroval-safe.

export type PostSeoOverride = {
  seoTitle: string;
  metaDescription: string;
  imageAlt: string;
  keywords: string[];
};

export const POST_SEO_OVERRIDES: Record<string, PostSeoOverride> = {
  "chatgpt-vs-gemini-vs-claude-2026": {
    seoTitle: "ChatGPT vs Gemini vs Claude (2026): Best AI?",
    metaDescription:
      "Compare ChatGPT, Gemini and Claude in 2026 on reasoning, coding, privacy and price — with a decision matrix for US and UK teams.",
    imageAlt:
      "Abstract comparison of three leading AI assistant platforms in 2026",
    keywords: ["ChatGPT", "Gemini", "Claude", "AI assistants", "2026"],
  },
  "gpt-5-6-explained": {
    seoTitle: "GPT-5.6 Explained: Features, Uses and Limits",
    metaDescription:
      "What changed in GPT-5.6, where it beats GPT-5, latency and cost trade-offs, real limitations, and a concrete upgrade checklist.",
    imageAlt:
      "Advanced language model reasoning core connected to code, documents and data tools",
    keywords: ["GPT-5.6", "OpenAI", "LLM", "AI models", "upgrade guide"],
  },
  "ai-video-generation-guide-2026": {
    seoTitle: "AI Video Generation in 2026: Practical Guide",
    metaDescription:
      "The 2026 AI video guide: top tools, production workflows, deepfake risks, disclosure rules and a safe checklist for creators and brands.",
    imageAlt:
      "Creator transforming an AI prompt into cinematic video scenes in a virtual studio",
    keywords: ["AI video", "generative video", "deepfakes", "creator tools", "2026"],
  },
  "ai-search-engines-vs-google-2026": {
    seoTitle: "AI Search vs Google: Reliable Research in 2026",
    metaDescription:
      "AI answers or classic links? A 2026 guide to using AI search alongside Google, with a five-step verification workflow for research.",
    imageAlt:
      "AI search interface mapping a question to multiple verified web sources",
    keywords: ["AI search", "Google", "Perplexity", "research workflow", "SEO"],
  },
  "will-ai-replace-jobs-us-uk-2026": {
    seoTitle: "Will AI Replace Jobs? US and UK Skills for 2026",
    metaDescription:
      "Which US and UK jobs AI actually replaces in 2026, which grow, and the concrete skills, tools and certifications worth learning now.",
    imageAlt:
      "US and UK professionals collaborating with AI tools in a modern workplace",
    keywords: ["AI jobs", "future of work", "US", "UK", "AI skills 2026"],
  },
};

export function getPostSeoOverride(slug: string): PostSeoOverride | null {
  return POST_SEO_OVERRIDES[slug] ?? null;
}
