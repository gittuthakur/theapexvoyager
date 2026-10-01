import { describe, expect, it } from 'vitest';
import { TARGETS, assertTarget, assertAllowedFields, commercialValues, unchangedOutsidePlan } from './preparePhase9ACommercialData';
import { draftJourneys } from '../config/draftJourneys.config';
import { Journey } from '../models/Journey';
import { getCommercialBlockers } from '../lib/journeyCommercialReadiness';

describe('Phase 9A commercial boundaries', () => {
  it('refuses published records and all held/winter/non-target drafts', () => {
    expect(Object.keys(TARGETS)).toEqual(['dharamshala-mcleodganj-short-escape', 'grand-himachal-circuit']);
    for (const j of draftJourneys) {
      if (Object.prototype.hasOwnProperty.call(TARGETS, j.slug)) expect(() => assertTarget(j.slug, 'draft')).not.toThrow();
      else expect(() => assertTarget(j.slug, 'draft')).toThrow();
      expect(() => assertTarget(j.slug, 'published')).toThrow();
      expect(() => assertTarget(j.slug, undefined)).toThrow();
    }
  });
  it('rejects every protected field and limits endingCity correction to Pathankot on Dharamshala', () => {
    for (const slug of Object.keys(TARGETS)) {
      for (const field of ['status', 'slug', 'duration', 'itinerary', 'destinationSlugs', 'priceBasis', 'importantNotes', 'startingCity', 'updatedAt']) {
        expect(() => assertAllowedFields(slug, { [field]: 'changed' })).toThrow();
      }
    }
    expect(() => assertAllowedFields('grand-himachal-circuit', { endingCity: 'Pathankot' })).toThrow();
    expect(() => assertAllowedFields('dharamshala-mcleodganj-short-escape', { endingCity: 'Delhi' })).toThrow();
  });
  it('validates approved values and retains only owner approval without changing source routes', async () => {
    for (const [slug, target] of Object.entries(TARGETS)) {
      const source = draftJourneys.find(j => j.slug === slug)!;
      const saved = structuredClone(source);
      const values = commercialValues(slug, `/images/destination-${target.source}.jpg`);
      const candidate = Journey.hydrate({ ...source, ...values });
      await expect(candidate.validate()).resolves.toBeUndefined();
      expect(getCommercialBlockers(candidate)).toEqual(['OWNER_APPROVAL_REQUIRED']);
      expect(candidate.status).toBe('draft');
      expect(candidate.price).toBe(target.price);
      expect(source).toEqual(saved);
      expect(values.hotelCategoryDescription).toMatch(/double sharing/i);
      if (slug === 'grand-himachal-circuit') expect(values.transportType).toContain('long, dedicated transfer');
      else expect(values.endingCity).toBe('Pathankot');
    }
  });
  it('detects incidental status, timestamp and itinerary mutations in postchecks', () => {
    const before = { status: 'draft', price: undefined, updatedAt: 'original', itinerary: ['day1'] };
    const values = { price: 10999 };
    expect(unchangedOutsidePlan(before, { ...before, ...values }, values)).toBe(true);
    for (const bad of [{ status: 'published' }, { updatedAt: 'changed' }, { itinerary: ['changed'] }]) {
      expect(unchangedOutsidePlan(before, { ...before, ...values, ...bad }, values)).toBe(false);
    }
  });
});
