import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site.config';

// No admin/internal routes exist in this app to disallow — every route is a real,
// public marketing/booking page, so a blanket allow is honest rather than
// speculative. See app/sitemap.ts for the URL list this points crawlers at.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteConfig.url}/sitemap.xml`
  };
}
