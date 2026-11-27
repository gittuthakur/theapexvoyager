import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PER_CLIENT_PER_MINUTE,
  DEFAULT_PER_INSTANCE_PER_MINUTE,
  InMemoryRateStore,
  classifyUpstreamBadRequest,
  clientKey,
  describeUpstreamError,
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

describe('classifyUpstreamBadRequest', () => {
  const envelope = (error: unknown) => JSON.stringify({ error });
  const invalid = (extra: Record<string, unknown> = {}) => ({ code: 400, message: 'Request contains an invalid argument.', status: 'INVALID_ARGUMENT', ...extra });

  it('is confident only for a well-formed INVALID_ARGUMENT with a message, no configuration wording and no reason', () => {
    expect(classifyUpstreamBadRequest(envelope(invalid()))).toBe('bad-request');
    expect(classifyUpstreamBadRequest(envelope(invalid({ details: [] })))).toBe('bad-request');
    expect(classifyUpstreamBadRequest(envelope(invalid({ details: [{ '@type': 'type.googleapis.com/google.rpc.BadRequest', fieldViolations: [] }] })))).toBe('bad-request');
  });

  it.each([
    ['API_KEY_INVALID reason', invalid({ message: 'x', details: [{ reason: 'API_KEY_INVALID' }] })],
    ['API key message', invalid({ message: 'API key not valid. Please pass a valid API key.' })],
    ['billing', invalid({ status: 'FAILED_PRECONDITION', message: 'Billing must be enabled.' })],
    ['quota', invalid({ status: 'RESOURCE_EXHAUSTED', message: 'Quota exceeded.' })],
    ['permission', invalid({ status: 'PERMISSION_DENIED', message: 'nope' })],
    ['disabled API', invalid({ message: 'API has not been used in project before or it is disabled.' })],
    ['referer restriction', invalid({ message: 'Requests from referer <empty> are blocked.' })],
    ['credential wording in an INVALID_ARGUMENT', invalid({ message: 'Invalid credentials supplied.' })]
  ])('treats %s as ambiguous (configuration problem)', (_label, error) => {
    expect(classifyUpstreamBadRequest(envelope(error))).toBe('ambiguous');
  });

  it.each([
    ['an unrecognised reason', invalid({ details: [{ reason: 'SOMETHING_NEW' }] })],
    ['a reason in a later detail', invalid({ details: [{ '@type': 'x' }, { reason: 'SOMETHING_NEW' }] })],
    ['a different status', invalid({ status: 'OUT_OF_RANGE' })],
    ['a missing status', { code: 400, message: 'Request contains an invalid argument.' }],
    ['a missing message', { code: 400, status: 'INVALID_ARGUMENT' }],
    ['an empty message', invalid({ message: '   ' })],
    ['a non-string message', invalid({ message: 42 })],
    ['non-array details', invalid({ details: { reason: 'x' } })],
    ['a null detail', invalid({ details: [null] })],
    ['a string detail', invalid({ details: ['x'] })],
    ['an array instead of an error object', []]
  ])('treats %s as ambiguous (not enough evidence)', (_label, error) => {
    expect(classifyUpstreamBadRequest(envelope(error))).toBe('ambiguous');
  });

  it.each([
    ['an empty body', ''],
    ['whitespace', '   '],
    ['plain text', 'not json'],
    ['HTML', '<html><body>400 Bad Request</body></html>'],
    ['truncated JSON', '{"error":{"code":400,"status":"INVALID_ARG'],
    ['a JSON array', '[]'],
    ['JSON null', 'null'],
    ['a JSON string', '"INVALID_ARGUMENT"'],
    ['an empty object', '{}'],
    ['an error that is a string', '{"error":"a string"}'],
    ['an error that is null', '{"error":null}'],
    ['an empty error object', '{"error":{}}'],
    ['an unrelated JSON shape', '{"unexpected":true}']
  ])('treats %s as ambiguous (malformed or unrecognised body)', (_label, text) => {
    expect(classifyUpstreamBadRequest(text)).toBe('ambiguous');
  });

  it('returns only one of two fixed labels, never any part of the body', () => {
    const result = classifyUpstreamBadRequest(envelope(invalid({ message: 'secret-token-123' })));
    expect(['bad-request', 'ambiguous']).toContain(result);
    expect(result).not.toContain('secret');
  });
});

// TEMPORARY DIAGNOSTICS (photo 400 investigation)
describe('describeUpstreamError', () => {
  const body = (error: unknown) => JSON.stringify({ error });

  it('keeps only Google status and message', () => {
    expect(describeUpstreamError(body({ code: 400, message: 'Request contains an invalid argument.', status: 'INVALID_ARGUMENT', details: [{ reason: 'X' }] }))).toEqual({
      googleStatus: 'INVALID_ARGUMENT',
      message: 'Request contains an invalid argument.'
    });
  });

  it.each(['', 'not json', '[]', 'null', '{"error":"a string"}', '{"unexpected":1}'])('returns nothing for a non-Google body (%j)', (text) => {
    expect(describeUpstreamError(text)).toEqual({});
  });

  it('omits a status that is not a bare enum', () => {
    expect(describeUpstreamError(body({ status: 'places/ChIJabc', message: 'm' }))).toEqual({ message: 'm' });
  });

  it('redacts literal secrets (as given and URL-encoded), URLs, resource names, key shapes and long tokens', () => {
    const key = 'my-secret-key-123456';
    const name = 'places/ChIJabc123/photos/AVxyz789_-=.';
    const message = `a ${key} b ${name} c ${encodeURIComponent(name)} d https://places.googleapis.com/v1/x?key=${key} e places/zzz/photos/qqq f AIzaSyA1234567890abcdefghij g ${'T'.repeat(40)} h`;
    const out = describeUpstreamError(body({ status: 'INVALID_ARGUMENT', message }), [key, name, 'ChIJabc123']).message ?? '';
    for (const forbidden of [key, 'ChIJ', 'AVxyz', 'googleapis', 'places/', 'places%2F', 'AIza', 'TTTT', 'key=']) expect(out).not.toContain(forbidden);
    expect(out).toMatch(/^a \[redacted\] b/);
  });

  it('redacts before truncating, so a secret straddling the 300-character cut cannot leak a prefix', () => {
    const key = 'K'.repeat(30);
    const message = `${'x '.repeat(145)}${key} tail`;
    const out = describeUpstreamError(body({ message }), [key]).message ?? '';
    expect(out.length).toBeLessThanOrEqual(300);
    expect(out).not.toContain('KKKK');
  });

  it('caps the message at 300 characters and strips control characters', () => {
    const out = describeUpstreamError(body({ message: `line1\n\r\t line2 ${'w '.repeat(400)}` })).message ?? '';
    expect(out.length).toBe(300);
    expect(out).toMatch(/^line1 line2/);
    expect(out).not.toMatch(/[\u0000-\u001f]/);
  });

  it('ignores very short secrets so ordinary words are not mangled', () => {
    expect(describeUpstreamError(body({ message: 'an invalid argument' }), ['a', 'in'] as string[]).message).toBe('an invalid argument');
  });
});
