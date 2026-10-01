import { describe, expect, it } from 'vitest';
import { TARGET, assertTarget, assertAllowedFields, correctedItinerary, prepareValues, unchangedOutsidePlan } from './preparePhase10Kinnaur';
import { draftJourneys } from '../config/draftJourneys.config';
import { Journey } from '../models/Journey';
import { getCommercialBlockers } from '../lib/journeyCommercialReadiness';

const original = draftJourneys.find(j => j.slug === TARGET)!;
const image = '/images/destination-sangla-valley.jpg';

describe('Phase 10 Kinnaur commercial update', () => {
  it('refuses every other draft, published records and protected fields', () => {
    for (const j of draftJourneys) {
      if (j.slug === TARGET) expect(() => assertTarget(j.slug, 'draft')).not.toThrow();
      else expect(() => assertTarget(j.slug, 'draft')).toThrow();
      expect(() => assertTarget(j.slug, 'published')).toThrow();
    }
    for (const field of ['status', 'slug', 'duration', 'destinationSlugs', 'importantNotes', 'updatedAt', 'priceBasis']) {
      expect(() => assertAllowedFields({ [field]: 'changed' })).toThrow();
    }
  });
  it('changes only days 4, 6 and 7, preserves subdocument metadata and is idempotent', () => {
    const days = original.itinerary.map(day => ({ ...day, _id: `preserved-${day.day}` }));
    const saved = structuredClone(days);
    const corrected = correctedItinerary(days);
    expect(days).toEqual(saved);
    expect(corrected.filter((day, i) => day.description !== days[i].description).map(day => day.day)).toEqual([4, 6, 7]);
    for (const day of corrected) expect(day._id).toBe(`preserved-${day.day}`);
    expect(correctedItinerary(corrected)).toEqual(corrected);
    expect(corrected[3].description).toContain('Overnight in Kalpa');
    expect(corrected[5].description).toContain('Overnight in Narkanda');
    expect(corrected[6].description).toContain('Narkanda to Shimla');
    for (const index of [0, 3, 4, 5, 6]) {
      expect(() => correctedItinerary(days.map((day, i) => i === index ? { ...day, description: 'Unreviewed route' } : day))).toThrow();
    }
    expect(() => correctedItinerary(days.slice(1))).toThrow();
  });
  it('refuses route, duration, gateway and commercial conflicts', () => {
    for (const changes of [{ duration: '7 Nights / 8 Days' }, { destinationSlugs: ['spiti-valley'] }, { endingCity: 'Delhi' }, { price: 25000 }, { image: '/images/other.jpg' }]) {
      expect(() => prepareValues({ ...original, ...changes }, image)).toThrow();
    }
  });
  it('passes real document validation with only owner approval outstanding and never publishes', async () => {
    const saved = structuredClone(original);
    const values = prepareValues(original, image);
    const record = { ...original, ...values };
    const draft = Journey.hydrate(record);
    await expect(draft.validate()).resolves.toBeUndefined();
    expect(getCommercialBlockers(draft)).toEqual(['OWNER_APPROVAL_REQUIRED']);
    expect(draft.status).toBe('draft');
    draft.status = 'published';
    await expect(draft.validate()).resolves.toBeUndefined();
    expect(original).toEqual(saved);
    expect(record.status).toBe('draft');
    expect(prepareValues(record, image)).toEqual(values);
    expect(values.price).toBe(22999);
    expect(values.hotelCategoryDescription).toContain('Nights 4 and 5');
    expect(values.transportType).toContain('not guaranteed');
    expect(values).not.toHaveProperty('status');
  });
  it('detects unexpected timestamp, status, unrelated-day and non-target changes', () => {
    const values = prepareValues(original, image);
    expect(unchangedOutsidePlan(original, { ...original, ...values }, values)).toBe(true);
    for (const extra of [{ status: 'published' }, { updatedAt: 'changed' }, { importantNotes: ['changed'] }, { itinerary: [] }]) {
      expect(unchangedOutsidePlan(original, { ...original, ...values, ...extra }, values)).toBe(false);
    }
    expect(unchangedOutsidePlan({ status: 'draft' }, { status: 'published' }, {})).toBe(false);
  });
});
