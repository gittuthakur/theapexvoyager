import { describe, expect, it } from 'vitest';
// @ts-expect-error — next.config.mjs is plain JS with no type declarations
import nextConfig from './next.config.mjs';

type HeaderRule = { source: string; headers: { key: string; value: string }[] };

const VOUCHER_SOURCE = '/bookings/hbx/:reference/voucher';

async function loadRules(): Promise<HeaderRule[]> {
  return (await nextConfig.headers()) as HeaderRule[];
}

describe('next.config voucher security headers', () => {
  it('declares exactly one rule for the narrow voucher route', async () => {
    const rules = (await loadRules()).filter(r => r.source === VOUCHER_SOURCE);
    expect(rules).toHaveLength(1);
  });

  it('sets the three required voucher headers with exact values', async () => {
    const rule = (await loadRules()).find(r => r.source === VOUCHER_SOURCE)!;
    const map = Object.fromEntries(rule.headers.map(h => [h.key, h.value]));
    expect(map['Cache-Control']).toBe('private, no-store, max-age=0');
    expect(map['X-Robots-Tag']).toBe('noindex, nofollow, noarchive');
    expect(map['Referrer-Policy']).toBe('no-referrer');
  });

  it('declares the voucher rule after the global rule', async () => {
    const rules = await loadRules();
    const globalIndex = rules.findIndex(r => r.source === '/:path*');
    const voucherIndex = rules.findIndex(r => r.source === VOUCHER_SOURCE);
    expect(globalIndex).toBeGreaterThanOrEqual(0);
    expect(voucherIndex).toBeGreaterThan(globalIndex);
  });

  it('does not widen the route to all of /bookings', async () => {
    const rules = await loadRules();
    expect(rules.some(r => r.source === '/bookings/:path*')).toBe(false);
  });

  it('leaves the existing internal-route headers intact', async () => {
    const rules = await loadRules();
    for (const source of ['/internal/:path*', '/api/internal/:path*']) {
      const rule = rules.find(r => r.source === source)!;
      expect(rule.headers.find(h => h.key === 'Cache-Control')?.value).toBe('private, no-store, max-age=0');
      expect(rule.headers.find(h => h.key === 'X-Robots-Tag')?.value).toBe('noindex, nofollow, noarchive');
    }
  });
});
