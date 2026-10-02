import { describe, expect, it } from 'vitest';
import { TARGET, PUBLICATION_SLUGS, publicationUpdate, publishedRecord, validatePublicationTarget } from './publishPhase11CGulmarg';
import { draftJourneys } from '../config/draftJourneys.config';
import { GULMARG_WINTER_IMAGE } from '../config/imageCredits.config';
import { Journey } from '../models/Journey';
import { getCommercialBlockers } from '../lib/journeyCommercialReadiness';

const source = draftJourneys.find((row) => row.slug === TARGET)!;
const approvedRecord = {
  ...source,
  status: 'draft',
  price: 19999,
  pickupInfo: 'Pickup from Srinagar Airport.',
  dropInfo: 'Drop at Srinagar Airport.',
  mealPlan: '3 breakfasts and 3 dinners, subject to the confirmed property schedule.',
  transportType: 'Approved road transfers from Srinagar Airport to Gulmarg and Gulmarg back to Srinagar Airport.',
  minTravellers: 2,
  roomsIncluded: 1,
  hotelCategoryDescription: '3 nights in a Standard/Deluxe winter-operating Gulmarg hotel or equivalent, double sharing.',
  inclusions: ['3 nights accommodation', '3 breakfasts', '3 dinners'],
  exclusions: ['Gondola tickets', 'Skiing', 'Snowboarding', 'Equipment', 'Instructors', 'Sledging', 'Snowmobile activities', 'Local snow vehicles'],
  image: GULMARG_WINTER_IMAGE,
  usesGeneralCancellationPolicy: true,
  itinerary: source.itinerary.map((day) => {
    if (day.day === 2) {
      return { ...day, description: 'Gondola visit/ride is optional and separately payable, subject to operations, weather, availability and applicable local rules.' };
    }
    if (day.day === 3) {
      return { ...day, description: 'Skiing, snowboarding, sledging, snowmobile and other snow activities are optional and separately payable unless specifically included in a final written quotation. Weather, road conditions, temporary closures, local restrictions and operational conditions may require itinerary changes. Snowfall and uninterrupted access are not guaranteed.' };
    }
    return { ...day };
  })
};

describe('Phase 11C exact Gulmarg publication', () => {
  it('allowlists exactly one slug and permits only a status update', () => {
    expect(PUBLICATION_SLUGS).toEqual(['gulmarg-winter-escape']);
    expect(publicationUpdate(TARGET)).toEqual({ $set: { status: 'published' } });
    for (const journey of draftJourneys) {
      if (journey.slug !== TARGET) expect(() => publicationUpdate(journey.slug)).toThrow();
    }
    expect(Object.keys(publicationUpdate(TARGET).$set)).toEqual(['status']);
  });

  it('accepts only the verified approved commercial and safety state', () => {
    expect(validatePublicationTarget(approvedRecord).blockers).toEqual(['OWNER_APPROVAL_REQUIRED']);
    for (const invalid of [
      { slug: 'other-journey' },
      { price: 20000 },
      { duration: '4 Nights / 5 Days' },
      { startingCity: 'Delhi' },
      { image: '/images/green-meadow.jpg' },
      { exclusions: ['Flights'] },
      { itinerary: approvedRecord.itinerary.map((day, index) => index === 1 ? { ...day, description: 'Gondola ticket included.' } : day) },
      { itinerary: approvedRecord.itinerary.map((day, index) => index === 2 ? { ...day, description: 'Skiing included; snowfall guaranteed.' } : day) }
    ]) {
      expect(() => validatePublicationTarget({ ...approvedRecord, ...invalid })).toThrow();
    }
  });

  it('changes only status on a candidate and validates the published document without mutating the source', async () => {
    const before = structuredClone(approvedRecord);
    const published = publishedRecord(approvedRecord);
    expect(published.status).toBe('published');
    expect({ ...published, status: 'draft' }).toEqual(before);
    expect(approvedRecord).toEqual(before);
    expect(getCommercialBlockers(published as Parameters<typeof getCommercialBlockers>[0])).toEqual([]);
    await expect(Journey.hydrate(published).validate()).resolves.toBeUndefined();
  });
});