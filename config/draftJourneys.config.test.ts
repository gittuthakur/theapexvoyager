import { describe, expect, it } from 'vitest';
import { draftJourneys } from './draftJourneys.config';
import { destinations } from './destinations.config';
import { packages } from './packages.config';

const REAL_DESTINATION_SLUGS = new Set(destinations.map((d) => d.slug));
const LIVE_PACKAGE_SLUGS = new Set(packages.map((p) => p.slug));

describe('config/draftJourneys.config.ts — content integrity (Phase 2 brief, Part 9/11)', () => {
  it('every draft is explicitly status: draft', () => {
    for (const journey of draftJourneys) {
      expect(journey.status).toBe('draft');
    }
  });

  it('every destinationSlugs entry resolves to a real, curated destination — never an invented slug', () => {
    for (const journey of draftJourneys) {
      for (const slug of journey.destinationSlugs ?? []) {
        expect(REAL_DESTINATION_SLUGS.has(slug), `"${slug}" on ${journey.slug} is not a real destination slug`).toBe(true);
      }
    }
  });

  it('no draft slug collides with a live, published package slug', () => {
    for (const journey of draftJourneys) {
      expect(LIVE_PACKAGE_SLUGS.has(journey.slug), `draft "${journey.slug}" collides with a live package slug`).toBe(false);
    }
  });

  it('no two drafts share the same slug', () => {
    const slugs = draftJourneys.map((j) => j.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('no draft carries a price, inclusions, or exclusions — commercial approval is explicitly out of scope this phase', () => {
    for (const journey of draftJourneys) {
      expect(journey.price).toBeUndefined();
      expect(journey.inclusions).toEqual([]);
      expect(journey.exclusions).toEqual([]);
    }
  });

  it('the previously-identified duplicate ("a second, Spiti-only Adventure package") was NOT added — Kinnaur Spiti Circuit legitimately covers spiti-valley too, but nothing else does', () => {
    const spitiRelatedDrafts = draftJourneys.filter((j) => j.destinationSlugs?.includes('spiti-valley'));
    expect(spitiRelatedDrafts.map((j) => j.slug)).toEqual(['kinnaur-spiti-circuit']);
  });

  it('contains exactly the 11 non-duplicate packages from the Phase 2 brief (12 proposed, 1 stopped)', () => {
    expect(draftJourneys).toHaveLength(11);
  });
});
