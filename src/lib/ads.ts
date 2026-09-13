// Google AdSense configuration for BlogiFy.
//
// HOW TO FILL THE SLOT IDs:
//   1. Go to https://adsense.google.com → Ads → By ad unit.
//   2. Create a Display ad unit for each placement below (a "fluid /
//      in-article" unit for midArticle).
//   3. Copy each unit's data-ad-slot numeric ID into the matching field.
//   4. Any slot left as "" renders nothing, so the site is safe until
//      real IDs are added. Auto ads (controlled from the AdSense
//      dashboard) work regardless once the script in __root.tsx loads.

export const ADSENSE_CLIENT = "ca-pub-4702782931000986";

export const AD_SLOTS = {
  belowHero: "",
  midArticle: "",
  afterArticle: "",
  sidebar: "",
} as const;

const ADMIN_PATHS = [
  "/login",
  "/admin",
  "/dashboard",
  "/invoice",
  "/posts",
  "/categories",
  "/tags",
  "/authors",
  "/media",
  "/seo",
  "/drafts",
  "/published",
  "/featured",
  "/reports",
  "/settings",
];

export function isAdminPathname(pathname: string): boolean {
  return ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
