import { describe, expect, it } from 'vitest';
import { getClientIp } from './clientIp';

const ip = (headers: Record<string, string>) => getClientIp(new Headers(headers));

describe('getClientIp — platform headers first, never the caller-writable left-most entry', () => {
  it('prefers the headers the platform sets itself over any x-forwarded-for value', () => {
    expect(ip({ 'x-vercel-forwarded-for': '198.51.100.9', 'x-forwarded-for': '1.2.3.4' })).toBe('198.51.100.9');
    expect(ip({ 'x-real-ip': '198.51.100.10', 'x-forwarded-for': '1.2.3.4' })).toBe('198.51.100.10');
    expect(ip({ 'x-vercel-forwarded-for': '198.51.100.9', 'x-real-ip': '198.51.100.10' })).toBe('198.51.100.9');
  });

  it('a spoofed, rotating x-forwarded-for cannot change the key while the platform address is fixed', () => {
    const keys = new Set(['1.1.1.1', '2.2.2.2', '3.3.3.3, 4.4.4.4'].map((spoof) => ip({ 'x-vercel-forwarded-for': '198.51.100.9', 'x-forwarded-for': spoof })));
    expect([...keys]).toEqual(['198.51.100.9']);
  });

  it('without platform headers it uses the RIGHT-most entry (added by the nearest proxy), so prepended spoofs do not matter', () => {
    expect(ip({ 'x-forwarded-for': '1.2.3.4, 203.0.113.7' })).toBe('203.0.113.7');
    expect(ip({ 'x-forwarded-for': '9.9.9.9, 8.8.8.8, 203.0.113.7' })).toBe('203.0.113.7');
    expect(ip({ 'x-forwarded-for': '5.5.5.5, 203.0.113.7' })).toBe(ip({ 'x-forwarded-for': '6.6.6.6, 203.0.113.7' }));
  });

  it('a single x-forwarded-for entry (the usual case on the platform) is used as is', () => {
    expect(ip({ 'x-forwarded-for': '203.0.113.7' })).toBe('203.0.113.7');
  });

  it('missing, empty or malformed headers share one "unknown" bucket instead of each getting a fresh one', () => {
    expect(ip({})).toBe('unknown');
    expect(ip({ 'x-forwarded-for': '' })).toBe('unknown');
    expect(ip({ 'x-forwarded-for': ' , , ' })).toBe('unknown');
    expect(ip({ 'x-real-ip': '   ' })).toBe('unknown');
  });

  it('bounds the key length so a huge header cannot bloat the limiter map', () => {
    expect(ip({ 'x-forwarded-for': 'a'.repeat(5000) }).length).toBeLessThanOrEqual(64);
    expect(ip({ 'x-vercel-forwarded-for': 'b'.repeat(5000) }).length).toBeLessThanOrEqual(64);
  });

  it('visitors who genuinely share one address (carrier-grade NAT) share one key — an inherent limit of per-address keys', () => {
    expect(ip({ 'x-vercel-forwarded-for': '100.64.1.1' })).toBe(ip({ 'x-vercel-forwarded-for': '100.64.1.1' }));
  });
});
