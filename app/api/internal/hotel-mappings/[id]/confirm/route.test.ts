import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const confirmMappingMock = vi.fn();
vi.mock('@/services/pricing/hotelMappingRegistry.service', () => ({ confirmMapping: confirmMappingMock }));

const { POST } = await import('./route');

const params = Promise.resolve({ id: 'mapping-1' });

function jsonRequest(body?: unknown) {
  return new Request('http://localhost/api/internal/hotel-mappings/mapping-1/confirm', {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

describe('POST /api/internal/hotel-mappings/[id]/confirm', () => {
  beforeEach(() => {
    confirmMappingMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is unavailable (404) outside local development', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(jsonRequest({ confirmedBy: 'ops' }), { params });
    expect(res.status).toBe(404);
    expect(confirmMappingMock).not.toHaveBeenCalled();
  });

  it('requires confirmedBy — a mapping can never auto-confirm with no attributable reviewer', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const res = await POST(jsonRequest({}), { params });
    expect(res.status).toBe(400);
    expect(confirmMappingMock).not.toHaveBeenCalled();
  });

  it('surfaces the registry service conflict reason (existing conflict protection) rather than bypassing it', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    confirmMappingMock.mockResolvedValue({ confirmed: false, reason: 'conflict_provider_hotel' });

    const res = await POST(jsonRequest({ confirmedBy: 'ops' }), { params });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('conflict_provider_hotel');
  });

  it('surfaces coordinate_anomaly as a 409 — the route never confirms an anomaly-flagged row', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    confirmMappingMock.mockResolvedValue({ confirmed: false, reason: 'coordinate_anomaly' });

    const res = await POST(jsonRequest({ confirmedBy: 'ops' }), { params });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('coordinate_anomaly');
  });

  it('confirms and passes the reviewer identifier through on success', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    confirmMappingMock.mockResolvedValue({ confirmed: true, mapping: { id: 'mapping-1', status: 'CONFIRMED' } });

    const res = await POST(jsonRequest({ confirmedBy: 'local-admin' }), { params });
    expect(res.status).toBe(200);
    expect(confirmMappingMock).toHaveBeenCalledWith({ mappingId: 'mapping-1', confirmedBy: 'local-admin' });
  });
});
