import { describe, expect, it } from 'vitest';
import { assertDraftTarget, COMMERCIAL_FIELDS, TARGET_PRICES } from './seedPhase6Batch2CommercialData';

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

  it('never writes status or route fields', () => {
    expect(Object.keys(TARGET_PRICES)).toHaveLength(8);
    for (const field of ['status', 'itinerary', 'duration', 'destinationSlugs', 'startingCity', 'endingCity']) {
      expect(COMMERCIAL_FIELDS).not.toContain(field);
    }
  });
});
