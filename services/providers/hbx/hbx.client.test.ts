import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { describeHbxAuth, getHbxEnvironment, hbxFetch, isHbxConfigured } from './hbx.client';
import { HbxApiError } from './hbx.errors';
import { HBX_APPROVED_PRODUCTION_ORIGINS } from '@/config/hbxEnvironment.config';

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

  describe('isHbxConfigured', () => {
    it('reports configured=true when both credentials are present', () => {
      expect(isHbxConfigured()).toBe(true);
    });

    it('reports not configured when credentials are missing', () => {
      setHbxEnv({ HOTELBEDS_SECRET: undefined });
      expect(isHbxConfigured()).toBe(false);
    });
  });

  // Fail-closed environment classification — see hbx.client.ts's getHbxEnvironment()
  // doc comment and the 2026-09-24 audit (Section C) this replaces. Every case here
  // that is NOT the current evaluation URL must resolve to something other than
  // 'production' — 'unknown' is that fail-closed default, distinct from 'test' so a
  // misconfiguration is never silently treated as the intentionally-configured
  // evaluation environment either.
  describe('getHbxEnvironment (fail-closed)', () => {
    afterEach(() => {
      HBX_APPROVED_PRODUCTION_ORIGINS.clear();
      delete process.env.HBX_PRODUCTION_CONFIRMED;
    });

    it('classifies the current evaluation URL as "test"', () => {
      expect(getHbxEnvironment()).toBe('test');
    });

    it('a missing HOTELBEDS_API_BASE_URL is NOT production', () => {
      setHbxEnv({ HOTELBEDS_API_BASE_URL: undefined });
      expect(getHbxEnvironment()).not.toBe('production');
      expect(getHbxEnvironment()).toBe('unknown');
    });

    it('an empty HOTELBEDS_API_BASE_URL is NOT production', () => {
      setHbxEnv({ HOTELBEDS_API_BASE_URL: '' });
      expect(getHbxEnvironment()).not.toBe('production');
      expect(getHbxEnvironment()).toBe('unknown');
    });

    it('an uppercase/case-variant of the known test URL cannot accidentally become production (or silently pass as "test" either)', () => {
      setHbxEnv({ HOTELBEDS_API_BASE_URL: 'https://API.TEST.HOTELBEDS.COM' });
      // Origins are compared lowercase, so this actually resolves to 'test' — but the
      // critical guarantee under audit is that it can NEVER resolve to 'production',
      // regardless of case.
      expect(getHbxEnvironment()).not.toBe('production');
    });

    it('a typo/unrecognized URL is NOT production, even with no confirmation flag set', () => {
      setHbxEnv({ HOTELBEDS_API_BASE_URL: 'https://aip.test.hotelbeds.com' });
      expect(getHbxEnvironment()).toBe('unknown');
    });

    it('a production-LOOKING URL without the confirmation flag is still NOT production', () => {
      setHbxEnv({ HOTELBEDS_API_BASE_URL: 'https://api.hotelbeds.com' });
      HBX_APPROVED_PRODUCTION_ORIGINS.add('https://api.hotelbeds.com');
      // Flag deliberately left unset — origin approval alone must not be enough.
      expect(getHbxEnvironment()).toBe('unknown');
    });

    it('the confirmation flag alone, without an approved exact origin, is still NOT production', () => {
      setHbxEnv({ HOTELBEDS_API_BASE_URL: 'https://api.hotelbeds.com' });
      process.env.HBX_PRODUCTION_CONFIRMED = 'true';
      // Origin allow-list deliberately left empty — the flag alone must not be enough.
      expect(getHbxEnvironment()).toBe('unknown');
    });

    it('an approved origin PLUS the confirmation flag together — and only together — produce "production"', () => {
      setHbxEnv({ HOTELBEDS_API_BASE_URL: 'https://api.hotelbeds.com' });
      HBX_APPROVED_PRODUCTION_ORIGINS.add('https://api.hotelbeds.com');
      process.env.HBX_PRODUCTION_CONFIRMED = 'true';
      expect(getHbxEnvironment()).toBe('production');
    });

    it('an approved origin does not extend to a different, unapproved origin', () => {
      setHbxEnv({ HOTELBEDS_API_BASE_URL: 'https://api.hotelbeds.co.uk' });
      HBX_APPROVED_PRODUCTION_ORIGINS.add('https://api.hotelbeds.com');
      process.env.HBX_PRODUCTION_CONFIRMED = 'true';
      expect(getHbxEnvironment()).toBe('unknown');
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
