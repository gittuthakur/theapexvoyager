import { isGoogleTrackingEnabled } from '@/lib/googleAds';

export const META_PIXEL_ID = '1089461426999958';

/** Same production-only rule as the Google tag: localhost, `next dev`, tests and Vercel previews never reach the production pixel. */
export const isMetaPixelEnabled = (env: Record<string, string | undefined> = process.env): boolean => isGoogleTrackingEnabled(env);
