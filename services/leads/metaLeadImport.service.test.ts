import { describe, expect, it } from 'vitest';
import { analyzeMetaLeads, type ExistingCrmIndex } from './metaLeadImport.service';
import { buildLeadQuery, serializeLead } from './lead.service';
import type { MetaGraphLead } from '@/lib/metaLeads';

const lead = (id: string, phone?: string, email?: string, extra: Partial<MetaGraphLead> = {}): MetaGraphLead => ({
  id, created_time: '2026-09-15T08:00:00+0000', form_id: 'F1', campaign_id: 'C1', platform: 'fb',
  field_data: [{ name: 'full_name', values: ['Synthetic'] }, ...(phone ? [{ name: 'phone_number', values: [phone] }] : []), ...(email ? [{ name: 'email', values: [email] }] : [])], ...extra
});
const none: ExistingCrmIndex = { metaLeadIds: new Set(), phones: new Set(), emails: new Set() };

describe('historical Meta import dry-run analysis', () => {
  it('reports aggregates: retrieved, identifiable, invalid, forms, campaigns, date range', () => {
    const a = analyzeMetaLeads([
      lead('1000000001', '9876543210'), lead('1000000002', undefined, 'a@example.com', { form_id: 'F2', campaign_id: 'C2', created_time: '2026-10-02T08:00:00+0000' }),
      lead('1000000003'), { id: '', field_data: [] }
    ], none);
    expect(a).toMatchObject({ retrieved: 4, identifiable: 2, invalid: 1, requiresReview: 1, wouldCreate: 2, forms: 2, campaigns: 2, dateRange: { from: '2026-09-15', to: '2026-10-02' } });
    expect(Object.keys(a.invalidReasons).length).toBe(2);
  });
  it('is idempotent against already-imported Meta lead ids and counts in-batch repeats once', () => {
    const existing: ExistingCrmIndex = { ...none, metaLeadIds: new Set(['1000000001']) };
    const a = analyzeMetaLeads([lead('1000000001', '9876543210'), lead('1000000002', '9876543211'), lead('1000000002', '9876543211')], existing);
    expect(a).toMatchObject({ alreadyImported: 2, wouldCreate: 1 });
    expect(analyzeMetaLeads([lead('1000000002', '9876543211')], { ...none, metaLeadIds: new Set(['1000000002']) }).wouldCreate).toBe(0);
  });
  it('flags customers that already exist in the CRM or repeat within the batch, but still preserves every new Meta lead', () => {
    const existing: ExistingCrmIndex = { ...none, phones: new Set(['9876543210']), emails: new Set(['known@example.com']) };
    const a = analyzeMetaLeads([lead('1000000010', '+91 98765 43210'), lead('1000000011', undefined, 'KNOWN@example.com'), lead('1000000012', '9000000001'), lead('1000000013', '9000000001')], existing);
    expect(a).toMatchObject({ matchesExistingContact: 2, duplicatesWithinBatch: 1, wouldCreate: 4 });
  });
  it('the printable summary has no customer data keys', () => {
    const { payloads, createdAt, ...summary } = analyzeMetaLeads([lead('1000000020', '9876543210', 'x@example.com')], none);
    expect(payloads).toHaveLength(1);
    expect(createdAt).toHaveLength(1);
    expect(JSON.stringify(summary)).not.toMatch(/9876543210|x@example|Synthetic|1000000020/);
  });
});

describe('CRM source filter and serialisation for Meta', () => {
  it('source=meta filters by source', () => expect(buildLeadQuery({ source: 'meta' }).query).toMatchObject({ source: 'meta' }));
  it('serialises Meta provenance for the internal CRM and carries no secrets', () => {
    const doc = {
      _id: 'a'.repeat(24), name: undefined, captureKind: 'META_LEAD_AD', leadType: 'GENERAL', status: 'NEW', priority: 'NORMAL', source: 'meta', events: [], createdAt: new Date(), updatedAt: new Date(),
      meta: { leadId: '123456', campaignName: 'Winter', formId: 'F1', createdTime: new Date('2026-09-15T08:00:00Z'), answers: [{ name: 'city', values: ['Pune'] }] }
    };
    const out = serializeLead(doc as never);
    expect(out).toMatchObject({ source: 'meta', captureKind: 'META_LEAD_AD', meta: { leadId: '123456', campaignName: 'Winter', createdTime: '2026-09-15T08:00:00.000Z', answers: [{ name: 'city', values: ['Pune'] }] } });
    expect(JSON.stringify(out)).not.toMatch(/token|secret/i);
  });
});
