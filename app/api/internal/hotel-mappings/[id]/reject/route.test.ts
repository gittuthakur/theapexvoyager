import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const rejectMappingMock = vi.fn();
vi.mock('@/services/pricing/hotelMappingRegistry.service', () => ({ rejectMapping: rejectMappingMock }));

const { POST } = await import('./route');

const params = Promise.resolve({ id: 'mapping-1' });

describe('POST /api/internal/hotel-mappings/[id]/reject', () => {
  beforeEach(() => {
    rejectMappingMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is unavailable (404) outside local development', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(new Request('http://localhost', { method: 'POST' }), { params });
    expect(res.status).toBe(404);
    expect(rejectMappingMock).not.toHaveBeenCalled();
  });

  it('rejects a mapping in local development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    rejectMappingMock.mockResolvedValue({ rejected: true, mapping: { id: 'mapping-1', status: 'REJECTED' } });

    const res = await POST(new Request('http://localhost', { method: 'POST' }), { params });
    expect(res.status).toBe(200);
    expect(rejectMappingMock).toHaveBeenCalledWith({ mappingId: 'mapping-1' });
  });

  it('surfaces an invalid_status refusal as 409', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    rejectMappingMock.mockResolvedValue({ rejected: false, reason: 'invalid_status' });

    const res = await POST(new Request('http://localhost', { method: 'POST' }), { params });
    expect(res.status).toBe(409);
  });
});
