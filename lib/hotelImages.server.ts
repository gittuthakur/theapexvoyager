import fs from 'fs';
import path from 'path';
import { getPlaceholderImageForCategory } from '@/lib/hotelImages';
import type { HotelCategory } from '@/types/hotel';

/**
 * Server-only — reads `fs`, so this must never be imported from a 'use client'
 * file (that's why it's split out of lib/hotelImages.ts). Call it from a server
 * module like lib/hotels.ts and let the already-resolved HotelPackage.images
 * flow down to components as plain strings.
 *
 * Local `/images/...` paths that don't actually exist under `public/` — true
 * for every seed entry in config/hotels.config.ts today, since those hardcoded
 * mock paths were never paired with real uploaded files — are swapped for the
 * category's Unsplash fallback. Non-local URLs (the Google Places photo proxy,
 * a future real CDN/S3 URL) are left untouched; there's no local file to check.
 */
export function resolveHotelImages(images: string[] | undefined, category: HotelCategory): string[] {
  const resolved = (images ?? []).map((image) => {
    if (!image.startsWith('/')) return image;
    const absolutePath = path.join(process.cwd(), 'public', image);
    return fs.existsSync(absolutePath) ? image : getPlaceholderImageForCategory(category);
  });

  return resolved.length > 0 ? resolved : [getPlaceholderImageForCategory(category)];
}
