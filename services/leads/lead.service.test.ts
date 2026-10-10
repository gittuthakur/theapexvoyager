import type { LeadFilters, LeadPage } from './lead.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  findOne: vi.fn(), create: vi.fn(), updateOne: vi.fn(), findById: vi.fn(), findByIdAndUpdate: vi.fn(),
  find: vi.fn(), aggregate: vi.fn(), countDocuments: vi.fn()
}));
vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn() }));
vi.mock('@/models/Lead', () => ({ Lead: m }));
const svc = await import('./lead.service');

// findOne is awaited directly (legacyRef lookups) or chained with .sort() (duplicate lookup).
const q = (value: unknown) => ({ then: (resolve: (v: unknown) => unknown) => resolve(value), sort: () => Promise.resolve(value) });
const valid = { name: 'Fixture', phone: '9876543210', leadType: 'JOURNEY', journeySlug: 'manali-premium-escape' };
const ID = 'a'.repeat(24);
beforeEach(() => {
  Object.values(m).forEach(fn => fn.mockReset());
  m.findOne.mockImplementation(() => q(null));
  m.create.mockImplementation(async (doc: object) => ({ _id: 'new1', ...doc }));
  m.updateOne.mockResolvedValue({});
});

describe('createLead / duplicate + idempotency strategy', () => {
  it('saves a fresh lead as NEW with CREATED event and normalized phone', async () => {
    const result = await svc.captureLead(valid);
    expect(result.ok && result.value.created).toBe(true);
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'NEW', priority: 'NORMAL', phoneNormalized: '9876543210', source: 'website' }));
    expect(m.create.mock.calls[0][0].events[0]).toMatchObject({ type: 'CREATED' });
  });
  it('is idempotent on legacyRef: returns the existing lead and writes nothing', async () => {
    m.findOne.mockReturnValueOnce(q({ _id: 'existing' }));
    const result = await svc.captureLead({ ...valid, legacyRef: { model: 'Inquiry', id: 'x1' } });
    expect(result).toMatchObject({ ok: true, value: { created: false, lead: { _id: 'existing' } } });
    expect(m.create).not.toHaveBeenCalled();
  });
  it('survives a concurrent legacyRef race (11000) by returning the winner', async () => {
    m.findOne.mockReturnValueOnce(q(null)).mockReturnValueOnce(q(null)).mockReturnValueOnce(q({ _id: 'winner' }));
    m.create.mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 11000 }));
    const result = await svc.captureLead({ ...valid, legacyRef: { model: 'Inquiry', id: 'x2' } });
    expect(result).toMatchObject({ ok: true, value: { created: false, lead: { _id: 'winner' } } });
  });
  it('same person + same journey within the window still creates a NEW lead, linked to the earliest, history preserved', async () => {
    m.findOne.mockReturnValueOnce(q({ _id: 'orig' }));
    const result = await svc.captureLead(valid);
    expect(result.ok && result.value).toMatchObject({ created: true, duplicateOf: 'orig' });
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({ duplicateOf: 'orig' }));
    expect(m.create.mock.calls[0][0].events.map((e: { type: string }) => e.type)).toEqual(['CREATED', 'DUPLICATE_OF']);
    expect(m.updateOne).toHaveBeenCalledWith({ _id: 'orig' }, expect.objectContaining({ $push: expect.anything() }));
    const query = m.findOne.mock.calls[0][0];
    expect(query).toMatchObject({ leadType: 'JOURNEY', journeySlug: 'manali-premium-escape' });
    expect(query.$or).toEqual([{ phoneNormalized: '9876543210' }]);
  });
  it('manual leads skip duplicate detection', async () => {
    await svc.captureLead({ ...valid, captureKind: 'MANUAL' });
    expect(m.findOne).not.toHaveBeenCalled();
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({ source: 'manual', captureKind: 'MANUAL' }));
  });
  it('preserves UTM attribution and derives source from it', async () => {
    await svc.captureLead({ ...valid, attribution: { utmSource: 'instagram', utmMedium: 'social', utmCampaign: 'c', landingPage: '/a' } });
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({ source: 'instagram', utmSource: 'instagram', utmMedium: 'social', utmCampaign: 'c', landingPage: '/a' }));
  });
  it('rejects an invalid payload without touching the DB', async () => {
    expect(await svc.captureLead({ ...valid, phone: 'x' })).toMatchObject({ ok: false, status: 400 });
    expect(m.create).not.toHaveBeenCalled();
  });
});

