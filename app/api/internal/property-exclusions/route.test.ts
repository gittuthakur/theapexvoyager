import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { addExclusionMock, getExclusionsMock } = vi.hoisted(() => ({ addExclusionMock: vi.fn(), getExclusionsMock: vi.fn() }));
vi.mock('@/services/properties/propertyExclusion.service', () => ({ addExclusion: addExclusionMock, getExclusions: getExclusionsMock }));

const { GET, POST } = await import('./route');

function getRequest(query = '') {
  return new Request(`http://localhost/api/internal/property-exclusions${query}`);
}

function postRequest(body?: unknown) {
  return new Request('http://localhost/api/internal/property-exclusions', {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

describe('GET /api/internal/property-exclusions', () => {
  beforeEach(() => {
    getExclusionsMock.mockReset().mockResolvedValue([]);
  });
  afterEach(() => vi.unstubAllEnvs());

  it('is unavailable (404) outside local development', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = await GET(getRequest());
    expect(res.status).toBe(404);
    expect(getExclusionsMock).not.toHaveBeenCalled();
  });

  it('lists exclusions with no isActive filter by default', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    await GET(getRequest());
    expect(getExclusionsMock).toHaveBeenCalledWith({ isActive: undefined });
  });

  it('filters by isActive=true', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    await GET(getRequest('?isActive=true'));
    expect(getExclusionsMock).toHaveBeenCalledWith({ isActive: true });
  });
});

describe('POST /api/internal/property-exclusions', () => {
  beforeEach(() => {
    addExclusionMock.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('is unavailable (404) outside local development', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(postRequest({ provider: 'google', providerPlaceId: 'ChIJ-x' }));
    expect(res.status).toBe(404);
    expect(addExclusionMock).not.toHaveBeenCalled();
  });

  it('rejects an unrecognized provider', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const res = await POST(postRequest({ provider: 'booking', providerPlaceId: 'x' }));
    expect(res.status).toBe(400);
    expect(addExclusionMock).not.toHaveBeenCalled();
  });

  it('rejects a missing providerPlaceId', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const res = await POST(postRequest({ provider: 'google' }));
    expect(res.status).toBe(400);
    expect(addExclusionMock).not.toHaveBeenCalled();
  });

  it('creates the exclusion on valid input', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    addExclusionMock.mockResolvedValue({ added: true, exclusion: { providerPlaceId: 'ChIJ-x' } });
    const res = await POST(postRequest({ provider: 'google', providerPlaceId: 'ChIJ-x' }));
    expect(res.status).toBe(200);
    expect(addExclusionMock).toHaveBeenCalledWith(expect.objectContaining({ provider: 'google', providerPlaceId: 'ChIJ-x' }));
  });

  it('surfaces already_excluded as a 409 rather than silently duplicating', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    addExclusionMock.mockResolvedValue({ added: false, reason: 'already_excluded' });
    const res = await POST(postRequest({ provider: 'google', providerPlaceId: 'ChIJ-x' }));
    expect(res.status).toBe(409);
  });
});
