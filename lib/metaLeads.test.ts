import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  csvToMetaLeads, decodeMetaCsv, normalizeMetaLead, parseCsv, parseLeadgenWebhook, sanitizeMeta, verifyMetaChallenge, verifyMetaSignature,
  type MetaGraphLead
} from './metaLeads';
import { validateLeadInput } from './leads';

const SECRET = 'synthetic-app-secret';
const sign = (body: string, secret = SECRET) => `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

describe('webhook signature (X-Hub-Signature-256)', () => {
  const body = JSON.stringify({ object: 'page', entry: [] });
  it('accepts the exact HMAC of the raw body', () => expect(verifyMetaSignature(body, sign(body), SECRET)).toBe(true));
  it.each([
    ['wrong secret', sign(JSON.stringify({ object: 'page', entry: [] }), 'other')],
    ['tampered body', sign(body + ' ')],
    ['missing prefix', sign(body).slice(7)],
    ['empty', ''],
    ['sha1 scheme', 'sha1=' + 'a'.repeat(40)],
    ['truncated', sign(body).slice(0, -2)],
    ['uppercase hex is a different string', sign(body).toUpperCase()]
  ])('rejects %s', (_label, header) => expect(verifyMetaSignature(body, header, SECRET)).toBe(false));
  it('rejects when the header or secret is absent', () => {
    expect(verifyMetaSignature(body, null, SECRET)).toBe(false);
    expect(verifyMetaSignature(body, sign(body), undefined)).toBe(false);
  });
});

describe('subscription challenge', () => {
  const q = (o: Record<string, string>) => new URLSearchParams(o);
  it('echoes the challenge only for subscribe + the right token', () => {
    expect(verifyMetaChallenge(q({ 'hub.mode': 'subscribe', 'hub.verify_token': 'tok', 'hub.challenge': '12345' }), 'tok')).toBe('12345');
    expect(verifyMetaChallenge(q({ 'hub.mode': 'subscribe', 'hub.verify_token': 'bad', 'hub.challenge': '1' }), 'tok')).toBeNull();
    expect(verifyMetaChallenge(q({ 'hub.mode': 'unsubscribe', 'hub.verify_token': 'tok', 'hub.challenge': '1' }), 'tok')).toBeNull();
    expect(verifyMetaChallenge(q({ 'hub.mode': 'subscribe', 'hub.verify_token': 'tok' }), 'tok')).toBeNull();
    expect(verifyMetaChallenge(q({ 'hub.mode': 'subscribe', 'hub.verify_token': 'tok', 'hub.challenge': '1' }), undefined)).toBeNull();
  });
});

describe('leadgen payload parsing', () => {
  const change = (v: object, field = 'leadgen') => ({ field, value: v });
  const page = (changes: unknown[]) => ({ object: 'page', entry: [{ id: '111', time: 1, changes }] });
  it('extracts leadgen changes and ignores everything else', () => {
    const parsed = parseLeadgenWebhook(page([
      change({ leadgen_id: '987654321012345', page_id: '111', form_id: '222', ad_id: '333', created_time: 1700000000 }),
      change({ leadgen_id: '1' }), change({ leadgen_id: '987654321012346' }, 'feed'), change({ nope: true })
    ]));
    expect(parsed).toMatchObject({ ok: true, ignored: 3 });
    if (parsed.ok) expect(parsed.changes).toEqual([{ leadgenId: '987654321012345', pageId: '111', formId: '222', adId: '333', createdTime: 1700000000 }]);
  });
  it('treats non-page objects as ignorable and malformed bodies as invalid', () => {
    expect(parseLeadgenWebhook({ object: 'instagram', entry: [] })).toMatchObject({ ok: true, changes: [] });
    for (const bad of [null, 'x', 42, []]) expect(parseLeadgenWebhook(bad)).toEqual({ ok: false });
  });
  it('caps the number of changes processed per request', () => {
    const many = page(Array.from({ length: 80 }, (_, i) => change({ leadgen_id: String(10000 + i) })));
    const parsed = parseLeadgenWebhook(many);
    expect(parsed.ok && parsed.changes.length).toBe(50);
  });
});

const graphLead = (extra: Partial<MetaGraphLead> = {}): MetaGraphLead => ({
  id: '555000111222333', created_time: '2026-10-01T10:30:00+0000', ad_id: '7001', ad_name: 'Winter Spiti ad', adset_id: '7002', adset_name: 'India 25-45',
  campaign_id: '7003', campaign_name: 'Winter Leads', form_id: '8001', platform: 'fb', is_organic: false,
  field_data: [
    { name: 'full_name', values: ['Synthetic Person'] }, { name: 'email', values: ['Person@Example.com'] }, { name: 'phone_number', values: ['+91 98765 43210'] },
    { name: 'city', values: ['Delhi'] }, { name: 'which_destination_are_you_interested_in?', values: ['Spiti Valley'] },
    { name: 'when_do_you_plan_to_travel?', values: ['December'] }, { name: 'number_of_travellers', values: ['4'] },
    { name: 'what_is_your_budget_per_person?', values: ['Rs 30,000'] }, { name: 'date_of_birth', values: ['1990-01-01'] }, { name: 'gender', values: ['x'] }
  ],
  ...extra
});

describe('Meta lead normalisation', () => {
  it('maps standard fields, keeps custom answers, drops sensitive ones, and records provenance', () => {
    const n = normalizeMetaLead(graphLead(), { pageId: '111', formName: 'Winter form' })!;
    expect(n.payload).toMatchObject({
      name: 'Synthetic Person', email: 'Person@Example.com', phone: '+91 98765 43210', leadType: 'GENERAL', captureKind: 'META_LEAD_AD',
      destination: 'Spiti Valley', adults: 4, attribution: { source: 'meta', sourceDetail: 'meta-instant-form' }, legacyRef: { model: 'MetaLeadAd', id: '555000111222333' }
    });
    expect(n.meta).toMatchObject({ leadId: '555000111222333', pageId: '111', formId: '8001', formName: 'Winter form', campaignId: '7003', campaignName: 'Winter Leads', adSetId: '7002', adId: '7001', platform: 'fb', isOrganic: false });
    expect(n.meta.createdTime?.toISOString()).toBe('2026-10-01T10:30:00.000Z');
    const names = n.meta.answers.map(a => a.name);
    expect(names).toContain('city');
    expect(names).toContain('when_do_you_plan_to_travel?');
    expect(names).not.toContain('date_of_birth');
    expect(names).not.toContain('gender');
    expect(String(n.payload.message)).toContain('when do you plan to travel?: December');
    expect(JSON.stringify(n)).not.toMatch(/1990-01-01/);
  });
  it('validates into a Lead payload that is source=meta, not website or WhatsApp, and only with allowMeta', () => {
    const n = normalizeMetaLead(graphLead())!;
    const ok = validateLeadInput(n.payload, { allowMeta: true });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.value.captureKind).toBe('META_LEAD_AD');
      expect(ok.value.attribution?.source).toBe('meta');
      expect(ok.value.meta?.leadId).toBe('555000111222333');
      expect(ok.value.phone).toBe('9876543210');
    }
    const denied = validateLeadInput(n.payload); // public / manual paths can never inject provenance
    expect(denied.ok && denied.value.meta).toBeUndefined();
  });
  it('copes with missing optional fields, email-only leads and custom-only forms', () => {
    const emailOnly = normalizeMetaLead({ id: '9000000001', field_data: [{ name: 'email', values: ['a@example.com'] }] })!;
    const v = validateLeadInput(emailOnly.payload, { allowMeta: true });
    expect(v.ok && [v.value.name, v.value.phone, v.value.email]).toEqual([undefined, undefined, 'a@example.com']);
    const noContact = normalizeMetaLead({ id: '9000000002', field_data: [{ name: 'city', values: ['Pune'] }] })!;
    expect(validateLeadInput(noContact.payload, { allowMeta: true }).ok).toBe(false);
    const custom = normalizeMetaLead({ id: '9000000003', field_data: [{ name: 'phone_number', values: ['9876543210'] }, { name: 'preferred_hotel_type', values: ['Homestay'] }, { name: 'empty', values: [] }] })!;
    expect(custom.meta.answers).toEqual([{ name: 'phone_number', values: ['9876543210'] }, { name: 'preferred_hotel_type', values: ['Homestay'] }]);
  });
  it('drops a malformed phone but keeps the lead when an email exists', () => {
    const n = normalizeMetaLead({ id: '9000000004', field_data: [{ name: 'phone_number', values: ['call me'] }, { name: 'email', values: ['b@example.com'] }] })!;
    const v = validateLeadInput(n.payload, { allowMeta: true });
    expect(v.ok && v.value.phone).toBeUndefined();
    expect(v.ok && v.value.email).toBe('b@example.com');
  });
  it('never stores sensitive Meta fields (DOB, gender, marital, address, ID, health, income) but keeps contact fields', () => {
    const sensitive = ['date_of_birth', 'dob', 'gender', 'marital_status', 'relationship_status', 'military_status', 'street_address', 'full_address', 'what is your home address', 'zip_code', 'pin_code',
      'aadhaar_number', 'pan_number', 'passport_number', 'government_id', 'driving_licence', 'health_conditions', 'medical_needs', 'annual_income', 'salary', 'religion', 'nationality'];
    const kept = ['email', 'e-mail address', 'email_address', 'work_email', 'phone_number', 'full_name', 'city', 'state', 'country', 'preferred_travel_month'];
    const n = normalizeMetaLead({ id: '9000000009', field_data: [...sensitive, ...kept].map(name => ({ name, values: ['x'] })) })!;
    const stored = n.meta.answers.map(a => a.name);
    for (const name of sensitive) expect(stored, name).not.toContain(name);
    for (const name of kept) expect(stored, name).toContain(name);
    expect(String(n.payload.message)).not.toMatch(/birth|gender|marital|address|income|passport/i);
  });
  it('rejects leads with an unusable id and bounds oversized/odd input', () => {
    expect(normalizeMetaLead({ id: '' })).toBeNull();
    expect(normalizeMetaLead({ id: 'bad id!' })).toBeNull();
    const big = normalizeMetaLead({ id: '9000000005', field_data: Array.from({ length: 100 }, (_, i) => ({ name: `q${i}`, values: ['x'.repeat(2000)] })) })!;
    expect(big.meta.answers.length).toBe(40);
    expect(big.meta.answers[0].values[0].length).toBe(500);
    expect(String(big.payload.message).length).toBeLessThanOrEqual(5000);
  });
  it('sanitizeMeta never carries unknown keys (e.g. tokens) through', () => {
    const clean = sanitizeMeta({ leadId: '123456', access_token: 'SECRET', answers: [{ name: 'a', values: ['b'], token: 'x' }], extra: 1 });
    expect(JSON.stringify(clean)).not.toMatch(/SECRET|token|extra/);
    expect(sanitizeMeta({ nope: 1 })).toBeUndefined();
  });
});

describe('Leads Center CSV (alternative historical source)', () => {
  const csv = 'id,created_time,campaign_name,form_name,platform,full_name,email,phone_number,custom question\r\n"l_1","2026-09-01T10:00:00+0000","Camp, with comma","Form ""A""",fb,Ann Test,ann@example.com,+919876543210,"multi\nline"\r\nl_2,2026-09-02T10:00:00+0000,Camp,Form,ig,,bob@example.com,,\r\n';
  it('parses quotes, commas, newlines in fields and maps to the Graph lead shape', () => {
    const leads = csvToMetaLeads(parseCsv(csv));
    expect(leads).toHaveLength(2);
    expect(leads[0]).toMatchObject({ id: 'l_1', campaign_name: 'Camp, with comma', form_name: 'Form "A"', platform: 'fb' });
    expect(leads[0].field_data).toContainEqual({ name: 'custom question', values: ['multi\nline'] });
    expect(leads[1].field_data?.map(f => f.name)).toEqual(['email']);
  });
  it('decodes UTF-16LE tab-separated exports', () => {
    const tsv = 'id\tfull_name\tphone_number\nl_9\tAnn\t9876543210\n';
    const bytes = new Uint8Array([0xff, 0xfe, ...Buffer.from(tsv, 'utf16le')]);
    const leads = csvToMetaLeads(parseCsv(decodeMetaCsv(bytes)));
    expect(leads[0].id).toBe('l_9');
    expect(leads[0].field_data?.map(f => f.name)).toEqual(['full_name', 'phone_number']);
  });
});