describe('mirrorLegacyLead failure isolation', () => {
  it('never throws and logs no customer data when the DB write fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    m.create.mockRejectedValueOnce(new Error('db down for 9876543210'));
    await expect(svc.mirrorLegacyLead(valid)).resolves.toBeUndefined();
    expect(JSON.stringify(log.mock.calls)).not.toContain('9876543210');
    log.mockRestore();
  });
});

describe('status / follow-up behaviour', () => {
  const lead = (status: string) => ({ _id: ID, status, priority: 'NORMAL' });
  beforeEach(() => { m.findByIdAndUpdate.mockImplementation(async () => ({ _id: ID })); });

  it('marking WON/LOST/SPAM clears the follow-up date and logs the change', async () => {
    for (const to of ['WON', 'LOST', 'SPAM'] as const) {
      m.findById.mockResolvedValueOnce(lead('FOLLOW_UP'));
      await svc.updateLeadStatus(ID, to);
      const update = m.findByIdAndUpdate.mock.calls[m.findByIdAndUpdate.mock.calls.length - 1][1];
      expect(update.$unset).toEqual({ nextFollowUpAt: 1 });
      expect(update.$set.status).toBe(to);
      expect(update.$push.events.$each[0]).toMatchObject({ type: 'STATUS_CHANGE', from: 'FOLLOW_UP', to });
    }
  });
  it('a closed lead cannot be changed or scheduled until explicitly reopened', async () => {
    m.findById.mockResolvedValue(lead('WON'));
    expect(await svc.updateLeadStatus(ID, 'FOLLOW_UP')).toMatchObject({ ok: false, status: 409 });
    expect(await svc.scheduleLeadFollowUp(ID, new Date().toISOString())).toMatchObject({ ok: false, status: 409 });
    expect(await svc.updateLeadStatus(ID, 'FOLLOW_UP', { reopen: true })).toMatchObject({ ok: true });
    expect(m.findByIdAndUpdate).toHaveBeenCalledTimes(1);
  });
  it('schedules and clears a follow-up; rejects invalid dates', async () => {
    m.findById.mockResolvedValue(lead('NEW'));
    expect((await svc.scheduleLeadFollowUp(ID, '2026-10-10T10:00:00.000Z')).ok).toBe(true);
    expect(m.findByIdAndUpdate.mock.calls[0][1].$set.nextFollowUpAt).toEqual(new Date('2026-10-10T10:00:00.000Z'));
    expect((await svc.scheduleLeadFollowUp(ID, null)).ok).toBe(true);
    expect(m.findByIdAndUpdate.mock.calls[1][1].$unset).toEqual({ nextFollowUpAt: 1 });
    expect((await svc.scheduleLeadFollowUp(ID, 'garbage')).ok).toBe(false);
    expect((await svc.scheduleLeadFollowUp(ID, undefined)).ok).toBe(false);
  });
  it('record-contacted moves NEW to CONTACTED but leaves later stages alone', async () => {
    m.findById.mockResolvedValueOnce(lead('NEW'));
    await svc.recordLeadContacted(ID);
    expect(m.findByIdAndUpdate.mock.calls[0][1].$set.status).toBe('CONTACTED');
    m.findById.mockResolvedValueOnce(lead('QUOTE_SENT'));
    await svc.recordLeadContacted(ID);
    expect(m.findByIdAndUpdate.mock.calls[1][1].$set.status).toBeUndefined();
    expect(m.findByIdAndUpdate.mock.calls[1][1].$set.lastContactedAt).toBeInstanceOf(Date);
  });
  it('notes append to a capped event history, never overwrite; empty/oversize rejected', async () => {
    m.findById.mockResolvedValue(lead('NEW'));
    expect((await svc.addLeadNote(ID, 'Called, wants Dec dates', 'owner')).ok).toBe(true);
    const push = m.findByIdAndUpdate.mock.calls[0][1].$push.events;
    expect(push.$each[0]).toMatchObject({ type: 'NOTE', actor: 'owner', text: 'Called, wants Dec dates' });
    expect(push.$slice).toBe(-300);
    expect((await svc.addLeadNote(ID, '   ')).ok).toBe(false);
    expect((await svc.addLeadNote(ID, 'x'.repeat(2001))).ok).toBe(false);
  });
  it('rejects malformed ids and unknown leads without a write', async () => {
    expect(await svc.updateLeadStatus('not-an-id', 'QUALIFIED')).toMatchObject({ ok: false, status: 404 });
    m.findById.mockResolvedValueOnce(null);
    expect(await svc.addLeadNote(ID, 'hi')).toMatchObject({ ok: false, status: 404 });
    expect(m.findByIdAndUpdate).not.toHaveBeenCalled();
  });
  it('validates quote amounts (no negatives / NaN)', async () => {
    m.findById.mockResolvedValue(lead('NEW'));
    expect((await svc.setLeadQuote(ID, { quotedAmount: -5 })).ok).toBe(false);
    expect((await svc.setLeadQuote(ID, { quotedAmount: NaN })).ok).toBe(false);
    expect((await svc.setLeadQuote(ID, { quotedAmount: 45000 })).ok).toBe(true);
  });
});

