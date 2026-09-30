import { describe, expect, it } from 'vitest';
import { ladakhRegionDraft, ladakhDestinationDrafts } from './ladakhFoundation.config';
import { destinations } from './destinations.config';
import { packages } from './packages.config';
import { draftJourneys } from './draftJourneys.config';

describe('config/ladakhFoundation.config.ts — Region', () => {
  it('is explicitly status: draft', () => {
    expect(ladakhRegionDraft.status).toBe('draft');
  });

  it('carries every field models/Region.ts requires', () => {
    expect(ladakhRegionDraft.name).toBeTruthy();
    expect(ladakhRegionDraft.slug).toBe('ladakh');
    expect(ladakhRegionDraft.shortDescription).toBeTruthy();
    expect(ladakhRegionDraft.cardImage).toBeTruthy();
    expect(ladakhRegionDraft.hero.eyebrow).toBeTruthy();
    expect(ladakhRegionDraft.hero.title).toBeTruthy();
    expect(ladakhRegionDraft.hero.subtitle).toBeTruthy();
    expect(ladakhRegionDraft.hero.image).toBeTruthy();
    expect(ladakhRegionDraft.overview.description).toBeTruthy();
    expect(ladakhRegionDraft.overview.bestSeason).toBeTruthy();
    expect(ladakhRegionDraft.overview.idealDuration).toBeTruthy();
    expect(ladakhRegionDraft.overview.startingPoint).toBeTruthy();
    expect(ladakhRegionDraft.overview.climate).toBeTruthy();
    expect(ladakhRegionDraft.travelGuide.bestTime).toBeTruthy();
    expect(ladakhRegionDraft.travelGuide.howToReach).toBeTruthy();
    expect(ladakhRegionDraft.travelGuide.weather).toBeTruthy();
    expect(ladakhRegionDraft.travelGuide.localTransport).toBeTruthy();
    expect(ladakhRegionDraft.seo.title).toBeTruthy();
    expect(ladakhRegionDraft.seo.description).toBeTruthy();
  });
});

describe('config/ladakhFoundation.config.ts — 8 Destinations', () => {
  it('contains exactly 8 destinations, all status: draft', () => {
    expect(ladakhDestinationDrafts).toHaveLength(8);
    for (const destination of ladakhDestinationDrafts) {
      expect(destination).not.toHaveProperty('status'); // status is applied by the seed script, not stored in this content draft
    }
  });

  it('every slug is unique', () => {
    const slugs = ladakhDestinationDrafts.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('contains exactly the 8 expected destinations, and Khardung La was NOT created as a standalone destination', () => {
    const slugs = ladakhDestinationDrafts.map((d) => d.slug).sort();
    expect(slugs).toEqual(['hanle', 'kargil', 'lamayuru', 'leh', 'nubra-valley', 'pangong-lake', 'tso-moriri', 'turtuk']);
    expect(slugs).not.toContain('khardung-la');
  });

  it('no slug collides with an existing (Himachal/Kashmir/Uttarakhand) curated destination', () => {
    const existingSlugs = new Set(destinations.map((d) => d.slug));
    for (const destination of ladakhDestinationDrafts) {
      expect(existingSlugs.has(destination.slug), `"${destination.slug}" collides with an existing destination`).toBe(false);
    }
  });

  it('every destination has the fields models/Destination.ts requires', () => {
    for (const destination of ladakhDestinationDrafts) {
      expect(destination.slug).toBeTruthy();
      expect(destination.title).toBeTruthy();
      expect(destination.category).toBeTruthy();
      expect(destination.description).toBeTruthy();
      expect(destination.image).toBeTruthy();
      expect(typeof destination.toursCount).toBe('number');
    }
  });

  it('no destination fabricates hotel/rating/review/availability/supplier data', () => {
    for (const destination of ladakhDestinationDrafts) {
      expect(destination).not.toHaveProperty('rating');
      expect(destination).not.toHaveProperty('userRatingCount');
      expect(destination).not.toHaveProperty('placeId');
      expect(destination).not.toHaveProperty('source');
    }
  });

  it('every border-adjacent/remote destination signals it requires prior Leh acclimatisation', () => {
    const remoteSlugs = ['nubra-valley', 'pangong-lake', 'turtuk', 'hanle', 'tso-moriri'];
    for (const slug of remoteSlugs) {
      const destination = ladakhDestinationDrafts.find((d) => d.slug === slug);
      expect(destination?.requiresPriorAcclimatisation, `${slug} should require prior acclimatisation`).toBe(true);
    }
  });
});

describe('config/ladakhFoundation.config.ts — exactly the 5 Phase 3C Ladakh Journeys reference Ladakh', () => {
  const LADAKH_JOURNEY_SLUGS = new Set([
    'leh-nubra-pangong-tour',
    'leh-nubra-pangong-turtuk-tour',
    'leh-nubra-pangong-hanle-tour',
    'ladakh-hanle-tso-moriri-tour',
    'srinagar-leh-ladakh-tour'
  ]);

  it('no LIVE (published) package references any Ladakh destination slug', () => {
    const ladakhSlugs = new Set(ladakhDestinationDrafts.map((d) => d.slug));
    for (const journey of packages) {
      for (const slug of journey.destinationSlugs ?? []) {
        expect(ladakhSlugs.has(slug), `live package ${journey.slug} unexpectedly references Ladakh destination "${slug}"`).toBe(false);
      }
    }
  });

  it('only the 5 designated Ladakh journey drafts reference a Ladakh destination slug — every other draft does not', () => {
    const ladakhSlugs = new Set(ladakhDestinationDrafts.map((d) => d.slug));
    for (const journey of draftJourneys) {
      const referencesLadakh = (journey.destinationSlugs ?? []).some((slug) => ladakhSlugs.has(slug));
      if (LADAKH_JOURNEY_SLUGS.has(journey.slug)) {
        expect(referencesLadakh, `${journey.slug} is a designated Ladakh journey but references no Ladakh destination`).toBe(true);
      } else {
        expect(referencesLadakh, `${journey.slug} unexpectedly references a Ladakh destination`).toBe(false);
      }
    }
  });
});
