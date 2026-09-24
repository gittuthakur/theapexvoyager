import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));

const placeCacheDocs = [
  // Exact-name, tight-coordinate match -> should reach HIGH_CONFIDENCE and be persisted.
  { placeId: 'ChIJ_wingait', name: 'Wingait Inn', latitude: 31.10306, longitude: 77.15174 },
  // Genuinely unrelated -> NO_MATCH, must never be persisted.
  { placeId: 'ChIJ_unrelated', name: 'Zzz Totally Unrelated Guesthouse', latitude: 10, longitude: 10 },
  // Same real-world anomaly captured in the 2026-09-24 diagnostic: strong name match,
  // coordinates ~380km away (an HBX data error, not the same property) -> must never be
  // auto-persisted even though the name alone would otherwise look promising.
  { placeId: 'ChIJ_dragon', name: 'The Grand Dragon Hotel', latitude: 32.2, longitude: 77.19 }
];

vi.mock('@/models/PlaceCache', () => ({
  PlaceCache: {
    find: vi.fn(() => ({
      limit: () => ({
        lean: async () => placeCacheDocs
      })
    }))
  }
}));

const hbxHotels = [
  { hbxCode: 344077, name: 'Wingait Inn', destinationCode: 'SLV', latitude: 31.10306, longitude: 77.15174 },
  { hbxCode: 698769, name: 'The Grand Dragon Hotel', destinationCode: 'SLV', latitude: 34.156549, longitude: 77.580444 }
];

vi.mock('./hbxHotels.service', () => ({
  getSampleHotelsForDestination: vi.fn().mockResolvedValue(hbxHotels)
}));

const createPendingCandidateMock = vi.fn().mockResolvedValue({ created: true, refreshed: false, mapping: {} });
vi.mock('../../pricing/hotelMappingRegistry.service', () => ({ createPendingCandidate: createPendingCandidateMock }));

const { generateHbxCandidatesForDestination } = await import('./hbxMappingCandidates.service');

describe('generateHbxCandidatesForDestination', () => {
  beforeEach(() => {
    createPendingCandidateMock.mockClear();
  });

  it('fails safe for a destination with no verified HBX mapping — never guesses a code, never touches the network', async () => {
    const result = await generateHbxCandidatesForDestination('kinnaur');
    expect(result).toEqual({ ok: false, error: expect.stringContaining('kinnaur') });
    expect(createPendingCandidateMock).not.toHaveBeenCalled();
  });

  it('persists the qualifying candidate, skips NO_MATCH, and never persists a coordinate anomaly', async () => {
    const result = await generateHbxCandidatesForDestination('shimla');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.summary.skippedNoMatch).toBe(1);
    expect(result.summary.skippedCoordinateAnomaly).toBe(1);
    expect(result.summary.created).toBe(1);

    expect(createPendingCandidateMock).toHaveBeenCalledTimes(1);
    expect(createPendingCandidateMock).toHaveBeenCalledWith(
      expect.objectContaining({ googlePlaceId: 'ChIJ_wingait', provider: 'hbx', providerHotelId: '344077', hasCoordinateAnomaly: false })
    );
  });

  it('never calls the HBX Booking/Availability endpoint — content mapping only', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await generateHbxCandidatesForDestination('shimla');

    expect(fetchSpy).not.toHaveBeenCalled(); // getSampleHotelsForDestination is mocked above; a real call would go through fetch.
    vi.unstubAllGlobals();
  });
});
