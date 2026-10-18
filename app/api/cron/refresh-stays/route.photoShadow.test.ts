import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Same mocks as route.test.ts. The refresh itself is mocked to return a summary that carries the optional shadow statistics, so these
// tests prove how the ROUTE treats them: shown only to the authenticated caller, never stored.
const { refreshMock, runCreateMock, runFindByIdAndUpdateMock, runUpdateManyMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  runCreateMock: vi.fn(),
  runFindByIdAndUpdateMock: vi.fn(),
  runUpdateManyMock: vi.fn()
}));

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/staysRefresh', () => ({ refreshAllConfiguredStays: refreshMock }));
vi.mock('@/models/StaysRefreshRun', () => ({
  StaysRefreshRun: { create: runCreateMock, findByIdAndUpdate: runFindByIdAndUpdateMock, updateMany: runUpdateManyMock }
}));

const { GET } = await import('./route');

const SHADOW = {
  propertiesScanned: 6,
  photosScanned: 6,
  googleOriginPhotos: 4,
  photoNameTokenPhotos: 4,
  unknownPhotoSources: 2,
  propertiesWithoutPhotos: 2,
  malformedPhotoEntries: 0,
  skippedForBounds: 0
};

function summary(withShadow: boolean) {
  return {
    manifestTagCount: 4,
    searchGroupCount: 2,
    dueGroupCount: 2,
    searchGroupsAttempted: 2,
    searchGroupsSkippedForBudget: 0,
    destinationsProcessed: 2,
    googleRequestCount: 2,
    recordsUpserted: 6,
    budgetLimited: false,
    errors: [] as unknown[],
    ...(withShadow ? { photoProvenanceShadow: SHADOW } : {})
  };
}

const request = (secret?: string) => new Request('http://localhost/api/cron/refresh-stays', { headers: secret !== undefined ? { authorization: `Bearer ${secret}` } : {} });

beforeEach(() => {
  refreshMock.mockReset();
  runCreateMock.mockReset().mockResolvedValue({ _id: 'run-1' });
  runFindByIdAndUpdateMock.mockReset().mockResolvedValue({});
  runUpdateManyMock.mockReset().mockResolvedValue({});
  vi.stubEnv('CRON_SECRET', 'test-secret');
});
afterEach(() => vi.unstubAllEnvs());

describe('shadow statistics and the cron route', () => {
  it('returns the statistics only to a request carrying the CRON_SECRET', async () => {
    refreshMock.mockResolvedValue(summary(true));
    const res = await GET(request('test-secret'));
    expect(res.status).toBe(200);
    expect((await res.json()).photoProvenanceShadow).toEqual(SHADOW);
  });

  it.each([undefined, 'wrong-secret', ''])('exposes nothing, and runs nothing, for an unauthenticated request (%j)', async (secret) => {
    refreshMock.mockResolvedValue(summary(true));
    const res = await GET(request(secret));
    expect(res.status).toBe(401);
    expect(JSON.stringify(await res.json())).not.toContain('photoProvenanceShadow');
    expect(refreshMock).not.toHaveBeenCalled();
    expect(runCreateMock).not.toHaveBeenCalled();
  });

  it('fails closed when CRON_SECRET is not configured', async () => {
    vi.stubEnv('CRON_SECRET', '');
    refreshMock.mockResolvedValue(summary(true));
    const res = await GET(request(''));
    expect(res.status).toBe(401);
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('never stores the statistics: the run record is updated with the same explicit fields as before', async () => {
    refreshMock.mockResolvedValue(summary(true));
    await GET(request('test-secret'));
    const update = runFindByIdAndUpdateMock.mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(update).sort()).toEqual(['budgetLimited', 'completedAt', 'destinationsProcessed', 'dueGroupCount', 'googleRequestCount', 'manifestTagCount', 'recordsUpserted', 'runErrors', 'searchGroupCount', 'searchGroupsAttempted', 'searchGroupsSkippedForBudget', 'status']);
    expect(JSON.stringify(update)).not.toContain('photoProvenanceShadow');
    expect(JSON.stringify(runCreateMock.mock.calls)).not.toContain('photoProvenanceShadow');
  });

  it('the response in the default mode has no statistics key at all', async () => {
    refreshMock.mockResolvedValue(summary(false));
    const body = await (await GET(request('test-secret'))).json();
    expect('photoProvenanceShadow' in body).toBe(false);
    expect(body).toMatchObject({ runId: 'run-1', status: 'completed', recordsUpserted: 6 });
  });

  it('the statistics contain only numbers (no photo identifier, name or Place ID reaches the response)', async () => {
    refreshMock.mockResolvedValue(summary(true));
    const body = await (await GET(request('test-secret'))).json();
    expect(Object.values(body.photoProvenanceShadow).every((value) => typeof value === 'number')).toBe(true);
    for (const text of ['places/', 'ChIJ', 'api/places']) expect(JSON.stringify(body.photoProvenanceShadow)).not.toContain(text);
  });
});
