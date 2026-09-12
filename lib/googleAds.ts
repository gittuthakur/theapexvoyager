export const GOOGLE_ADS_ID = 'AW-18419258781';
export const WHATSAPP_CONVERSION_TARGET = 'AW-18419258781/1oMOCOWpnvUcEJ2r_s5E';

type GoogleTag = (...args: unknown[]) => void;
type TrackingWindow = Window & { dataLayer?: unknown[]; gtag?: GoogleTag };
const trackedEvents = new WeakSet<object>();

/** Call only at a user-initiated WhatsApp handoff, never while building a URL. */
export function trackWhatsAppConversion(event?: object) {
  if (typeof window === 'undefined') return;
  if (event && trackedEvents.has(event)) return;

  try {
    const trackingWindow = window as TrackingWindow;
    // Queue early clicks using the same queue consumed by the global Google tag.
    trackingWindow.dataLayer = trackingWindow.dataLayer || [];
    trackingWindow.gtag = trackingWindow.gtag || function () {
      trackingWindow.dataLayer!.push(arguments);
    };
    if (event) trackedEvents.add(event);
    trackingWindow.gtag('event', 'conversion', { send_to: WHATSAPP_CONVERSION_TARGET });
  } catch {
    // Analytics must never prevent a customer from opening WhatsApp.
  }
}