describe('buildLeadQuery', () => {
  it('rejects unknown enum filters and escapes regex metacharacters in search', () => {
    expect(svc.buildLeadQuery({ status: 'HACKED' }).error).toMatch(/status/);
    expect(svc.buildLeadQuery({ followUp: 'soon' }).error).toMatch(/followUp/);
    const { query } = svc.buildLeadQuery({ q: '(.*)+' });
    const rx = (query.$and as { $or: { name?: RegExp }[] }[])[0].$or[0].name!;
    expect(rx.source).toBe('\\(\\.\\*\\)\\+');
  });
  it('follow-up filters only target active (non-terminal) leads', () => {
    const { query } = svc.buildLeadQuery({ followUp: 'overdue' }, new Date(2026, 9, 4, 12));
    expect(JSON.stringify(query)).toContain('"$nin":["WON","LOST","SPAM"]');
    expect((query.$and as Record<string, unknown>[])[1]).toEqual({ nextFollowUpAt: { $lt: new Date(2026, 9, 4) } });
  });
  it('date range includes the whole end day', () => {
    const { query } = svc.buildLeadQuery({ from: '2026-10-01', to: '2026-10-03' });
    expect((query.createdAt as { $lte: Date }).$lte.getTime()).toBe(new Date('2026-10-03').getTime() + 86_399_999);
  });
});

describe('summary uses only persisted counts', () => {
  it('derives tiles from aggregates and exposes no revenue/conversion metric', async () => {
    m.aggregate.mockResolvedValueOnce([{ _id: 'NEW', n: 3 }, { _id: 'WON', n: 1 }, { _id: 'LOST', n: 2 }]).mockResolvedValueOnce([{ _id: 'meta', n: 4 }]);
    m.countDocuments.mockResolvedValueOnce(2).mockResolvedValueOnce(5);
    const s = await svc.getLeadSummary();
    expect(s).toMatchObject({ total: 6, newLeads: 3, won: 1, lost: 2, dueToday: 2, overdue: 5, bySource: { meta: 4 } });
    expect(Object.keys(s).join()).not.toMatch(/revenue|roas|conversion|profit/i);
  });
});

