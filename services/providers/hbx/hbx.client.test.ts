import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { describeHbxAuth, getHbxEnvironment, hbxFetch, isHbxConfigured } from './hbx.client';
import { HbxApiError } from './hbx.errors';

const ORIGINAL_ENV = { ...process.env };

function setHbxEnv(overrides: Partial<Record<'HOTELBEDS_API_KEY' | 'HOTELBEDS_SECRET' | 'HOTELBEDS_API_BASE_URL', string | undefined>>) {
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe('hbx.client', () => {
  beforeEach(() => {
    setHbxEnv({
      HOTELBEDS_API_KEY: 'test-key-1234',
      HOTELBEDS_SECRET: 'test-secret',
      HOTELBEDS_API_BASE_URL: 'https://api.test.hotelbeds.com'
    });
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  describe('isHbxConfigured / getHbxEnvironment', () => {
    it('reports configured=true and environment="test" for the eval base URL', () => {
      expect(isHbxConfigured()).toBe(true);
      expect(getHbxEnvironment()).toBe('test');
    });

    it('reports not configured when credentials are missing', () => {
      setHbxEnv({ HOTELBEDS_SECRET: undefined });
      expect(isHbxConfigured()).toBe(false);
    });

    it('reports environment="production" for a non-test base URL', () => {
      setHbxEnv({ HOTELBEDS_API_BASE_URL: 'https://api.hotelbeds.com' });
      expect(getHbxEnvironment()).toBe('production');
    });
  });

  describe('describeHbxAuth', () => {
    it('never returns the real API key — only a masked form', () => {
      const auth = describeHbxAuth();
      expect(auth.apiKeyMasked).not.toContain('test-key-1234');
      expect(auth.apiKeyMasked).toMatch(/^te\*\*\*34$/);
      expect(auth.configured).toBe(true);
      expect(auth.environment).toBe('test');
    });
  });

  describe('hbxFetch', () => {
    it('throws HbxApiError without calling fetch when credentials are missing', async () => {
      setHbxEnv({ HOTELBEDS_API_KEY: undefined });
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);

      await expect(hbxFetch('/hotel-content-api/1.0/status')).rejects.toBeInstanceOf(HbxApiError);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('sends Api-key and X-Signature headers, never the secret itself', async () => {
      const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      vi.stubGlobal('fetch', fetchSpy);

      await hbxFetch('/hotel-content-api/1.0/status');

      const [, init] = fetchSpy.mock.calls[0];
      const headers = init.headers as Record<string, string>;
      expect(headers['Api-key']).toBe('test-key-1234');
      expect(headers['X-Signature']).toMatch(/^[a-f0-9]{64}$/);
      expect(JSON.stringify(init)).not.toContain('test-secret');
    });

    it('throws a typed HbxApiError with the HTTP status on a 4xx/5xx response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Unauthorized', { status: 401 })));

      await expect(hbxFetch('/hotel-content-api/1.0/status')).rejects.toMatchObject({ status: 401 });
    });

    it('wraps a network/timeout failure in HbxApiError rather than letting it propagate raw', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('The operation was aborted', 'TimeoutError')));

      await expect(hbxFetch('/hotel-content-api/1.0/status')).rejects.toBeInstanceOf(HbxApiError);
    });
  });
});
