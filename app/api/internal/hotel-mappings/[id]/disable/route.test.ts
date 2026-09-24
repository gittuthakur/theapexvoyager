import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const disableMappingMock = vi.fn();
vi.mock('@/services/pricing/hotelMappingRegistry.service', () => ({ disableMapping: disableMappingMock }));

const { POST } = await import('./route');

const params = Promise.resolve({ id: 'mapping-1' });

describe('POST /api/internal/hotel-mappings/[id]/disable', () => {
  beforeEach(() => {
    disableMappingMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is unavailable (404) outside local development', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(new Request('http://localhost', { method: 'POST' }), { params });
    expect(res.status).toBe(404);
    expect(disableMappingMock).not.toHaveBeenCalled();
  });

  it('disables a CONFIRMED mapping in local development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    disableMappingMock.mockResolvedValue({ disabled: true, mapping: { id: 'mapping-1', status: 'DISABLED' } });

    const res = await POST(new Request('http://localhost', { method: 'POST' }), { params });
    expect(res.status).toBe(200);
    expect(disableMappingMock).toHaveBeenCalledWith({ mappingId: 'mapping-1' });
  });

  it('refuses to disable a non-CONFIRMED mapping with 409', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    disableMappingMock.mockResolvedValue({ disabled: false, reason: 'invalid_status' });

    const res = await POST(new Request('http://localhost', { method: 'POST' }), { params });
    expect(res.status).toBe(409);
  });
});
