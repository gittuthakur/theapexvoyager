import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { sanitizeFirstParty, safePublicPath, safeReferrer, safeTag, safeTime, ATTRIBUTION_TTL_MS } from './attributionEvidence';
import { validateLeadInput, sanitizeAttribution } from './leads';
import { inquiryToLeadPayload, bookingRequestToLeadPayload, enquiryToLeadPayload } from './leadLegacyMapping';
import { buildTransportClickLead } from './leadEvents';

let api: typeof import('./leadAttribution');
let location: { pathname: string; search: string; origin: string };
let stored: Map<string, string>;
beforeEach(async () => {
  vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-10T12:00:00Z'));
  location = { pathname: '/journeys/manali-tour', search: '', origin: 'https://www.theapexvoyager.in' }; stored = new Map();
  vi.stubGlobal('window', { location, sessionStorage: { getItem: (k: string) => stored.get(k), setItem: (k: string, v: string) => stored.set(k,v) } });
  vi.stubGlobal('document', { referrer: '' }); api = await import('./leadAttribution');
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('session touch capture', () => {
  it('direct visit preserves Unknown acquisition; captures landing/submission separately', () => {
    api.captureAttribution(); location.pathname = '/contact'; const a = api.getAttribution();
    expect(a.firstParty?.firstTouch?.landingPage.value).toBe('/journeys'); expect(a.firstParty?.submissionPage.value).toBe('/contact');
    expect(a.firstParty?.latestTaggedTouch).toBeNull(); expect(a.firstParty?.firstTouch?.utmSource.kind).toBe('UNKNOWN');
  });
  it('organic referrer keeps only origin and does not invent organic/paid source', () => {
    vi.stubGlobal('document', { referrer: 'https://google.com/search?q=private@example.com#secret' });
    const a = api.getAttribution(); expect(a.referrer).toBe('https://google.com'); expect(a.utmSource).toBeUndefined();
  });
  it('internal navigation preserves first touch and latest tagged values', () => {
    location.search = '?utm_source=google&utm_medium=cpc&utm_campaign=summer&utm_content=ad1&utm_term=mountains'; api.captureAttribution();
    location.pathname = '/contact'; location.search = ''; api.captureAttribution();
    const a = api.getAttribution(); expect(a.firstParty?.firstTouch?.utmCampaign.value).toBe('summer'); expect(a.utmCampaign).toBe('summer');
    expect(a.firstParty?.latestTaggedTouch?.landingPage.value).toBe('/journeys'); expect(a.firstParty?.submissionPage.value).toBe('/contact');
  });
  it('a later tagged visit changes latest only and keeps click IDs separate', () => {
    location.search = '?utm_source=google&gclid=AbC_123'; api.captureAttribution();
    vi.advanceTimersByTime(1000); location.pathname = '/plan-my-journey'; location.search = '?utm_source=instagram&gbraid=braid-1&wbraid=braid_2';
    const a = api.getAttribution(); expect(a.firstParty?.firstTouch?.gclid.value).toBe('AbC_123');
    expect(a.firstParty?.latestTaggedTouch?.gclid.value).toBeNull(); expect(a.firstParty?.latestTaggedTouch?.gbraid.value).toBe('braid-1');
    expect(a.firstParty?.latestTaggedTouch?.wbraid.kind).toBe('URL_REPORTED'); expect(a.utmSource).toBe('instagram');
    expect(JSON.stringify(a)).not.toContain('campaignName');
  });
  it('blocked storage still preserves navigation in memory and permits form submission', async () => {
    Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('blocked'); } });
    location.search = '?utm_campaign=summer'; api.captureAttribution(); location.search = ''; location.pathname = '/contact';
    expect(api.getAttribution().utmCampaign).toBe('summer');
    const fetch = vi.fn().mockResolvedValue({ok:true,json:async()=>({received:true})}); vi.stubGlobal('fetch',fetch);
    const { postJSON } = await import('./api'); await expect(postJSON('/api/contact',{fullName:'Synthetic'})).resolves.toEqual({received:true});
    expect(JSON.parse(fetch.mock.calls[0][1].body).attribution.firstParty.version).toBe(2);
  });
  it('rejects duplicate, malformed, overlong and sensitive parameters without storing URLs', () => {
    location.search = '?utm_source=google&utm_source=meta&utm_campaign=private%40example.com&gclid=bad%20id&email=private&token=secret';
    expect(api.getAttribution().utmSource).toBeUndefined();
    expect(api.getAttribution().firstParty?.firstTouch?.utmCampaign.value).toBeNull();
    expect(JSON.stringify([...stored.values()])).not.toMatch(/private|secret|email=|token=/);
    location.search = '?utm_term=' + 'a'.repeat(151); expect(api.getAttribution().utmTerm).toBeUndefined();
  });
  it('expires the visit after 24 hours and ignores corrupt storage', () => {
    location.search = '?utm_campaign=summer'; api.captureAttribution(); vi.advanceTimersByTime(ATTRIBUTION_TTL_MS + 1);
    location.search = ''; location.pathname = '/contact'; expect(api.getAttribution().utmCampaign).toBeUndefined();
    stored.set('apex_attribution_v2','{invalid'); expect(() => api.getAttribution()).not.toThrow();
  });
});
describe('server validation and compatibility', () => {
  it('reconstructs evidence, strips provider fields and refuses provider elevation', () => {
    location.search = '?utm_source=google&gclid=click-1'; const a = api.getAttribution();
    const raw = JSON.parse(JSON.stringify(a.firstParty)); raw.firstTouch.utmSource.kind = 'PROVIDER_VERIFIED'; raw.firstTouch.campaignName = 'fake'; raw.meta = {campaignId:'fake'}; raw.recordedAt = 'fake';
    const clean = sanitizeFirstParty(raw)!; expect(clean.firstTouch?.utmSource.kind).toBe('URL_REPORTED');
    expect(clean.recordedAt).toBe(new Date().toISOString()); expect(JSON.stringify(clean)).not.toContain('fake');
    const p = validateLeadInput({name:'Synthetic',phone:'9876543210',captureKind:'META_LEAD_AD',meta:{leadId:'123456789'},attribution:{firstParty:raw}});
    expect(p.ok && p.value.meta).toBeUndefined();
  });
  it('does not let flat fields shadow sanitized versioned attribution', () => {
    const a = api.getAttribution(); const clean = sanitizeAttribution({...a,landingPage:'https://evil.example/private',utmCampaign:'fake'});
    expect(clean.landingPage).toBe('/journeys'); expect(clean.utmCampaign).toBeUndefined();
  });
  it('preserves legacy payloads and passes optional envelope through all enquiry mappers', () => {
    expect(sanitizeAttribution({utmSource:'google',utmCampaign:'legacy'})).toMatchObject({source:'google',utmCampaign:'legacy'});
    const a = api.getAttribution();
    const mapped = [inquiryToLeadPayload({name:'Synthetic',phone:'9876543210'},a), enquiryToLeadPayload({fullName:'Synthetic',phone:'9876543210'},a), bookingRequestToLeadPayload({name:'Synthetic',phone:'9876543210',type:'journey',details:{source:'trip-planner'}},a)];
    for (const p of mapped) { const result = validateLeadInput(p); expect(result.ok && result.value.attribution?.firstParty?.version).toBe(2); }
    expect(validateLeadInput({name:'Synthetic',phone:'9876543210'}).ok).toBe(true);
    expect(sanitizeAttribution({firstParty:{version:999}}).firstParty).toBeUndefined();
  });
  it('WhatsApp handoff remains a click, regardless of campaign data', () => {
    location.search = '?utm_source=google';
    const p = buildTransportClickLead({kind:'transport-whatsapp-customise',clickId:'fixture-click-123',vehicle:'Car',attribution:api.getAttribution()});
    expect(p.ok && p.payload.captureKind).toBe('WHATSAPP_CLICK'); expect(p.ok && (p.payload.attribution as {source:string}).source).toBe('whatsapp');
  });
  it('strict URL, referrer, timestamps and types; no arbitrary private paths', () => {
    for (const p of ['https://evil.example/private','//evil.example/path','/internal/leads','/journeys/private%40example.com',{},'/journeys\\secret']) expect(safePublicPath(p)).toBeNull();
    expect(safePublicPath('/contact?email=private#secret')).toBe('/contact');
    expect(safeReferrer('https://user:password@google.com/search')).toBeNull(); expect(safeReferrer('javascript:alert(1)')).toBeNull();
    expect(safeTag('+91 98765 43210',150)).toBeNull(); expect(safeTime('2026-02-30T00:00:00Z',Date.now())).toBeNull();
    expect(sanitizeFirstParty([])).toBeUndefined();
  });
});
