import { describe, expect, it } from 'vitest';
import { csvToMetaLeads, isLeadsCenterCrmExport, normalizeMetaLead, parseCsv, parseLeadsCenterDate } from './metaLeads';
import { validateLeadInput } from './leads';
import { analyzeMetaLeads } from '@/services/leads/metaLeadImport.service';

// Synthetic rows in the exact column layout of the real Meta Leads Center CRM export (no real customer data).
const HEADER = 'Created,Name,Email address,Source,Form,Channel,Stage,Owner,Labels,Phone,Secondary phone number,WhatsApp number';
const CSV = [
  HEADER,
  '9/17/2026 10:19pm,Synthetic Phone,,Paid,Synthetic Packages Form,Phone number,Intake,Staff One,,+919000000001,,',
  '10/3/2026 9:05am,Synthetic Email,synthetic@example.com,Paid,Synthetic Packages Form,Email address,Intake,Staff One,,,,',
  '9/20/2026 12:00pm,Synthetic Insta,,Paid,Synthetic Packages Form,Instagram,Intake,Staff One,,,,',
  '9/21/2026 12:30am,Synthetic Direct,,Direct,,,Intake,Staff One,,9000000002,,',
  ''
].join('\r\n');

describe('Meta Leads Center CRM export (real column layout)', () => {
  const leads = csvToMetaLeads(parseCsv(CSV));
  it('is detected by its columns and never mistaken for the Graph-style export', () => {
    expect(isLeadsCenterCrmExport(parseCsv(CSV)[0])).toBe(true);
    expect(isLeadsCenterCrmExport(['id', 'created_time', 'full_name'])).toBe(false);
    expect(leads).toHaveLength(4);
  });
  it('parses M/D/YYYY h:mmam/pm (incl. 12am/12pm) as India time and rejects junk', () => {
    expect(parseLeadsCenterDate('9/17/2026 10:19pm')).toBe('2026-09-17T22:19:00+05:30');
    expect(parseLeadsCenterDate('9/21/2026 12:30am')).toBe('2026-09-21T00:30:00+05:30');
    expect(parseLeadsCenterDate('9/20/2026 12:00pm')).toBe('2026-09-20T12:00:00+05:30');
    expect(new Date(parseLeadsCenterDate('9/17/2026 10:19pm')!).toISOString()).toBe('2026-09-17T16:49:00.000Z');
    for (const bad of ['', undefined, '17/9/2026 10:19pm', '9/17/2026', 'yesterday', '13/1/2026 1:00am']) expect(parseLeadsCenterDate(bad as string)).toBeUndefined();
  });
  it('maps only fields that exist: name, phone, email, created time, form, source, channel, stage - and invents no campaign/ad/adset/platform', () => {
    const n = normalizeMetaLead(leads[0])!;
    expect(n.payload).toMatchObject({ name: 'Synthetic Phone', phone: '+919000000001', captureKind: 'META_LEAD_AD', attribution: { source: 'meta' } });
    expect(n.meta).toMatchObject({ formName: 'Synthetic Packages Form', isOrganic: false });
    expect(n.meta.createdTime?.toISOString()).toBe('2026-09-17T16:49:00.000Z');
    expect(n.meta.campaignId ?? n.meta.campaignName ?? n.meta.adId ?? n.meta.adSetId ?? n.meta.platform ?? n.meta.formId).toBeUndefined();
    expect(n.meta.answers.map(a => a.name)).toEqual(['full_name', 'phone_number', 'leads_center_channel', 'leads_center_stage']);
    expect(JSON.stringify(n)).not.toMatch(/Staff One/); // the internal Owner column is not imported
    expect(normalizeMetaLead(leads[3])!.meta.isOrganic).toBe(true); // Source "Direct"
  });
  it('gives each row a stable synthetic provider id (idempotent re-runs) distinct per row', () => {
    const again = csvToMetaLeads(parseCsv(CSV));
    expect(again.map(l => l.id)).toEqual(leads.map(l => l.id));
    expect(new Set(leads.map(l => l.id)).size).toBe(4);
    expect(leads[0].id).toMatch(/^lc:[0-9a-f]{24}$/);
    expect(validateLeadInput(normalizeMetaLead(leads[0])!.payload, { allowMeta: true }).ok).toBe(true);
  });
  it('classifies: phone/email rows WOULD_CREATE, name-only rows REQUIRES_REVIEW, and re-run is ALREADY_IMPORTED', () => {
    const empty = { metaLeadIds: new Set<string>(), phones: new Set<string>(), emails: new Set<string>() };
    const a = analyzeMetaLeads(leads, empty);
    expect(a.classification).toEqual({ WOULD_CREATE: 3, ALREADY_IMPORTED: 0, INVALID_OR_NON_IDENTIFIABLE: 0, DUPLICATE_PROVIDER_RECORD: 0, REQUIRES_REVIEW: 1 });
    expect(a).toMatchObject({ rowsWithPhone: 2, rowsWithEmail: 1, rowsWithBoth: 0, rowsWithNeither: 1, uniquePhones: 2, uniqueEmails: 1, newCustomerContacts: 3, forms: 1 });
    const ids = new Set(a.payloads.map(p => (p.legacyRef as { id: string }).id));
    const again = analyzeMetaLeads(leads, { ...empty, metaLeadIds: ids });
    expect(again.classification).toMatchObject({ WOULD_CREATE: 0, ALREADY_IMPORTED: 3 });
  });
  it('an existing CRM contact match is reported but the new Meta enquiry is still preserved', () => {
    const a = analyzeMetaLeads(leads, { metaLeadIds: new Set(), phones: new Set(['9000000001']), emails: new Set() });
    expect(a).toMatchObject({ matchesExistingContact: 1, wouldCreate: 3, newCustomerContacts: 2 });
  });
  it('the printable summary contains no customer data', () => {
    const { payloads, createdAt, ...summary } = analyzeMetaLeads(leads, { metaLeadIds: new Set(), phones: new Set(), emails: new Set() });
    expect(payloads.length + createdAt.length).toBeGreaterThan(0);
    expect(JSON.stringify(summary)).not.toMatch(/Synthetic|9000000|example\.com|lc:/);
  });
});
