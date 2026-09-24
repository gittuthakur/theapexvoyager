import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const generateHbxCandidatesMock = vi.fn();
vi.mock('@/services/providers/hbx/hbxMappingCandidates.service', () => ({ generateHbxCandidatesForDestination: generateHbxCandidatesMock }));

const { POST } = await import('./route');


function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/internal/hotel-mappings/generate', { method: 'POST', body: JSON.stringify(body) });
}

describe('POST /api/internal/hotel-mappings/generate', () => {
  beforeEach(() => {
    generateHbxCandidatesMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is unavailable (404) outside local development', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(jsonRequest({ destinationSlug: 'shimla' }));
    expect(res.status).toBe(404);
    expect(generateHbxCandidatesMock).not.toHaveBeenCalled();
  });

  it('requires destinationSlug', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(400);
    expect(generateHbxCandidatesMock).not.toHaveBeenCalled();
  });

  it('rejects a provider with no candidate-generation flow wired up yet, rather than silently no-op-ing', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const res = await POST(jsonRequest({ destinationSlug: 'shimla', provider: 'booking' }));
    expect(res.status).toBe(400);
    expect(generateHbxCandidatesMock).not.toHaveBeenCalled();
  });

  it('calls only the content-only HBX candidate generator — this route never touches fetch/Availability/CheckRate/Booking itself', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    generateHbxCandidatesMock.mockResolvedValue({ ok: true, summary: { created: 1 } });

    const res = await POST(jsonRequest({ destinationSlug: 'shimla' }));

    expect(res.status).toBe(200);
    expect(generateHbxCandidatesMock).toHaveBeenCalledWith('shimla');
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('surfaces a fail-safe error (e.g. no verified destination mapping) as 422', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    generateHbxCandidatesMock.mockResolvedValue({ ok: false, error: 'No verified HBX destination mapping for "kinnaur"' });

    const res = await POST(jsonRequest({ destinationSlug: 'kinnaur' }));
    expect(res.status).toBe(422);
  });
});
