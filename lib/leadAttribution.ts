/**
 * First-touch campaign attribution, kept in sessionStorage for the visit so a UTM-tagged
 * landing survives in-site navigation up to the enquiry. Collects only the five UTM tags,
 * the landing path and the external referrer's origin - no cookies, fingerprinting or IDs.
 * The server re-sanitizes everything (lib/leads.ts sanitizeAttribution); this is a courier.
 */
const KEY = 'apex_attribution_v1';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export interface ClientAttribution {
  utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string; utmTerm?: string;
  landingPage?: string; referrer?: string;
}

function read(): ClientAttribution | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ClientAttribution) : null;
  } catch {
    return null;
  }
}

/** Call once per page load. Stores only the first touch of the visit, unless a later page carries new UTM tags. */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const hasUtm = UTM_KEYS.some(k => params.get(k));
    if (read() && !hasUtm) return;
    let referrer: string | undefined;
    try { referrer = document.referrer ? new URL(document.referrer).origin : undefined; } catch { referrer = undefined; }
    if (referrer === window.location.origin) referrer = undefined;
    const next: ClientAttribution = {
      utmSource: params.get('utm_source') ?? undefined, utmMedium: params.get('utm_medium') ?? undefined,
      utmCampaign: params.get('utm_campaign') ?? undefined, utmContent: params.get('utm_content') ?? undefined,
      utmTerm: params.get('utm_term') ?? undefined, landingPage: window.location.pathname, referrer
    };
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked - attribution is simply unavailable; never affects the visitor.
  }
}

/** Attribution to send with an enquiry; falls back to the current path if nothing was captured. */
export function getAttribution(): ClientAttribution {
  if (typeof window === 'undefined') return {};
  return read() ?? { landingPage: window.location.pathname };
}
