import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { images } from './images.config';
import { packages } from './packages.config';
import { DESTINATIONS_WITHOUT_VERIFIED_IMAGE } from './destinationImageOverrides';

// Phase 4D — site-wide image audit. Three of the six live Journey packages were found
// to use a generic, non-destination-specific image despite a real, verified, already-
// resolving curated Destination photo being available for their real primary
// destination — a genuine P1 finding (public page, generic imagery, safe existing
// replacement available). Fixed in config/images.config.ts's `packages` map only —
// see docs/site-wide-real-image-audit.md for the full reasoning per package.

describe('Phase 4D — P1 live-package image fixes use real, on-disk, destination-correct photos', () => {
  const FIXES: Array<{ slug: string; expectedImage: string; expectedFile: string }> = [
    { slug: 'kashmir-signature-journey', expectedImage: images.packages.kashmirSignatureJourney, expectedFile: 'destination-srinagar.jpg' },
    { slug: 'himachal-himalayan-explorer', expectedImage: images.packages.himachalHimalayanExplorer, expectedFile: 'destination-manali.jpg' },
    { slug: 'uttarakhand-explorer', expectedImage: images.packages.uttarakhandExplorer, expectedFile: 'destination-rishikesh.jpg' }
  ];

  it('each fixed package now resolves to its real, destination-correct photo', () => {
    for (const fix of FIXES) {
      const pkg = packages.find((p) => p.slug === fix.slug);
      expect(pkg, fix.slug).toBeDefined();
      expect(pkg?.image, fix.slug).toBe(fix.expectedImage);
      expect(pkg?.image, fix.slug).toBe(`/images/${fix.expectedFile}`);
    }
  });

  it('every fixed image asset physically exists on disk', () => {
    for (const fix of FIXES) {
      expect(fs.existsSync(path.join('public', 'images', fix.expectedFile)), fix.expectedFile).toBe(true);
    }
  });

  it('none of the three fixed packages uses a generic, non-destination-specific image anymore', () => {
    const genericPaths = new Set(['/images/hero-hero.jpg', '/images/feature-tour-hero.jpg', '/images/img-hero-hero.jpg']);
    for (const fix of FIXES) {
      expect(genericPaths.has(fix.expectedImage), fix.slug).toBe(false);
    }
  });

  it('the other three (already-correct) live packages are untouched by this fix', () => {
    expect(packages.find((p) => p.slug === 'manali-premium-escape')?.image).toBe('/images/destination-manali.jpg');
    expect(packages.find((p) => p.slug === 'spiti-valley-adventure')?.image).toBe('/images/destination-spiti.jpg');
    expect(packages.find((p) => p.slug === 'dharamshala-dalhousie-escape')?.image).toBe('/images/destination-dharamshala.jpg');
  });
});

describe('Phase 4D — destinationImageOverrides.ts respected, not overridden', () => {
  it('the 9 already-flagged destinations with no verified photo were not touched by this phase — no neighbour-destination substitution was applied to any of them', () => {
    const expected = ['tirthan-valley', 'jibhi', 'sainj-valley', 'chail', 'patnitop', 'bhaderwah', 'kullu', 'pragpur', 'pangi-valley'];
    expect(Array.from(DESTINATIONS_WITHOUT_VERIFIED_IMAGE).sort()).toEqual(expected.sort());
  });
});
