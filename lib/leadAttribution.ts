import { CLICK_KEYS, TAG_LIMITS, ATTRIBUTION_TTL_MS, evidence, isTagged, safeClickId, safePublicPath, safeReferrer, safeTag, sanitizeFirstParty, type AttributionTouch, type FirstPartyAttribution } from '@/lib/attributionEvidence';
const KEY = 'apex_attribution_v2';
let memory: FirstPartyAttribution | undefined;
export interface ClientAttribution { utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string; utmTerm?: string; landingPage?: string; referrer?: string; firstParty?: FirstPartyAttribution }
function read(now: number): FirstPartyAttribution | undefined {
  if (memory) return sanitizeFirstParty(memory,now,false);
  try { const raw = window.sessionStorage.getItem(KEY); if (raw && raw.length <= 16000) return sanitizeFirstParty(JSON.parse(raw),now,false); } catch { /* Memory fallback. */ }
  return sanitizeFirstParty(memory,now,false);
}
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  const now = Date.now(), at = new Date(now).toISOString(), params = new URLSearchParams(window.location.search);
  const tags = Object.fromEntries(Object.entries(TAG_LIMITS).map(([key,max]) => { const queryKey = key.replace(/[A-Z]/g,c => '_' + c.toLowerCase()); return [key,evidence(params.getAll(queryKey).length === 1 ? safeTag(params.get(queryKey),max) : null,'URL_REPORTED',at)]; }));
  const clicks = Object.fromEntries(CLICK_KEYS.map(key => [key,evidence(params.getAll(key).length === 1 ? safeClickId(params.get(key)) : null,'URL_REPORTED',at)]));
  const referrer = safeReferrer(document.referrer);
  const touch = { observedAt: at, landingPage: evidence(safePublicPath(window.location.pathname),'FIRST_PARTY_OBSERVED',at), externalReferrerOrigin: evidence(referrer === window.location.origin ? null : referrer,'FIRST_PARTY_OBSERVED',at), ...tags,...clicks } as AttributionTouch;
  const previous = read(now), alive = previous?.firstTouch && now - Date.parse(previous.firstTouch.observedAt) < ATTRIBUTION_TTL_MS;
  const oldTagged = alive ? previous.latestTaggedTouch : null;
  const keys = [...Object.keys(TAG_LIMITS), ...CLICK_KEYS, 'landingPage', 'externalReferrerOrigin'] as const;
  const sameTagged = oldTagged && keys.every(k => oldTagged[k as keyof Omit<AttributionTouch, 'observedAt'>].value === touch[k as keyof Omit<AttributionTouch, 'observedAt'>].value);
  memory = { version: 2, firstTouch: alive ? previous.firstTouch : touch, latestTaggedTouch: isTagged(touch) ? sameTagged ? oldTagged : touch : oldTagged, submissionPage: evidence(null,'FIRST_PARTY_OBSERVED',null) };
  try { window.sessionStorage.setItem(KEY,JSON.stringify(memory)); } catch { /* Never block submission. */ }
}
export function getAttribution(): ClientAttribution {
  if (typeof window === 'undefined') return {};
  captureAttribution(); const firstParty = read(Date.now()); if (!firstParty) return {};
  firstParty.submissionPage = evidence(safePublicPath(window.location.pathname),'FIRST_PARTY_OBSERVED',new Date().toISOString());
  const preferred = firstParty.latestTaggedTouch ?? firstParty.firstTouch;
  return { firstParty, landingPage: firstParty.firstTouch?.landingPage.value ?? undefined, referrer: firstParty.firstTouch?.externalReferrerOrigin.value ?? undefined, ...Object.fromEntries(Object.keys(TAG_LIMITS).flatMap(key => { const v = preferred?.[key as keyof typeof TAG_LIMITS].value; return v ? [[key,v]] : []; })) };
}
