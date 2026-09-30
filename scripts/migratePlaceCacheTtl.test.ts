import { describe, expect, it } from 'vitest';
import { findTtlIndexCandidates, type IndexInfo } from './migratePlaceCacheTtl';

describe('findTtlIndexCandidates — PlaceCache TTL migration safety', () => {
  it('matches the real updatedAt TTL index', () => {
    const indexes: IndexInfo[] = [
      { name: '_id_', key: { _id: 1 } },
      { name: 'destinationSlug_1_stayType_1_searchLocation_1', key: { destinationSlug: 1, stayType: 1, searchLocation: 1 } },
      { name: 'updatedAt_1', key: { updatedAt: 1 }, expireAfterSeconds: 2592000 }
    ];

    const matches = findTtlIndexCandidates(indexes);
    expect(matches).toHaveLength(1);
    expect(matches[0].name).toBe('updatedAt_1');
  });

  it('never matches an index on updatedAt that is NOT a TTL index (no expireAfterSeconds)', () => {
    const indexes: IndexInfo[] = [{ name: 'updatedAt_1', key: { updatedAt: 1 } }];
    expect(findTtlIndexCandidates(indexes)).toHaveLength(0);
  });

  it('never matches a TTL index on a different field, however similarly named', () => {
    const indexes: IndexInfo[] = [{ name: 'createdAt_1', key: { createdAt: 1 }, expireAfterSeconds: 120 }];
    expect(findTtlIndexCandidates(indexes)).toHaveLength(0);
  });

  it('never matches a compound index that happens to include updatedAt among other fields', () => {
    const indexes: IndexInfo[] = [{ name: 'destinationSlug_1_updatedAt_1', key: { destinationSlug: 1, updatedAt: 1 }, expireAfterSeconds: 2592000 }];
    expect(findTtlIndexCandidates(indexes)).toHaveLength(0);
  });

  it('reports zero matches (idempotent "already migrated") once the index is gone', () => {
    const indexes: IndexInfo[] = [
      { name: '_id_', key: { _id: 1 } },
      { name: 'destinationSlug_1_stayType_1_searchLocation_1', key: { destinationSlug: 1, stayType: 1, searchLocation: 1 } }
    ];
    expect(findTtlIndexCandidates(indexes)).toHaveLength(0);
  });

  it('surfaces more than one match rather than silently picking one, if that were ever possible', () => {
    const indexes: IndexInfo[] = [
      { name: 'updatedAt_1', key: { updatedAt: 1 }, expireAfterSeconds: 2592000 },
      { name: 'updatedAt_1_dup', key: { updatedAt: 1 }, expireAfterSeconds: 86400 }
    ];
    expect(findTtlIndexCandidates(indexes)).toHaveLength(2);
  });
});
