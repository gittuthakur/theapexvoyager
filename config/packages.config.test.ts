import { describe, expect, it } from 'vitest';
import { packages } from './packages.config';

// Regression guard for the Phase 2 draft/publish workflow (Part 2 of the brief: "Do not
// alter their prices simply for this phase") — the 6 legitimate live packages' commercial
// values must survive adding the `status` field untouched.
const EXPECTED_LIVE_PACKAGES: Array<{ slug: string; price: number }> = [
  { slug: 'manali-premium-escape', price: 12999 },
  { slug: 'kashmir-signature-journey', price: 24999 },
  { slug: 'spiti-valley-adventure', price: 18999 },
  { slug: 'himachal-himalayan-explorer', price: 22999 },
  { slug: 'dharamshala-dalhousie-escape', price: 15999 },
  { slug: 'uttarakhand-explorer', price: 20999 }
];

describe('config/packages.config.ts — existing 6 packages regression guard', () => {
  it('still contains exactly these 6 slugs, each marked published', () => {
    const slugs = packages.map((pkg) => pkg.slug).sort();
    expect(slugs).toEqual(EXPECTED_LIVE_PACKAGES.map((p) => p.slug).sort());
    for (const pkg of packages) {
      expect(pkg.status).toBe('published');
    }
  });

  it('retains each package\'s original commercial price — unaltered by the Phase 2 status backfill', () => {
    for (const expected of EXPECTED_LIVE_PACKAGES) {
      const pkg = packages.find((p) => p.slug === expected.slug);
      expect(pkg?.price).toBe(expected.price);
    }
  });
});
