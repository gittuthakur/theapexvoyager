import { afterEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { isGoogleTrackingEnabled, trackWhatsAppConversion, WHATSAPP_CONVERSION_TARGET } from './googleAds';
afterEach(() => vi.unstubAllGlobals());
it('loads the Google tag only in a production deployment', () => {
  expect(isGoogleTrackingEnabled({ NODE_ENV: 'production', VERCEL_ENV: 'production' })).toBe(true);
  expect(isGoogleTrackingEnabled({ NODE_ENV: 'production' })).toBe(true);
  expect(isGoogleTrackingEnabled({ NODE_ENV: 'development' })).toBe(false);
  expect(isGoogleTrackingEnabled({ NODE_ENV: 'test' })).toBe(false);
  expect(isGoogleTrackingEnabled({})).toBe(false);
  expect(isGoogleTrackingEnabled({ NODE_ENV: 'production', VERCEL_ENV: 'preview' })).toBe(false);
  expect(isGoogleTrackingEnabled({ NODE_ENV: 'production', VERCEL_ENV: 'development' })).toBe(false);
});
it('keeps both Google tag scripts in the layout behind that check', () => {
  const layout = readFileSync('app/layout.tsx', 'utf8');
  const guarded = layout.slice(layout.indexOf('isGoogleTrackingEnabled() ?'));
  expect(layout.match(/googletagmanager\.com/g)).toHaveLength(1);
  expect(layout.match(/gtag\('config'/g)).toHaveLength(1);
  expect(guarded.indexOf("gtag('config'")).toBeGreaterThan(0);
  expect(guarded.indexOf('googletagmanager.com')).toBeGreaterThan(0);
});
it('deduplicates the same handoff event but allows a distinct later click', () => {
  const gtag = vi.fn();
  vi.stubGlobal('window', { gtag });
  const event = {};
  trackWhatsAppConversion(event);
  trackWhatsAppConversion(event);
  trackWhatsAppConversion({});
  expect(gtag).toHaveBeenCalledTimes(2);
  expect(gtag).toHaveBeenCalledWith('event', 'conversion', { send_to: WHATSAPP_CONVERSION_TARGET });
});
it('does not let tracking failure block a WhatsApp handoff', () => {
  vi.stubGlobal('window', { gtag: () => { throw new Error('blocked'); } });
  expect(() => trackWhatsAppConversion({})).not.toThrow();
});
