import { describe, expect, it, vi, beforeEach } from 'vitest';

const { findMock, findOneMock, createMock, findByIdMock } = vi.hoisted(() => ({
  findMock: vi.fn(),
  findOneMock: vi.fn(),
  createMock: vi.fn(),
  findByIdMock: vi.fn()
}));

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/ExcludedPlace', async () => {
  const actual = await vi.importActual<typeof import('@/models/ExcludedPlace')>('@/models/ExcludedPlace');
  return {
    ...actual,
    ExcludedPlace: { find: findMock, findOne: findOneMock, create: createMock, findById: findByIdMock }
  };
});

const { getActiveExclusionSet, isPropertyExcluded, filterOutExcludedPlaces, addExclusion, getExclusions, deactivateExclusion } = await import(
  './propertyExclusion.service'
);

describe('getActiveExclusionSet — fail-open on error', () => {
  it('returns the set of active providerPlaceIds for the given provider', async () => {
    findMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([{ providerPlaceId: 'A' }, { providerPlaceId: 'B' }]) });
    const result = await getActiveExclusionSet('google');
    expect(result).toEqual(new Set(['A', 'B']));
    expect(findMock).toHaveBeenCalledWith({ provider: 'google', isActive: true }, { providerPlaceId: 1 });
  });

  it('fails OPEN (returns an empty set, never throws) when the lookup itself fails', async () => {
    findMock.mockReturnValue({ lean: vi.fn().mockRejectedValue(new Error('Mongo is down')) });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await getActiveExclusionSet('google');
    expect(result).toEqual(new Set());
    consoleErrorSpy.mockRestore();
  });
});

describe('isPropertyExcluded', () => {
  it('returns true only for a placeId that is actively excluded', async () => {
    findMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([{ providerPlaceId: 'excluded-id' }]) });
    expect(await isPropertyExcluded('google', 'excluded-id')).toBe(true);
    expect(await isPropertyExcluded('google', 'some-other-id')).toBe(false);
  });

  it('matches by stable provider place id only — never by name (no name is ever passed in)', async () => {
    findMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([{ providerPlaceId: 'excluded-id' }]) });
    // A "similarly named" different real place has its own distinct placeId — the
    // function signature itself proves no name comparison can ever happen here.
    expect(await isPropertyExcluded('google', 'a-different-real-place-with-a-similar-name')).toBe(false);
  });

  it('fails OPEN — a lookup failure never reports a property as excluded', async () => {
    findMock.mockReturnValue({ lean: vi.fn().mockRejectedValue(new Error('down')) });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await isPropertyExcluded('google', 'anything')).toBe(false);
    consoleErrorSpy.mockRestore();
  });
});

describe('filterOutExcludedPlaces', () => {
  it('removes only the excluded items, leaving a normal property untouched', async () => {
    findMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([{ providerPlaceId: 'excluded-id' }]) });
    const items = [{ placeId: 'excluded-id', name: 'Bad Actor Hotel' }, { placeId: 'normal-id', name: 'Normal Hotel' }];
    const result = await filterOutExcludedPlaces('google', items);
    expect(result).toEqual([{ placeId: 'normal-id', name: 'Normal Hotel' }]);
  });

  it('does not hide a similarly-named property with a different placeId', async () => {
    findMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([{ providerPlaceId: 'excluded-id' }]) });
    const items = [
      { placeId: 'excluded-id', name: 'Mountain View Resort' },
      { placeId: 'unrelated-id', name: 'Mountain View Resort' } // same name, different real place
    ];
    const result = await filterOutExcludedPlaces('google', items);
    expect(result).toEqual([{ placeId: 'unrelated-id', name: 'Mountain View Resort' }]);
  });

  it('returns the input unchanged (fail-open) when the exclusion lookup fails', async () => {
    findMock.mockReturnValue({ lean: vi.fn().mockRejectedValue(new Error('down')) });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const items = [{ placeId: 'x' }];
    const result = await filterOutExcludedPlaces('google', items);
    expect(result).toEqual(items);
    consoleErrorSpy.mockRestore();
  });

  it('returns an empty array unchanged without ever querying Mongo', async () => {
    findMock.mockClear();
    const result = await filterOutExcludedPlaces('google', []);
    expect(result).toEqual([]);
    expect(findMock).not.toHaveBeenCalled();
  });
});

describe('addExclusion', () => {
  beforeEach(() => {
    findOneMock.mockReset();
    createMock.mockReset();
  });

  it('creates a new active exclusion', async () => {
    findOneMock.mockResolvedValue(null);
    createMock.mockResolvedValue({ id: 'new-doc', providerPlaceId: 'ChIJ-x', isActive: true });

    const result = await addExclusion({ provider: 'google', providerPlaceId: 'ChIJ-x', propertyName: 'Some Hotel' });

    expect(result.added).toBe(true);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google', providerPlaceId: 'ChIJ-x', propertyName: 'Some Hotel', isActive: true })
    );
  });

  it('refuses to create a duplicate active exclusion for the same place', async () => {
    findOneMock.mockResolvedValue({ providerPlaceId: 'ChIJ-x' });
    const result = await addExclusion({ provider: 'google', providerPlaceId: 'ChIJ-x' });
    expect(result).toEqual({ added: false, reason: 'already_excluded' });
    expect(createMock).not.toHaveBeenCalled();
  });

  it('refuses an empty providerPlaceId without touching Mongo', async () => {
    const result = await addExclusion({ provider: 'google', providerPlaceId: '   ' });
    expect(result).toEqual({ added: false, reason: 'invalid_input' });
    expect(findOneMock).not.toHaveBeenCalled();
  });
});

describe('getExclusions', () => {
  it('filters by isActive when provided', async () => {
    const sortMock = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
    findMock.mockReturnValue({ sort: sortMock });
    await getExclusions({ isActive: true });
    expect(findMock).toHaveBeenCalledWith({ isActive: true });
  });
});

describe('deactivateExclusion', () => {
  it('sets isActive to false and saves', async () => {
    const saveMock = vi.fn().mockResolvedValue(undefined);
    findByIdMock.mockResolvedValue({ isActive: true, save: saveMock });

    const result = await deactivateExclusion('some-id');

    expect(result.deactivated).toBe(true);
    expect(saveMock).toHaveBeenCalled();
  });

  it('returns not_found for a nonexistent id, never throws', async () => {
    findByIdMock.mockResolvedValue(null);
    const result = await deactivateExclusion('does-not-exist');
    expect(result).toEqual({ deactivated: false, reason: 'not_found' });
  });

  it('making a property eligible again is reflected immediately by isPropertyExcluded', async () => {
    // Before deactivation: excluded.
    findMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([{ providerPlaceId: 'ChIJ-x' }]) });
    expect(await isPropertyExcluded('google', 'ChIJ-x')).toBe(true);

    // After deactivation, the active-exclusion query would no longer return this row.
    findMock.mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
    expect(await isPropertyExcluded('google', 'ChIJ-x')).toBe(false);
  });
});
