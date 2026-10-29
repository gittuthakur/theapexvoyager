import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { META_PIXEL_ID, isMetaPixelEnabled } from './metaPixel';

it('keeps the production pixel id', () => {
  expect(META_PIXEL_ID).toBe('1089461426999958');
});

it('enables the Meta Pixel only in a production deployment', () => {
  expect(isMetaPixelEnabled({ NODE_ENV: 'production', VERCEL_ENV: 'production' })).toBe(true);
  expect(isMetaPixelEnabled({ NODE_ENV: 'production' })).toBe(true);
  expect(isMetaPixelEnabled({ NODE_ENV: 'development' })).toBe(false);
  expect(isMetaPixelEnabled({ NODE_ENV: 'test' })).toBe(false);
  expect(isMetaPixelEnabled({})).toBe(false);
  expect(isMetaPixelEnabled({ NODE_ENV: 'production', VERCEL_ENV: 'preview' })).toBe(false);
  expect(isMetaPixelEnabled({ NODE_ENV: 'production', VERCEL_ENV: 'development' })).toBe(false);
});

it('renders the pixel script and the noscript fallback only inside the guard', () => {
  const layout = readFileSync('app/layout.tsx', 'utf8');
  const start = layout.indexOf('isMetaPixelEnabled() ?');
  const end = layout.indexOf('<NavigationTracker />');
  expect(start).toBeGreaterThan(0);
  const guarded = layout.slice(start, end);
  const unguarded = layout.slice(0, start) + layout.slice(end);
  for (const marker of ['fbevents.js', "fbq('init'", "fbq('track', 'PageView')", 'facebook.com/tr?id=']) {
    expect(guarded, marker).toContain(marker);
    expect(unguarded, marker).not.toContain(marker);
  }
});
