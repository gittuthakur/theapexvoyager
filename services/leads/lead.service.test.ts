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
