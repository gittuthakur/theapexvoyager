import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { omitEmptyPhotos } from '@/lib/placeCachePreserve';
import { PlaceCache } from '@/models/PlaceCache';

const base = { placeId: 'p1', name: 'Hotel', destinationSlug: 'manali', stayType: 'hotel', searchLocation: 'Manali', locationClassification: 'exact' };

describe('omitEmptyPhotos', () => {
  it('existing photos + incoming empty photos: photos is dropped from the update', () => {
    expect(omitEmptyPhotos({ ...base, photos: [] })).not.toHaveProperty('photos');
  });
  it('existing photos + incoming new photos: returned unchanged', () => {
    const doc = { ...base, photos: ['/api/places/photo?name=a'] };
    expect(omitEmptyPhotos(doc)).toBe(doc);
  });
  it('photos missing entirely: unchanged shape', () => {
    expect(omitEmptyPhotos({ ...base, photos: undefined })).not.toHaveProperty('photos');
  });
  it('does not mutate its input', () => {
    const doc = { ...base, photos: [] as string[] };
    omitEmptyPhotos(doc);
    expect(doc).toHaveProperty('photos');
  });
});

// Casts the real PlaceCache update with the real schema (no database connection is made).
describe('PlaceCache update as Mongoose will cast it (real schema, no DB)', () => {
  function cast(update: Record<string, unknown>) {
    const q = (PlaceCache as mongoose.Model<unknown>).findOneAndUpdate({ placeId: 'p1' }, update, { upsert: true });
    return (q as unknown as { _castUpdate: (u: unknown) => Record<string, Record<string, unknown>> })._castUpdate((q as unknown as { _update: unknown })._update);
  }

  it('no existing photos + incoming empty photos: insert gets the schema default [], $set has no photos', () => {
    const cleaned = omitEmptyPhotos({ ...base, photos: [] });
    const castUpdate = cast(cleaned);
    expect(castUpdate.$set).not.toHaveProperty('photos');
    expect((PlaceCache.schema.path('photos') as unknown as { options: { default: unknown } }).options.default).toEqual([]);
  });

  it('missing rating / review count (undefined) are stripped, so they cannot overwrite stored values', () => {
    const castUpdate = cast(omitEmptyPhotos({ ...base, photos: [], rating: undefined, userRatingCount: undefined }));
    expect(castUpdate.$set).not.toHaveProperty('rating');
    expect(castUpdate.$set).not.toHaveProperty('userRatingCount');
  });

  it('a provided rating and review count are still set', () => {
    const castUpdate = cast(omitEmptyPhotos({ ...base, photos: ['x'], rating: 4.5, userRatingCount: 10 }));
    expect(castUpdate.$set).toMatchObject({ rating: 4.5, userRatingCount: 10, photos: ['x'] });
  });

  it('the unique key is unchanged: placeId + destinationSlug + stayType', () => {
    const unique = PlaceCache.schema.indexes().find(([, opts]) => (opts as { unique?: boolean }).unique);
    expect(unique?.[0]).toEqual({ placeId: 1, destinationSlug: 1, stayType: 1 });
  });
});