describe('internal serializer', () => {
  it('flags overdue only for active leads', () => {
    const base = { _id: ID, name: 'n', captureKind: 'FORM_SUBMITTED', leadType: 'GENERAL', priority: 'NORMAL', source: 'website', events: [], createdAt: new Date(), updatedAt: new Date(), nextFollowUpAt: new Date(2020, 0, 1) };
    expect(svc.serializeLead({ ...base, status: 'FOLLOW_UP' } as never).followUp).toBe('OVERDUE');
    expect(svc.serializeLead({ ...base, status: 'LOST' } as never).followUp).toBe('CLOSED');
  });
});

describe('live keyset CRM pagination with frozen visited-page membership', () => {
  type Row = Record<string, unknown>;
  let rows: Row[];
  const id = (n: number) => n.toString(16).padStart(24, '0');
  const fixture = (n: number): Row => ({ _id: id(n), name: `Synthetic ${n}`, phone: '9000000000',
    captureKind: 'FORM_SUBMITTED', leadType: 'JOURNEY', destination: 'Mock destination',
    status: 'NEW', priority: 'NORMAL', source: n % 3 ? 'website' : 'meta', events: [],
    createdAt: new Date('2026-10-01'), updatedAt: new Date('2026-10-01') });
  const value = (v: unknown) => v instanceof Date ? v.getTime() : String(v);
  function matches(row: Row, query: Row): boolean {
    return Object.entries(query).every(([key, condition]) => {
      if (key === '$and') return (condition as Row[]).every(q => matches(row, q));
      if (key === '$or') return (condition as Row[]).some(q => matches(row, q));
      if (condition instanceof RegExp) return condition.test(String(row[key] ?? ''));
      if (condition && typeof condition === 'object' && !(condition instanceof Date)) {
        return Object.entries(condition).every(([op, bound]) => {
          if (op === '$in') return (bound as unknown[]).some(v => value(v) === value(row[key]));
          if (op === '$nin') return !(bound as unknown[]).some(v => value(v) === value(row[key]));
          if (op === '$exists') return (row[key] !== undefined) === bound;
          const a = value(row[key]), b = value(bound);
          return op === '$lt' ? a < b : op === '$lte' ? a <= b : op === '$gt' ? a > b : op === '$gte' ? a >= b : false;
        });
      }
      return value(row[key]) === value(condition);
    });
  }
  beforeEach(() => {
    vi.stubEnv('MONGODB_URI', 'mongodb://synthetic-test-only/cursor');
    rows = Array.from({ length: 25 }, (_, i) => fixture(i + 1));
    m.countDocuments.mockImplementation(query => ({ maxTimeMS: async (ms: number) => { expect(ms).toBe(5000); return rows.filter(row => matches(row, query)).length; } }));
    m.find.mockImplementation(query => ({ maxTimeMS: (ms: number) => { expect(ms).toBe(5000); return { sort: (sort: Row) => ({ limit: async (limit: number) => {
      expect(sort).toEqual({ createdAt: -1, _id: -1 });
      expect(limit).toBeLessThanOrEqual(11);
      return rows.filter(row => matches(row, query)).sort((a, b) =>
        Number(b.createdAt) - Number(a.createdAt) || String(b._id).localeCompare(String(a._id))).slice(0, limit);
    } }) }; } }));
  });
  const page = async (cursor?: string, filters: LeadFilters = {}, owner = 'synthetic-owner') => {
    const result = await svc.listLeadPage(filters, cursor, owner);
    if (!result.ok) throw new Error(result.error);
    return result.value;
  };
  const ids = (result: LeadPage) => result.leads.map(lead => lead.id);
  it('excludes a new newest lead between requests, without any repeated or skipped surviving IDs', async () => {
    const first = await page(); rows.push({ ...fixture(26), createdAt: new Date('2026-10-02') });
    const second = await page(first.pagination.nextCursor), third = await page(second.pagination.nextCursor);
    expect([...ids(first), ...ids(second), ...ids(third)]).toEqual(Array.from({ length: 25 }, (_, i) => id(25 - i)));
    expect(ids(await page())).toContain(id(26));
    expect(second.pagination.total).toBe(25);
  });
  it('deleting an earlier record does not skip the next surviving record; backwards pages do not refill', async () => {
    const first = await page(); rows = rows.filter(row => row._id !== id(25));
    const second = await page(first.pagination.nextCursor);
    expect(ids(second)).toEqual(Array.from({ length: 10 }, (_, i) => id(15 - i)));
    const previous = await page(first.pagination.cursor);
    expect(ids(previous)).toEqual(Array.from({ length: 9 }, (_, i) => id(24 - i)));
    expect(ids(previous).some(item => ids(second).includes(item))).toBe(false);
    expect(ids(await page(second.pagination.cursor))).toEqual(ids(second));
  });
  it('identical timestamps traverse more than 200 records exactly once, including the last boundary', async () => {
    rows = Array.from({ length: 237 }, (_, i) => fixture(i + 1));
    let current = await page(); const all = [...ids(current)];
    while (current.pagination.hasNext) { current = await page(current.pagination.nextCursor); all.push(...ids(current)); }
    expect(all).toEqual(Array.from({ length: 237 }, (_, i) => id(237 - i)));
    expect(new Set(all).size).toBe(237);
    expect(current.pagination).toMatchObject({ page: 24, shown: 7, total: 237, hasNext: false });
  });
  it('status edits affecting filters cannot shift surviving rows across page boundaries', async () => {
    const first = await page(undefined, { status: 'NEW' });
    rows.find(row => row._id === id(25))!.status = 'QUALIFIED';
    rows.find(row => row._id === id(15))!.status = 'QUALIFIED';
    const second = await page(first.pagination.nextCursor, { status: 'NEW' });
    expect(ids(second)).toEqual(Array.from({ length: 10 }, (_, i) => id(14 - i)));
    const previous = await page(first.pagination.cursor, { status: 'NEW' });
    expect(ids(previous)).toEqual(Array.from({ length: 9 }, (_, i) => id(24 - i)));
    rows.find(row => row._id === id(15))!.status = 'NEW';
    expect(ids(await page(second.pagination.cursor, { status: 'NEW' }))).toEqual(ids(second));
    // Re-entering an already passed range requires Refresh, rather than displacing a surviving lead.
    const refreshed = await page(undefined, { status: 'NEW' });
    expect(ids(refreshed)).toContain(id(15));
  });
  it('frozen page IDs prevent backdated inserts from displacing surviving leads on revisits', async () => {
    rows.forEach((row, i) => { row._id = id((i + 1) * 10); });
    const first = await page();
    rows.push({ ...fixture(99), _id: id(205) });
    expect(ids(await page(first.pagination.cursor))).toEqual(ids(first));
  });
  it('last-page deletions leave an honestly empty visited page; Previous still works', async () => {
    const first = await page(), second = await page(first.pagination.nextCursor), last = await page(second.pagination.nextCursor);
    rows = rows.filter(row => !ids(last).includes(String(row._id)));
    const empty = await page(last.pagination.cursor);
    expect(ids(empty)).toEqual([]);
    expect(empty.pagination).toMatchObject({ page: 3, shown: 0, total: 20, hasNext: false, hasPrevious: true });
    expect(ids(await page(second.pagination.cursor))).toEqual(ids(second));
  });
  it('combined filters and source changes cover all matches; cursor reuse across filters or owners fails', async () => {
    rows = Array.from({ length: 237 }, (_, i) => fixture(i + 1));
    const filters = { source: 'meta', status: 'NEW', destination: 'Mock', followUp: 'none' };
    const first = await page(undefined, filters), second = await page(first.pagination.nextCursor, filters);
    expect(ids(first)).toEqual(Array.from({ length: 10 }, (_, i) => id(237 - i * 3)));
    expect(ids(second)).toEqual(Array.from({ length: 10 }, (_, i) => id(207 - i * 3)));
    expect(first.pagination.total).toBe(79);
    expect(await svc.listLeadPage({ source: 'website' }, first.pagination.nextCursor, 'synthetic-owner')).toMatchObject({ ok: false, status: 400 });
    expect(await svc.listLeadPage(filters, first.pagination.nextCursor, 'another-owner')).toMatchObject({ ok: false, status: 400 });
    const oldest = await page(undefined, { q: 'Synthetic 1$' });
    expect(ids(oldest)).toEqual([]); // Search metacharacters are literal.
    expect(ids(await page(undefined, { q: 'Synthetic 1' }))).toContain(id(199));
  });
  it('tokens are opaque, bounded, authenticated and expire; rejection performs no lead reads', async () => {
    const first = await page(); const token = first.pagination.cursor;
    expect(token).not.toContain(id(25)); expect(token.length).toBeLessThanOrEqual(2048);
    const before = m.find.mock.calls.length;
    for (const invalid of ['', 'x'.repeat(2049), token.slice(0, -10) + 'A'.repeat(10), '1', '../../']) {
      expect(await svc.listLeadPage({}, invalid, 'synthetic-owner')).toMatchObject({ ok: false, status: 400 });
    }
    expect(m.find.mock.calls.length).toBe(before);
    const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 31 * 60_000);
    expect(await svc.listLeadPage({}, token, 'synthetic-owner')).toMatchObject({ ok: false, status: 400 }); clock.mockRestore();
  });
  it('returns an empty initial page without misleading total-pages metadata', async () => {
    rows = [];
    const result = await page(); expect(ids(result)).toEqual([]);
    expect(result.pagination).toMatchObject({ page: 1, shown: 0, total: 0, hasNext: false, hasPrevious: false });
    expect(result.pagination).not.toHaveProperty('totalPages');
  });
  it('legacy list service still defaults to 200 and retains established priority ordering', async () => {
    rows = Array.from({ length: 237 }, (_, i) => fixture(i + 1));
    m.find.mockReturnValueOnce({ sort: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(rows) }) });
    const result = await svc.listLeads();
    expect(result.ok && result.value.length).toBe(200);
    expect(result.ok && result.value.map(lead => lead.id)).toEqual(rows.slice(0, 200).map(row => row._id));
  });
});

