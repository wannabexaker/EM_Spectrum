/**
 * The one place the deployed origin is decided.
 *
 * It used to live inline in app/layout.tsx. When that copy was corrected away from a
 * vercel.app host this app is not deployed on, app/robots.ts and app/sitemap.ts kept
 * their own copies of the wrong address: the published robots.txt pointed crawlers at
 * a stranger's sitemap, and the published sitemap listed a stranger's URLs. Three
 * copies of one fact are what allowed that, so there is one now.
 *
 * NEXT_PUBLIC_BASE_PATH belongs in here on purpose. The portfolio build mounts this
 * app under /em-spectrum, and every absolute URL has to carry that path, not just the
 * origin.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  `https://wannabexaker.github.io${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}`
