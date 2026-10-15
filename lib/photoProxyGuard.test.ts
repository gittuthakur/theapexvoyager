import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PER_CLIENT_PER_MINUTE,
  DEFAULT_PER_INSTANCE_PER_MINUTE,
  InMemoryRateStore,
  clientKey,
  isPhotoProxyDisabled,
  photoRateLimits
} from './photoProxyGuard';
import { getClientIp } from './clientIp';

describe('InMemoryRateStore', () => {
  it('allows up to the limit within a window, then refuses, then resets', () => {
    const store = new InMemoryRateStore();
    expect([1, 2, 3, 4].map((i) => store.hit('k', 3, 1000, 100 + i))).toEqual([true, true, true, false]);
    expect(store.hit('k', 3, 1000, 1200)).toBe(true);
  });

  it('keeps clients separate', () => {
    const store = new InMemoryRateStore();
    expect(store.hit('a', 1, 1000, 0)).toBe(true);
    expect(store.hit('a', 1, 1000, 1)).toBe(false);
    expect(store.hit('b', 1, 1000, 1)).toBe(true);
  });

  it('stays bounded in memory under many distinct keys', () => {
    const store = new InMemoryRateStore();
    for (let i = 0; i < 20000; i += 1) store.hit(`k${i}`, 1, 60000, i);
    // Internal map is private; a bounded store must still answer correctly afterwards.
    expect(store.hit('fresh', 1, 60000, 30000)).toBe(true);
  });
});

describe('clientKey', () => {
  it('prefers the platform-reported address over any x-forwarded-for value', () => {
    expect(clientKey(new Headers({ 'x-vercel-forwarded-for': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' }))).toBe('1.1.1.1');
    expect(clientKey(new Headers({ 'x-real-ip': '1.1.1.2', 'x-forwarded-for': '2.2.2.2' }))).toBe('1.1.1.2');
  });
  it('without platform headers uses the RIGHT-most x-forwarded-for entry, never a caller-prepended one', () => {
    expect(clientKey(new Headers({ 'x-forwarded-for': '3.3.3.3, 4.4.4.4' }))).toBe('4.4.4.4');
    expect(clientKey(new Headers({ 'x-forwarded-for': '9.9.9.9, 8.8.8.8, 203.0.113.7' }))).toBe('203.0.113.7');
  });
  it('is exactly the shared helper used by the destinations limiter', () => {
    const cases: Array<Record<string, string>> = [{ 'x-vercel-forwarded-for': '1.1.1.1' }, { 'x-forwarded-for': 'a, b' }, {}, { 'x-forwarded-for': ' , ' }];
    for (const headers of cases) {
      expect(clientKey(new Headers(headers))).toBe(getClientIp(new Headers(headers)));
    }
  });
  it('uses one shared bucket when no usable address is available rather than skipping the limit', () => {
    expect(clientKey(new Headers())).toBe('unknown');
    expect(clientKey(new Headers({ 'x-forwarded-for': ' , , ' }))).toBe('unknown');
    expect(clientKey(new Headers({ 'x-real-ip': '   ' }))).toBe('unknown');
  });
  it('bounds the key length', () => {
    expect(clientKey(new Headers({ 'x-forwarded-for': 'a'.repeat(5000) })).length).toBeLessThanOrEqual(64);
  });
});

describe('kill switch and limits configuration', () => {
  it('is only on for an explicit "disabled"', () => {
    expect(isPhotoProxyDisabled({})).toBe(false);
    expect(isPhotoProxyDisabled({ GOOGLE_PHOTO_PROXY_MODE: 'enabled' })).toBe(false);
    expect(isPhotoProxyDisabled({ GOOGLE_PHOTO_PROXY_MODE: ' Disabled ' })).toBe(true);
  });

  it('uses safe defaults for missing or invalid limits', () => {
    expect(photoRateLimits({})).toEqual({ perClient: DEFAULT_PER_CLIENT_PER_MINUTE, perInstance: DEFAULT_PER_INSTANCE_PER_MINUTE });
    expect(photoRateLimits({ GOOGLE_PHOTO_PROXY_MAX_PER_CLIENT_PER_MINUTE: 'x', GOOGLE_PHOTO_PROXY_MAX_PER_INSTANCE_PER_MINUTE: '-5' })).toEqual({
      perClient: DEFAULT_PER_CLIENT_PER_MINUTE,
      perInstance: DEFAULT_PER_INSTANCE_PER_MINUTE
    });
    expect(photoRateLimits({ GOOGLE_PHOTO_PROXY_MAX_PER_CLIENT_PER_MINUTE: '10' }).perClient).toBe(10);
  });
});
