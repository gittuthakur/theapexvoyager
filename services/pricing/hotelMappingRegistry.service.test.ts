import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));

interface FakeDoc {
  _id: string;
  googlePlaceId: string;
  destinationSlug: string;
  provider: string;
  providerHotelId: string;
  status: 'PENDING_REVIEW' | 'CONFIRMED' | 'REJECTED' | 'DISABLED';
  hasCoordinateAnomaly: boolean;
  nameSimilarity: number;
  distanceMeters?: number;
  googleHotelName: string;
  providerHotelName: string;
  confirmedBy?: string;
  confirmedAt?: Date;
  save: () => Promise<void>;
}

let store: FakeDoc[] = [];
let nextId = 1;

function matches(doc: FakeDoc, query: Record<string, unknown>): boolean {
  return Object.entries(query).every(([key, value]) => {
    if (key === '_id' && value && typeof value === 'object' && '$ne' in (value as object)) {
      return doc._id !== (value as { $ne: string }).$ne;
    }
    return (doc as unknown as Record<string, unknown>)[key] === value;
  });
}

function makeDoc(partial: Partial<FakeDoc> & { googlePlaceId: string; provider: string; providerHotelId: string }): FakeDoc {
  const doc: FakeDoc = {
    _id: String(nextId++),
    destinationSlug: 'manali',
    status: 'PENDING_REVIEW',
    hasCoordinateAnomaly: false,
    nameSimilarity: 1,
    googleHotelName: 'Test Google Hotel',
    providerHotelName: 'Test Provider Hotel',
    ...partial,
    save: async () => {}
  };
  return doc;
}

vi.mock('@/models/HotelProviderMapping', () => ({
  HotelProviderMapping: {
    // Mongoose's real findOne() returns a thenable Query that also exposes `.lean()` —
    // some callers `await` it directly (confirmMapping/rejectMapping/disableMapping/
    // createPendingCandidate, which need the live document to call `.save()` on), others
    // chain `.lean()` (getConfirmedMapping). This fake supports both on the same call.
    findOne: vi.fn((query: Record<string, unknown>) => {
      const result = store.find((doc) => matches(doc, query)) ?? null;
      const promise = Promise.resolve(result) as Promise<FakeDoc | null> & { lean: () => Promise<FakeDoc | null> };
      promise.lean = async () => result;
      return promise;
    }),
    findById: vi.fn(async (id: string) => store.find((doc) => doc._id === id) ?? null),
    find: vi.fn((query: Record<string, unknown>) => ({
      sort: () => ({
        lean: async () => store.filter((doc) => matches(doc, query))
      })
    })),
    create: vi.fn(async (input: Partial<FakeDoc> & { googlePlaceId: string; provider: string; providerHotelId: string }) => {
      const doc = makeDoc(input);
      store.push(doc);
      return doc;
    })
  }
}));

const { createPendingCandidate, getConfirmedMapping, getMappingCandidates, confirmMapping, rejectMapping, disableMapping } = await import(
  './hotelMappingRegistry.service'
);

const BASE_INPUT = {
  googlePlaceId: 'ChIJ_google_1',
  destinationSlug: 'manali',
  provider: 'hbx' as const,
  providerHotelId: '142378',
  providerDestinationCode: 'IN6',
  googleHotelName: 'Snow Valley Resort',
  providerHotelName: 'Snow Valley Resorts',
  nameSimilarity: 0.9,
  distanceMeters: 50,
  hasCoordinateAnomaly: false
};

beforeEach(() => {
  store = [];
  nextId = 1;
});

describe('createPendingCandidate', () => {
  it('a new candidate always starts PENDING_REVIEW, regardless of confidence', async () => {
    const result = await createPendingCandidate(BASE_INPUT);
    expect(result.created).toBe(true);
    if (result.created) expect(result.mapping.status).toBe('PENDING_REVIEW');
  });

  it('is extensible to a non-HBX provider — no HBX-specific branching', async () => {
    const result = await createPendingCandidate({ ...BASE_INPUT, provider: 'booking', providerHotelId: 'BK123' });
    expect(result.created).toBe(true);
  });

  it('refreshes an existing PENDING_REVIEW row instead of duplicating it', async () => {
    await createPendingCandidate(BASE_INPUT);
    const second = await createPendingCandidate({ ...BASE_INPUT, nameSimilarity: 0.95 });
    expect(second).toMatchObject({ created: true, refreshed: true });
    expect(store).toHaveLength(1);
  });

  it('never overwrites an already-CONFIRMED row for the same triple', async () => {
    store.push(makeDoc({ ...BASE_INPUT, status: 'CONFIRMED' }));
    const result = await createPendingCandidate(BASE_INPUT);
    expect(result).toEqual({ created: false, reason: 'already_confirmed' });
  });

  it('never overwrites a REJECTED/DISABLED row either', async () => {
    store.push(makeDoc({ ...BASE_INPUT, status: 'REJECTED' }));
    const result = await createPendingCandidate(BASE_INPUT);
    expect(result).toEqual({ created: false, reason: 'already_terminal' });
  });
});

