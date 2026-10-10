/** Pure shared validation; public payloads cannot assign provider evidence. */
export type EvidenceKind = 'PROVIDER_VERIFIED' | 'FIRST_PARTY_OBSERVED' | 'URL_REPORTED' | 'STAFF_REPORTED' | 'UNKNOWN';
export interface Evidence { value: string | null; kind: EvidenceKind; origin: 'website' | 'request_url'; observedAt: string | null }
export interface AttributionTouch {
  observedAt: string; landingPage: Evidence; externalReferrerOrigin: Evidence;
  utmSource: Evidence; utmMedium: Evidence; utmCampaign: Evidence; utmContent: Evidence; utmTerm: Evidence;
  gclid: Evidence; gbraid: Evidence; wbraid: Evidence;
}
export interface FirstPartyAttribution { version: 2; firstTouch: AttributionTouch | null; latestTaggedTouch: AttributionTouch | null; submissionPage: Evidence; recordedAt?: string }
export const ATTRIBUTION_TTL_MS = 24 * 60 * 60 * 1000;
export const TAG_LIMITS = { utmSource: 100, utmMedium: 100, utmCampaign: 150, utmContent: 150, utmTerm: 150 } as const;
export const CLICK_KEYS = ['gclid', 'gbraid', 'wbraid'] as const;
const PUBLIC_PATHS = new Set(['/', '/about', '/contact', '/journeys', '/plan-my-journey', '/destinations', '/tours', '/packages', '/stays', '/stays/search', '/homestays', '/experiences', '/experts', '/transport', '/transport/partner', '/booking', '/faqs', '/why-the-apex-voyager', '/careers', '/terms', '/privacy', '/data-deletion', '/photo-credits', '/accessibility-policy', '/cancellation-policy']);
export function safePublicPath(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 2048 || !raw.startsWith('/') || raw.startsWith('//') || /[\u0000-\u0020\u007f\\]/.test(raw)) return null;
  const path = raw.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';
  if (PUBLIC_PATHS.has(path)) return path;
  // Dynamic routes retain only route family; arbitrary slugs may contain PII.
  const match = /^\/(journeys|destinations|tours|packages|stays|homestays|experiences|experts|regions)\/[a-zA-Z0-9/_-]+$/.exec(path);
  return match ? `/${match[1]}` : null;
}
export function safeTag(raw: unknown, max: number): string | null {
  if (typeof raw !== 'string' || raw.length > max || /[\u0000-\u001f\u007f<>%@]/.test(raw)) return null;
  const value = raw.trim(); return !value || /(?:\+?\d[\s()-]*){10,}/.test(value) ? null : value;
}
export function safeClickId(raw: unknown): string | null { return typeof raw === 'string' && /^[A-Za-z0-9_-]{1,256}$/.test(raw) ? raw : null; }
export function safeReferrer(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 2048 || /[\u0000-\u0020\u007f\\]/.test(raw)) return null;
  try { const u = new URL(raw); if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || u.origin.length > 300 || ['www.theapexvoyager.in', 'theapexvoyager.in', 'localhost', '127.0.0.1'].includes(u.hostname)) return null; return u.origin; } catch { return null; }
}
export function safeTime(raw: unknown, now: number): string | null {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(raw)) return null;
  const n = Date.parse(raw); return Number.isFinite(n) && new Date(n).toISOString().slice(0,19) === raw.slice(0,19) && n >= now - ATTRIBUTION_TTL_MS && n <= now + 300000 ? new Date(n).toISOString() : null;
}
const record = (r: unknown): Record<string, unknown> => r && typeof r === 'object' && !Array.isArray(r) ? r as Record<string, unknown> : {};
const valueOf = (r: unknown) => record(r).value;
export function evidence(value: string | null, kind: 'FIRST_PARTY_OBSERVED' | 'URL_REPORTED', observedAt: string | null): Evidence { return { value, kind: value === null ? 'UNKNOWN' : kind, origin: kind === 'URL_REPORTED' ? 'request_url' : 'website', observedAt }; }
export function sanitizeTouch(raw: unknown, now: number): AttributionTouch | null {
  const r = record(raw), at = safeTime(r.observedAt, now); if (!at) return null;
  const tags = Object.fromEntries(Object.entries(TAG_LIMITS).map(([k,max]) => [k,evidence(safeTag(valueOf(r[k]),max),'URL_REPORTED',at)]));
  const clicks = Object.fromEntries(CLICK_KEYS.map(k => [k,evidence(safeClickId(valueOf(r[k])),'URL_REPORTED',at)]));
  return { observedAt: at, landingPage: evidence(safePublicPath(valueOf(r.landingPage)),'FIRST_PARTY_OBSERVED',at), externalReferrerOrigin: evidence(safeReferrer(valueOf(r.externalReferrerOrigin)),'FIRST_PARTY_OBSERVED',at), ...tags,...clicks } as AttributionTouch;
}
export function isTagged(t: AttributionTouch): boolean { return [...Object.keys(TAG_LIMITS),...CLICK_KEYS].some(k => t[k as keyof typeof TAG_LIMITS | typeof CLICK_KEYS[number]].value !== null); }
export function sanitizeFirstParty(raw: unknown, now = Date.now(), server = true): FirstPartyAttribution | undefined {
  const r = record(raw); if (r.version !== 2) return undefined;
  const firstTouch = sanitizeTouch(r.firstTouch,now), latest = sanitizeTouch(r.latestTaggedTouch,now), s = record(r.submissionPage);
  return { version: 2, firstTouch, latestTaggedTouch: latest && isTagged(latest) && (!firstTouch || Date.parse(latest.observedAt) >= Date.parse(firstTouch.observedAt)) ? latest : null, submissionPage: evidence(safePublicPath(s.value),'FIRST_PARTY_OBSERVED',safeTime(s.observedAt,now)), ...(server ? { recordedAt: new Date(now).toISOString() } : {}) };
}
