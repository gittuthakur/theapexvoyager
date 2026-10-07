import { describe, expect, it, vi } from 'vitest';
import { ingestLeadgenChanges, type IngestDeps, type IngestFailure } from './metaLeadIngest.service';
import { MetaGraphError, classifyGraphError } from '@/lib/metaGraph';
import type { LeadgenChange, MetaGraphLead } from '@/lib/metaLeads';

const change = (id = '555000111222331', extra: Partial<LeadgenChange> = {}): LeadgenChange => ({ leadgenId: id, pageId: '111', formId: '8001', adId: '7001', createdTime: 1_700_000_000, ...extra });
const goodLead: MetaGraphLead = { id: '555000111222331', field_data: [{ name: 'full_name', values: ['Synthetic Person'] }, { name: 'phone_number', values: ['9876543210'] }] };
const deps = (over: Partial<IngestDeps> = {}): IngestDeps & { logged: IngestFailure[] } => {
  const logged: IngestFailure[] = [];
  return { logged, fetchLead: async () => goodLead, capture: async () => ({ ok: true, value: { created: true } }), log: f => { logged.push(f); }, ...over };
};
const graphFail = (status: number, code?: number, subcode?: number) => async () => { throw new MetaGraphError(classifyGraphError(status, code, subcode)); };

describe('ingestLeadgenChanges - retry classification', () => {
  it('a normal lead is created and nothing is logged', async () => {
    const d = deps();
    expect(await ingestLeadgenChanges([change()], {}, d)).toMatchObject({ created: 1, failed: 0, invalid: 0, failures: [] });
    expect(d.logged).toEqual([]);
  });
  it.each([
    ['AUTH 190', 400, 190, 463, 'META_GRAPH_AUTH_ERROR'], ['AUTH 102', 400, 102, undefined, 'META_GRAPH_AUTH_ERROR'],
    ['PERMISSION 10', 403, 10, undefined, 'META_GRAPH_PERMISSION_ERROR'], ['PERMISSION 283', 400, 283, undefined, 'META_GRAPH_PERMISSION_ERROR'],
    ['OBJECT_ACCESS 100/33', 400, 100, 33, 'META_GRAPH_OBJECT_ACCESS_ERROR'], ['RATE_LIMIT 429', 429, undefined, undefined, 'META_GRAPH_RATE_LIMIT_ERROR'],
    ['SERVER 500', 500, undefined, undefined, 'META_GRAPH_SERVER_ERROR'], ['NETWORK', 0, undefined, undefined, 'META_GRAPH_NETWORK_ERROR'],
    ['UNKNOWN 4xx', 400, undefined, undefined, 'META_GRAPH_UNKNOWN_ERROR']
  ])('%s is RETRYABLE: counted as failed (non-2xx upstream), never as success, with a fixed-field log', async (_l, status, code, subcode, category) => {
    const d = deps({ fetchLead: graphFail(status, code, subcode) });
    const r = await ingestLeadgenChanges([change()], {}, d);
    expect(r).toMatchObject({ created: 0, existing: 0, failed: 1, invalid: 0 });
    expect(d.logged).toEqual([{ category, stage: 'GRAPH_RETRIEVAL', retryable: true, status, code, subcode }]);
  });
  it.each([['NOT_FOUND 404', 404, undefined, undefined, 'META_GRAPH_NOT_FOUND_ERROR'], ['BAD_REQUEST 100', 400, 100, 2500, 'META_GRAPH_BAD_REQUEST_ERROR']])(
    '%s is PERMANENT: acknowledged (invalid), still logged', async (_l, status, code, subcode, category) => {
      const d = deps({ fetchLead: graphFail(status, code, subcode) });
      const r = await ingestLeadgenChanges([change()], {}, d);
      expect(r).toMatchObject({ failed: 0, invalid: 1 });
      expect(d.logged[0]).toMatchObject({ category, retryable: false });
    });
  it('a non-Graph exception during retrieval is retryable, not silently dropped', async () => {
    const r = await ingestLeadgenChanges([change()], {}, deps({ fetchLead: async () => { throw new Error('boom Synthetic'); } }));
    expect(r).toMatchObject({ failed: 1, invalid: 0 });
  });
  it('a database failure is retryable (META_LEAD_SAVE_ERROR); a no-contact lead is permanent (META_LEAD_NO_CONTACT)', async () => {
    const db = deps({ capture: async () => { throw new Error('mongo down LEAK-MARKER-DB'); } });
    expect(await ingestLeadgenChanges([change()], {}, db)).toMatchObject({ failed: 1, created: 0 });
    expect(db.logged).toEqual([{ category: 'META_LEAD_SAVE_ERROR', stage: 'SAVE', retryable: true }]);
    const nc = deps({ capture: async () => ({ ok: false, error: 'A phone, WhatsApp number or email is required' }) });
    expect(await ingestLeadgenChanges([change()], {}, nc)).toMatchObject({ failed: 0, invalid: 1 });
    expect(nc.logged[0]).toMatchObject({ category: 'META_LEAD_NO_CONTACT', retryable: false });
    const other = deps({ capture: async () => ({ ok: false, error: 'Invalid email address' }) });
    await ingestLeadgenChanges([change()], {}, other);
    expect(other.logged[0].category).toBe('META_LEAD_INVALID');
  });
  it('an existing provider record is `existing` (idempotent redelivery), not a failure', async () => {
    const r = await ingestLeadgenChanges([change()], {}, deps({ capture: async () => ({ ok: true, value: { created: false } }) }));
    expect(r).toMatchObject({ created: 0, existing: 1, failed: 0, invalid: 0 });
  });
  it('page/form allow-lists skip without any Graph call', async () => {
    const fetchLead = vi.fn(async () => goodLead);
    const r = await ingestLeadgenChanges([change('555000111222331', { pageId: '999' })], { pageId: '111' }, deps({ fetchLead }));
    expect(r).toMatchObject({ skipped: 1, failed: 0 });
    expect(fetchLead).not.toHaveBeenCalled();
  });
  it('a throwing logger can never change the outcome', async () => {
    const r = await ingestLeadgenChanges([change()], {}, deps({ fetchLead: graphFail(400, 190), log: () => { throw new Error('log sink down'); } }));
    expect(r).toMatchObject({ failed: 1 });
  });
  it('failure records can only contain the fixed fields (no lead id, token, contact detail or answers)', async () => {
    const d = deps({ fetchLead: graphFail(400, 190, 463) });
    await ingestLeadgenChanges([change('555000111222331')], {}, d);
    expect(Object.keys(d.logged[0]).sort()).toEqual(['category', 'code', 'retryable', 'stage', 'status', 'subcode']);
    expect(JSON.stringify(d.logged)).not.toMatch(/5550001|Synthetic|9876543210/);
  });
  it('uses the webhook created_time only when Graph time is missing/invalid, and ignores implausible webhook times', async () => {
    const seen: Record<string, unknown>[] = [];
    const capture = async (payload: Record<string, unknown>) => { seen.push(payload); return { ok: true as const, value: { created: true } }; };
    await ingestLeadgenChanges([change()], {}, deps({ capture }));
    await ingestLeadgenChanges([change('555000111222332', { createdTime: 1 })], {}, deps({ capture }));
    await ingestLeadgenChanges([change('555000111222333', { createdTime: Math.floor(Date.now() / 1000) + 10 * 86400 })], {}, deps({ capture }));
    const times = seen.map(p => (p.meta as { createdTime?: Date }).createdTime?.toISOString());
    expect(times).toEqual(['2023-11-14T22:13:20.000Z', undefined, undefined]);
  });
});