describe('optional first-party evidence persistence', () => {
  it('persists validated evidence on a new synthetic lead without provider elevation', async () => {
    const at = new Date().toISOString();
    const firstParty = { version: 2, firstTouch: { observedAt: at, landingPage: {value:'/contact'}, utmSource: {value:'google',kind:'PROVIDER_VERIFIED'} }, submissionPage: {value:'/contact',observedAt:at} };
    const result = await svc.captureLead({ ...valid, attribution: {firstParty} });
    expect(result.ok).toBe(true);
    expect(m.create.mock.calls[0][0].firstPartyAttribution).toMatchObject({version:2,firstTouch:{utmSource:{value:'google',kind:'URL_REPORTED'}},submissionPage:{value:'/contact'}});
    expect(m.create.mock.calls[0][0].meta).toBeUndefined();
  });
  it('leaves existing provider-linked records untouched, including attribution', async () => {
    const saved = {_id:'existing',meta:{campaignId:'verified'},firstPartyAttribution:undefined};
    m.findOne.mockReturnValueOnce(q(saved));
    const result = await svc.captureLead({...valid,legacyRef:{model:'Inquiry',id:'fixture'},attribution:{firstParty:{version:2,submissionPage:{value:'/contact'}}}});
    expect(result.ok && result.value.created).toBe(false);expect(m.create).not.toHaveBeenCalled();expect(m.updateOne).not.toHaveBeenCalled();expect(saved.meta.campaignId).toBe('verified');
  });
});
