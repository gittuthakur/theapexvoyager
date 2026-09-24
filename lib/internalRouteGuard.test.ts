import { afterEach, describe, expect, it, vi } from 'vitest';
import { requireInternalDevAccess } from './internalRouteGuard';

describe('requireInternalDevAccess', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns a 404 response outside local development', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const denied = requireInternalDevAccess();
    expect(denied).not.toBeNull();
    expect(denied?.status).toBe(404);
  });

  it('returns null (access allowed) in local development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(requireInternalDevAccess()).toBeNull();
  });
});
