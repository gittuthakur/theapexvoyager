import { afterEach, expect, it, vi } from 'vitest';
import { trackWhatsAppConversion, WHATSAPP_CONVERSION_TARGET } from './googleAds';
afterEach(() => vi.unstubAllGlobals());
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
