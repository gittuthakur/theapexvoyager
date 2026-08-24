import fs from 'fs';
import path from 'path';

/**
 * Server-only — reads `fs`, so this must never be imported from a 'use client' file.
 * Validates a local `/…` image path actually exists under `public/` before it's ever
 * sent to the browser; non-local URLs (an API proxy, a remote CDN) are passed through
 * untouched since there's no local file to check. Returns `undefined` — never another
 * hardcoded path — when the file is missing, so callers can render a graceful
 * no-image state instead of requesting a 404.
 */
export function resolveLocalImage(image: string | undefined): string | undefined {
  if (!image) return undefined;
  if (!image.startsWith('/')) return image;
  const absolutePath = path.join(process.cwd(), 'public', image);
  return fs.existsSync(absolutePath) ? image : undefined;
}
