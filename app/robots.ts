import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site.config';

// Defense-in-depth alongside each route's own page-level `robots: { index: false }`
// metadata (see app/internal/*/page.tsx, app/bookings/hbx/[reference]/voucher/page.tsx)
// — /internal/ is admin-only tooling and /bookings/ holds only private, per-reference
// booking vouchers; neither is ever a page a search/AI engine should crawl or link to.
// Everything else on the site remains a real, public page and stays fully crawlable.
const DISALLOWED_PATHS = ['/internal/', '/bookings/'];

// Search/AI-search crawl visibility ("may you crawl this site to find, cite, or answer
// with its pages") is a deliberately separate question from model-training permission
// ("may you train a model on this content" — Google-Extended, GPTBot's training-use
// signal, CCBot, etc.). This file only ever answers the first question. No
// training-only crawler is named here, and none is blocked by the wildcard rule below
// either — enabling or blocking model-training crawlers is a separate business decision
// this site hasn't made yet, not an oversight of this configuration.
const SEARCH_AND_AI_SEARCH_USER_AGENTS = [
  'Googlebot', // Google Search / Google AI features that ground on the live index
  'Bingbot', // Bing / Microsoft Copilot
  'OAI-SearchBot', // ChatGPT Search's own indexing crawler
  'ChatGPT-User' // On-demand fetch triggered by a live ChatGPT user action
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOWED_PATHS },
      ...SEARCH_AND_AI_SEARCH_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: DISALLOWED_PATHS
      }))
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`
  };
}
