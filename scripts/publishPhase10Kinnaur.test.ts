import { describe, expect, it } from 'vitest';
import { draftJourneys } from '../config/draftJourneys.config';
import { PUBLICATION_SLUG, publicationUpdate, validatePublishedDocument } from './publishPhase10Kinnaur';

describe('Phase 10A Kinnaur publication guard', () => {
  it('allows only the exact Kinnaur slug and mutates status only', () => {
    expect(PUBLICATION_SLUG).toBe('kinnaur-valley-tour');
    expect(publicationUpdate(PUBLICATION_SLUG)).toEqual({ $set: { status: 'published' } });
    expect(() => publicationUpdate('other')).toThrow('Unknown publication slug');
  });

  it('accepts a publication-ready Kinnaur record and rejects incomplete commercial data', async () => {
    const source = draftJourneys.find(j => j.slug === PUBLICATION_SLUG)!;
    const ready = {
      ...source,
      status: 'draft',
      price: 22999,
      image: '/images/destination-sangla-valley.jpg',
      inclusions: ['Includes room, meals and transport'],
      exclusions: ['Excludes flights and personal spending'],
      hotelCategoryDescription: 'Standard/Deluxe hotel or guesthouse equivalent',
      pickupInfo: 'Pickup in Shimla',
      dropInfo: 'Drop in Shimla',
      mealPlan: 'Breakfast and dinner where operationally provided',
      transportType: 'Private hill-road vehicle for approved sectors',
      minTravellers: 2,
      roomsIncluded: 1,
      usesGeneralCancellationPolicy: true
    };

    await expect(validatePublishedDocument(ready)).resolves.toBeUndefined();

    await expect(validatePublishedDocument({ ...ready, price: 0 })).rejects.toThrow();
  });

  it('is idempotent when Kinnaur is already published', () => {
    const record = { slug: PUBLICATION_SLUG, status: 'published', price: 22999, image: '/images/destination-sangla-valley.jpg' };
    expect(publicationUpdate(PUBLICATION_SLUG)).toEqual({ $set: { status: 'published' } });
    expect(record.status).toBe('published');
    expect(record.price).toBe(22999);
  });
});
