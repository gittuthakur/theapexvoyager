import fs from 'fs';
import path from 'path';

/**
 * Server-only — reads `fs`, so this must never be imported from a 'use client'
 * file (that's why it's split out of lib/hotels.ts). Call it from a server
 * module like lib/hotels.ts and let the already-resolved HotelPackage.images
 * flow down to components as plain strings.
 *
 * Drops any local `/images/...` path that doesn't actually exist under `public/`
 * (true for every seed entry in config/hotels.config.ts today, since those hardcoded
 * mock paths were never paired with real uploaded files) instead of substituting an
 * unrelated real photograph for it — an unverified property showing no photo is
 * honest; showing someone else's real hotel/property photo is not. Non-local URLs
 * (the Google Places photo proxy, a future real CDN/S3 URL) are left untouched;
 * there's no local file to check. Callers render their own neutral placeholder
 * (components/ui/MediaPlaceholder.tsx) when the result is empty.
 */
export function resolveHotelImages(images: string[] | undefined): string[] {
  return (images ?? []).filter((image) => {
    if (!image.startsWith('/')) return true;
    const absolutePath = path.join(process.cwd(), 'public', image);
    return fs.existsSync(absolutePath);
  });
}
