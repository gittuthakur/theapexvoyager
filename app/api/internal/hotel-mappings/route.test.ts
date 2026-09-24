import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getMappingCandidatesMock = vi.fn();
vi.mock('@/services/pricing/hotelMappingRegistry.service', () => ({ getMappingCandidates: getMappingCandidatesMock }));

const { GET } = await import('./route');


describe('GET /api/internal/hotel-mappings', () => {
  beforeEach(() => {
    getMappingCandidatesMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is unavailable (404) outside local development', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = await GET(new Request('http://localhost/api/internal/hotel-mappings'));
    expect(res.status).toBe(404);
    expect(getMappingCandidatesMock).not.toHaveBeenCalled();
  });

  it('lists PENDING_REVIEW by default in local development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    getMappingCandidatesMock.mockResolvedValue([{ id: '1' }]);

    const res = await GET(new Request('http://localhost/api/internal/hotel-mappings'));
    expect(res.status).toBe(200);
    expect(getMappingCandidatesMock).toHaveBeenCalledWith({ status: 'PENDING_REVIEW', destinationSlug: undefined, provider: undefined });
    const body = await res.json();
    expect(body.mappings).toEqual([{ id: '1' }]);
  });

  it('respects status/destinationSlug/provider query params', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    getMappingCandidatesMock.mockResolvedValue([]);

    await GET(new Request('http://localhost/api/internal/hotel-mappings?status=CONFIRMED&destinationSlug=manali&provider=hbx'));
    expect(getMappingCandidatesMock).toHaveBeenCalledWith({ status: 'CONFIRMED', destinationSlug: 'manali', provider: 'hbx' });
  });
});