describe('getConfirmedMapping', () => {
  it('returns null when no mapping exists', async () => {
    expect(await getConfirmedMapping({ googlePlaceId: 'x', provider: 'hbx' })).toBeNull();
  });

  it('returns null for a PENDING_REVIEW mapping — pending must resolve to no mapping', async () => {
    store.push(makeDoc(BASE_INPUT));
    expect(await getConfirmedMapping({ googlePlaceId: BASE_INPUT.googlePlaceId, provider: 'hbx' })).toBeNull();
  });

  it('returns null for a REJECTED mapping', async () => {
    store.push(makeDoc({ ...BASE_INPUT, status: 'REJECTED' }));
    expect(await getConfirmedMapping({ googlePlaceId: BASE_INPUT.googlePlaceId, provider: 'hbx' })).toBeNull();
  });

  it('returns the row only once CONFIRMED', async () => {
    store.push(makeDoc({ ...BASE_INPUT, status: 'CONFIRMED' }));
    const found = await getConfirmedMapping({ googlePlaceId: BASE_INPUT.googlePlaceId, provider: 'hbx' });
    expect(found?.providerHotelId).toBe('142378');
  });
});

describe('confirmMapping', () => {
  it('a HIGH_CONFIDENCE-worthy candidate does not auto-confirm — only this explicit call can', async () => {
    const doc = makeDoc(BASE_INPUT);
    store.push(doc);
    expect(doc.status).toBe('PENDING_REVIEW');

    const result = await confirmMapping({ mappingId: doc._id, confirmedBy: 'ops@apexvoyager.test' });
    expect(result).toMatchObject({ confirmed: true });
    expect(doc.status).toBe('CONFIRMED');
    expect(doc.confirmedBy).toBe('ops@apexvoyager.test');
  });

  it('refuses a coordinate-anomaly-flagged row even if somehow PENDING_REVIEW', async () => {
    const doc = makeDoc({ ...BASE_INPUT, hasCoordinateAnomaly: true });
    store.push(doc);
    const result = await confirmMapping({ mappingId: doc._id, confirmedBy: 'ops' });
    expect(result).toEqual({ confirmed: false, reason: 'coordinate_anomaly' });
    expect(doc.status).toBe('PENDING_REVIEW');
  });

  it('refuses to confirm a row that is not PENDING_REVIEW (e.g. already REJECTED)', async () => {
    const doc = makeDoc({ ...BASE_INPUT, status: 'REJECTED' });
    store.push(doc);
    const result = await confirmMapping({ mappingId: doc._id, confirmedBy: 'ops' });
    expect(result).toEqual({ confirmed: false, reason: 'invalid_status' });
  });

  it('duplicate/conflict safety: refuses when the same Google place is already confirmed to a different provider hotel', async () => {
    store.push(makeDoc({ ...BASE_INPUT, providerHotelId: '999999', status: 'CONFIRMED' }));
    const candidate = makeDoc(BASE_INPUT);
    store.push(candidate);

    const result = await confirmMapping({ mappingId: candidate._id, confirmedBy: 'ops' });
    expect(result).toEqual({ confirmed: false, reason: 'conflict_google_place' });
    expect(candidate.status).toBe('PENDING_REVIEW');
  });

  it('duplicate/conflict safety: refuses when the same provider hotel is already confirmed to a different Google place in this destination', async () => {
    store.push(makeDoc({ ...BASE_INPUT, googlePlaceId: 'ChIJ_other_google', status: 'CONFIRMED' }));
    const candidate = makeDoc(BASE_INPUT);
    store.push(candidate);

    const result = await confirmMapping({ mappingId: candidate._id, confirmedBy: 'ops' });
    expect(result).toEqual({ confirmed: false, reason: 'conflict_provider_hotel' });
  });

  it('returns not_found for an unknown id', async () => {
    expect(await confirmMapping({ mappingId: 'does-not-exist', confirmedBy: 'ops' })).toEqual({ confirmed: false, reason: 'not_found' });
  });
});

describe('rejectMapping', () => {
  it('rejects a PENDING_REVIEW mapping', async () => {
    const doc = makeDoc(BASE_INPUT);
    store.push(doc);
    const result = await rejectMapping({ mappingId: doc._id });
    expect(result).toMatchObject({ rejected: true });
    expect(doc.status).toBe('REJECTED');
  });

  it('allows correcting a previously-CONFIRMED mapping to REJECTED', async () => {
    const doc = makeDoc({ ...BASE_INPUT, status: 'CONFIRMED' });
    store.push(doc);
    const result = await rejectMapping({ mappingId: doc._id });
    expect(result).toMatchObject({ rejected: true });
  });

  it('refuses to reject an already-DISABLED mapping', async () => {
    const doc = makeDoc({ ...BASE_INPUT, status: 'DISABLED' });
    store.push(doc);
    expect(await rejectMapping({ mappingId: doc._id })).toEqual({ rejected: false, reason: 'invalid_status' });
  });
});

describe('disableMapping', () => {
  it('disables a CONFIRMED mapping', async () => {
    const doc = makeDoc({ ...BASE_INPUT, status: 'CONFIRMED' });
    store.push(doc);
    const result = await disableMapping({ mappingId: doc._id });
    expect(result).toMatchObject({ disabled: true });
    expect(doc.status).toBe('DISABLED');
  });

  it('refuses to disable a PENDING_REVIEW mapping (nothing confirmed to turn off)', async () => {
    const doc = makeDoc(BASE_INPUT);
    store.push(doc);
    expect(await disableMapping({ mappingId: doc._id })).toEqual({ disabled: false, reason: 'invalid_status' });
  });
});

describe('getMappingCandidates', () => {
  it('filters by status/destination/provider', async () => {
    store.push(makeDoc(BASE_INPUT));
    store.push(makeDoc({ ...BASE_INPUT, googlePlaceId: 'ChIJ_2', status: 'CONFIRMED' }));

    const pending = await getMappingCandidates({ status: 'PENDING_REVIEW', destinationSlug: 'manali', provider: 'hbx' });
    expect(pending).toHaveLength(1);
    expect(pending[0].googlePlaceId).toBe(BASE_INPUT.googlePlaceId);
  });
});
