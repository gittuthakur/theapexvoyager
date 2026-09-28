import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const deactivateExclusionMock = vi.fn();
vi.mock('@/services/properties/propertyExclusion.service', () => ({ deactivateExclusion: deactivateExclusionMock }));

const { POST } = await import('./route');

const params = Promise.resolve({ id: 'exclusion-1' });

function postRequest() {
  return new Request('http://localhost/api/internal/property-exclusions/exclusion-1/deactivate', { method: 'POST' });
}

describe('POST /api/internal/property-exclusions/[id]/deactivate', () => {
  beforeEach(() => deactivateExclusionMock.mockReset());
  afterEach(() => vi.unstubAllEnvs());

  it('is unavailable (404) outside local development', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(postRequest(), { params });
    expect(res.status).toBe(404);
    expect(deactivateExclusionMock).not.toHaveBeenCalled();
  });

  it('deactivates on success', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    deactivateExclusionMock.mockResolvedValue({ deactivated: true, exclusion: { isActive: false } });
    const res = await POST(postRequest(), { params });
    expect(res.status).toBe(200);
    expect(deactivateExclusionMock).toHaveBeenCalledWith('exclusion-1');
  });

  it('returns 404 for a nonexistent exclusion id', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    deactivateExclusionMock.mockResolvedValue({ deactivated: false, reason: 'not_found' });
    const res = await POST(postRequest(), { params });
    expect(res.status).toBe(404);
  });
});
