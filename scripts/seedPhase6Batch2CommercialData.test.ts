import { describe, expect, it } from 'vitest';
import { assertDraftTarget, buildCommercialUpdate, COMMERCIAL_FIELDS, TARGET_PRICES } from './seedPhase6Batch2CommercialData';
import { draftJourneys } from '../config/draftJourneys.config';

describe('Phase 6 update boundaries', () => {
  it('refuses published, missing-status and out-of-scope records', () => {
    for (const slug of Object.keys(TARGET_PRICES)) {
      expect(() => assertDraftTarget(slug, 'draft')).not.toThrow();
      expect(() => assertDraftTarget(slug, 'published')).toThrow();
      expect(() => assertDraftTarget(slug, undefined)).toThrow();
    }
    expect(() => assertDraftTarget('manali-premium-escape', 'draft')).toThrow();
    expect(() => assertDraftTarget('leh-nubra-pangong-tour', 'draft')).toThrow();
  });

  it('keeps status and itinerary out of the shared update fields', () => {
    expect(Object.keys(TARGET_PRICES)).toHaveLength(8);
    for (const field of ['status', 'itinerary', 'duration', 'destinationSlugs', 'startingCity', 'endingCity', 'priceBasis', 'hotelCategoryDescription']) {
      expect(COMMERCIAL_FIELDS).not.toContain(field);
    }
  });

  it('limits the separately authorized gateway correction to the trek', () => {
    for (const config of draftJourneys.filter(j => j.slug in TARGET_PRICES)) {
      const values = buildCommercialUpdate(config);
      expect(values).not.toHaveProperty('status');
      expect(values).not.toHaveProperty('itinerary');
      if (config.slug === 'valley-of-flowers-hemkund-sahib-trek') {
        expect(values.startingCity).toBe('Joshimath');
        expect(values.endingCity).toBe('Joshimath');
        expect(() => buildCommercialUpdate({ ...config, startingCity: 'Rishikesh' })).toThrow();
      } else {
        expect(values).not.toHaveProperty('startingCity');
        expect(values).not.toHaveProperty('endingCity');
      }
    }
  });
});
