import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { FirstPartyAttribution } from '@/lib/attributionEvidence';
import { connectDB } from '@/lib/mongodb';
import { Lead, type LeadDocument } from '@/models/Lead';
import { escapeRegExp } from '@/lib/regex';
import {
  DUPLICATE_WINDOW_MS, LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES, LEAD_TYPES, TERMINAL_STATUSES,
  checkStatusTransition, followUpBucket, isTerminalStatus, normalizePhone, sortLeads, validateLeadInput,
  type FollowUpBucket, type LeadEvent, type LeadInput, type LeadPriority, type LeadSource, type LeadStatus, type LeadType
} from '@/lib/leads';

const MAX_EVENTS = 300;
const MAX_NOTE = 2000;
const ACTOR_DEFAULT = 'internal';

export type ServiceResult<T> = { ok: true; value: T } | { ok: false; error: string; status: 400 | 404 | 409 };
const fail = (error: string, status: 400 | 404 | 409 = 400): { ok: false; error: string; status: 400 | 404 | 409 } => ({ ok: false, error, status });

export interface InternalLead {
  firstPartyAttribution?: FirstPartyAttribution;
  id: string;
  name?: string; phone?: string; email?: string; whatsappNumber?: string;
  captureKind: string; leadType: LeadType; status: LeadStatus; priority: LeadPriority;
  destination?: string; journeySlug?: string; propertyRef?: string;
  travelStartDate?: string; travelEndDate?: string; duration?: string;
  adults?: number; children?: number; infants?: number; rooms?: number;
  budget?: string; pickupLocation?: string; travelStyle?: string; message?: string;
  source: LeadSource; sourceDetail?: string; landingPage?: string; referrer?: string;
  utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string; utmTerm?: string;
  nextFollowUpAt?: string; lastContactedAt?: string; quotedAmount?: number; finalAmount?: number;
  assignedTo?: string; duplicateOf?: string; followUp: FollowUpBucket; meta?: MetaProvenanceView;
  events: { at: string; type: string; actor: string; text?: string; from?: string; to?: string }[];
  createdAt: string; updatedAt: string;
}

export type MetaProvenanceView = Omit<NonNullable<LeadDocument['meta']>, 'createdTime'> & { createdTime?: string };
const toMetaView = (m: NonNullable<LeadDocument['meta']>): MetaProvenanceView => ({
  leadId: m.leadId, pageId: m.pageId, formId: m.formId, formName: m.formName, campaignId: m.campaignId, campaignName: m.campaignName, adSetId: m.adSetId,
  adSetName: m.adSetName, adId: m.adId, adName: m.adName, platform: m.platform, isOrganic: m.isOrganic, createdTime: m.createdTime ? new Date(m.createdTime).toISOString() : undefined,
  answers: (m.answers ?? []).map(a => ({ name: a.name, values: [...a.values] }))
});

const iso = (d?: Date | null) => (d ? new Date(d).toISOString() : undefined);

/** Internal serializer. Never import this from a public route. */
export function serializeLead(doc: LeadDocument, now = new Date()): InternalLead {
  const strip = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null)) as T;
  return strip({
    id: String(doc._id), name: doc.name, phone: doc.phone, email: doc.email, whatsappNumber: doc.whatsappNumber,
    captureKind: doc.captureKind, leadType: doc.leadType, status: doc.status, priority: doc.priority,
    destination: doc.destination, journeySlug: doc.journeySlug, propertyRef: doc.propertyRef,
    travelStartDate: iso(doc.travelStartDate), travelEndDate: iso(doc.travelEndDate), duration: doc.duration,
    adults: doc.adults, children: doc.children, infants: doc.infants, rooms: doc.rooms,
    budget: doc.budget, pickupLocation: doc.pickupLocation, travelStyle: doc.travelStyle, message: doc.message,
    source: doc.source, sourceDetail: doc.sourceDetail, landingPage: doc.landingPage, referrer: doc.referrer,
    utmSource: doc.utmSource, utmMedium: doc.utmMedium, utmCampaign: doc.utmCampaign, utmContent: doc.utmContent, utmTerm: doc.utmTerm,
    nextFollowUpAt: iso(doc.nextFollowUpAt), lastContactedAt: iso(doc.lastContactedAt),
    quotedAmount: doc.quotedAmount, finalAmount: doc.finalAmount, assignedTo: doc.assignedTo,
    duplicateOf: doc.duplicateOf ? String(doc.duplicateOf) : undefined,
    meta: doc.meta ? toMetaView(doc.meta) : undefined,
    firstPartyAttribution: doc.firstPartyAttribution,
    followUp: followUpBucket(doc.status, doc.nextFollowUpAt, now),
    events: (doc.events ?? []).map(e => strip({ at: new Date(e.at).toISOString(), type: e.type, actor: e.actor, text: e.text, from: e.from, to: e.to })),
    createdAt: new Date(doc.createdAt).toISOString(), updatedAt: new Date(doc.updatedAt).toISOString()
  }) as InternalLead;
}

const event = (type: LeadEvent['type'], actor: string, extra: Partial<LeadEvent> = {}): LeadEvent => ({ at: new Date(), type, actor, ...extra });
const isObjectId = (id: unknown): id is string => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);

/**
 * Persists a validated lead. Never overwrites an existing lead:
 *  - same legacyRef  -> returns the existing lead (idempotent re-mirror / double submit)
 *  - same phone-or-email + leadType + journey/destination within DUPLICATE_WINDOW_MS ->
 *    a NEW lead is still created (history preserved) but linked via `duplicateOf` to the
 *    earliest matching lead, which also gets a REPEAT_ENQUIRY event. Nothing is merged or deleted.
 */
export async function createLead(input: LeadInput, actor = 'website', opts: { skipDuplicateCheck?: boolean } = {}): Promise<ServiceResult<{ lead: LeadDocument; created: boolean; duplicateOf?: string }>> {
  await connectDB();
  if (input.legacyRef) {
    const existing = await Lead.findOne({ 'legacyRef.model': input.legacyRef.model, 'legacyRef.id': input.legacyRef.id });
    if (existing) return { ok: true, value: { lead: existing, created: false } };
  }

  const phoneNormalized = normalizePhone(input.phone) ?? normalizePhone(input.whatsappNumber);
  let duplicate: LeadDocument | null = null;
  const identity: Record<string, string>[] = [];
  if (phoneNormalized) identity.push({ phoneNormalized });
  if (input.email) identity.push({ email: input.email });
  const subject = input.journeySlug ? { journeySlug: input.journeySlug } : input.destination ? { destination: input.destination } : null;
  if (identity.length && input.captureKind !== 'MANUAL' && !opts.skipDuplicateCheck) {
    duplicate = await Lead.findOne({
      $or: identity, leadType: input.leadType, ...(subject ?? {}),
      createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) }, duplicateOf: { $exists: false }
    }).sort({ createdAt: 1 });
  }

  const { attribution, ...fields } = input;
  const a = attribution ?? {};
  const base = input.captureKind === 'MANUAL' ? 'manual' : input.captureKind === 'WHATSAPP_CLICK' ? 'whatsapp' : input.captureKind === 'META_LEAD_AD' ? 'meta' : 'website';
  const events: LeadEvent[] = [event('CREATED', actor, { text: `Captured via ${input.captureKind}` })];
  if (duplicate) events.push(event('DUPLICATE_OF', 'system', { text: `Repeat enquiry within 24h of lead ${String(duplicate._id)}` }));

  try {
    const lead = await Lead.create({
      ...fields, phoneNormalized,
      firstPartyAttribution: a.firstParty,
      source: a.source ?? base, sourceDetail: a.sourceDetail, landingPage: a.landingPage, referrer: a.referrer,
      utmSource: a.utmSource, utmMedium: a.utmMedium, utmCampaign: a.utmCampaign, utmContent: a.utmContent, utmTerm: a.utmTerm,
      priority: input.priority ?? 'NORMAL', status: 'NEW',
      duplicateOf: duplicate?._id, events
    });
    if (duplicate) {
      await Lead.updateOne({ _id: duplicate._id }, { $push: { events: { $each: [event('REPEAT_ENQUIRY', 'system', { text: `New enquiry ${String(lead._id)}` })], $slice: -MAX_EVENTS } } });
    }
    return { ok: true, value: { lead, created: true, duplicateOf: duplicate ? String(duplicate._id) : undefined } };
  } catch (error) {
    // Unique legacyRef race (two concurrent submits): return the winner instead of failing.
    if ((error as { code?: number }).code === 11000 && input.legacyRef) {
      const winner = await Lead.findOne({ 'legacyRef.model': input.legacyRef.model, 'legacyRef.id': input.legacyRef.id });
      if (winner) return { ok: true, value: { lead: winner, created: false } };
    }
    throw error;
  }
}

/** Validate an untrusted payload and create the lead. */
export async function captureLead(raw: unknown, actor = 'website', options: { allowMeta?: boolean; skipDuplicateCheck?: boolean } = {}) {
  const parsed = validateLeadInput(raw, { allowMeta: options.allowMeta });
  if (!parsed.ok) return fail(parsed.error);
  return createLead(parsed.value, actor, { skipDuplicateCheck: options.skipDuplicateCheck });
}

/**
 * Best-effort mirror used by the legacy public routes AFTER their own record is saved.
 * A Lead failure is logged without any customer data and never turns a saved legacy
 * enquiry into a failed response (the legacy record remains the system of record for
 * that submission and can be backfilled by scripts/backfillLeadsFromLegacy.ts).
 */
export async function mirrorLegacyLead(raw: unknown): Promise<void> {
  try {
    const result = await captureLead(raw, 'website');
    if (!result.ok) console.error('Lead mirror rejected payload:', result.error);
  } catch {
    console.error('Lead mirror failed');
  }
}

async function load(id: string): Promise<LeadDocument | null> {
  if (!isObjectId(id)) return null;
  await connectDB();
  return Lead.findById(id);
}

async function push(id: string, set: Record<string, unknown>, unset: Record<string, 1>, ev: LeadEvent): Promise<ServiceResult<LeadDocument>> {
  const updated = await Lead.findByIdAndUpdate(
    id,
    { ...(Object.keys(set).length ? { $set: set } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}), $push: { events: { $each: [ev], $slice: -MAX_EVENTS } } },
    { new: true }
  );
  return updated ? { ok: true, value: updated } : fail('Lead not found', 404);
}

export async function getLeadById(id: string): Promise<LeadDocument | null> {
  return load(id);
}

export async function updateLeadStatus(id: string, to: LeadStatus, opts: { actor?: string; reopen?: boolean } = {}): Promise<ServiceResult<LeadDocument>> {
  const lead = await load(id);
  if (!lead) return fail('Lead not found', 404);
  const check = checkStatusTransition(lead.status, to, opts.reopen);
  if (!check.ok) return fail(check.error, 409);
  const set: Record<string, unknown> = { status: to };
  const unset: Record<string, 1> = {};
  // Closed leads must not keep an active follow-up date.
  if (isTerminalStatus(to)) unset.nextFollowUpAt = 1;
  if (to === 'CONTACTED') set.lastContactedAt = new Date();
  return push(id, set, unset, event('STATUS_CHANGE', opts.actor ?? ACTOR_DEFAULT, { from: lead.status, to }));
}

export async function setLeadPriority(id: string, priority: LeadPriority, actor = ACTOR_DEFAULT): Promise<ServiceResult<LeadDocument>> {
  if (!LEAD_PRIORITIES.includes(priority)) return fail('Invalid priority');
  const lead = await load(id);
  if (!lead) return fail('Lead not found', 404);
  return push(id, { priority }, {}, event('PRIORITY_CHANGE', actor, { from: lead.priority, to: priority }));
}

export async function addLeadNote(id: string, text: unknown, actor = ACTOR_DEFAULT): Promise<ServiceResult<LeadDocument>> {
  const note = typeof text === 'string' ? text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim() : '';
  if (!note || note.length > MAX_NOTE) return fail(`Note must be 1-${MAX_NOTE} characters`);
  if (!(await load(id))) return fail('Lead not found', 404);
  return push(id, {}, {}, event('NOTE', actor, { text: note }));
}

/** `at: null` clears the follow-up. Terminal leads can't be scheduled until reopened. */
export async function scheduleLeadFollowUp(id: string, at: unknown, actor = ACTOR_DEFAULT): Promise<ServiceResult<LeadDocument>> {
  const lead = await load(id);
  if (!lead) return fail('Lead not found', 404);
  if (at === null) return push(id, {}, { nextFollowUpAt: 1 }, event('FOLLOW_UP_SET', actor, { text: 'Follow-up cleared' }));
  if (isTerminalStatus(lead.status)) return fail(`Lead is ${lead.status}; reopen it before scheduling a follow-up`, 409);
  const date = typeof at === 'string' ? new Date(at) : null;
  if (!date || Number.isNaN(date.getTime()) || date.getFullYear() < 2020 || date.getFullYear() > 2100) return fail('Invalid follow-up date');
  return push(id, { nextFollowUpAt: date }, {}, event('FOLLOW_UP_SET', actor, { text: date.toISOString() }));
}

export async function recordLeadContacted(id: string, actor = ACTOR_DEFAULT): Promise<ServiceResult<LeadDocument>> {
  const lead = await load(id);
  if (!lead) return fail('Lead not found', 404);
  const set: Record<string, unknown> = { lastContactedAt: new Date() };
  // A NEW lead that has now been contacted moves to CONTACTED; later stages are left alone.
  if (lead.status === 'NEW') set.status = 'CONTACTED';
  return push(id, set, {}, event('CONTACTED', actor, lead.status === 'NEW' ? { from: 'NEW', to: 'CONTACTED' } : {}));
}

export async function setLeadQuote(id: string, amounts: { quotedAmount?: unknown; finalAmount?: unknown }, actor = ACTOR_DEFAULT): Promise<ServiceResult<LeadDocument>> {
  const set: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};
  for (const key of ['quotedAmount', 'finalAmount'] as const) {
    const v = amounts[key];
    if (v === undefined) continue;
    if (v === null) unset[key] = 1;
    else if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1e9) set[key] = v;
    else return fail(`Invalid ${key}`);
  }
  if (!Object.keys(set).length && !Object.keys(unset).length) return fail('No amount supplied');
  if (!(await load(id))) return fail('Lead not found', 404);
  return push(id, set, unset, event('QUOTE_UPDATED', actor, { text: JSON.stringify({ ...set, cleared: Object.keys(unset) }) }));
}

export async function setLeadAssignee(id: string, assignedTo: unknown, actor = ACTOR_DEFAULT): Promise<ServiceResult<LeadDocument>> {
  const name = assignedTo === null ? null : typeof assignedTo === 'string' ? assignedTo.trim().slice(0, 100) : undefined;
  if (name === undefined || name === '') return fail('Invalid assignee');
  if (!(await load(id))) return fail('Lead not found', 404);
  return push(id, name ? { assignedTo: name } : {}, name ? {} : { assignedTo: 1 }, event('ASSIGNED', actor, { to: name ?? '' }));
}

export interface LeadFilters {
  status?: string; source?: string; leadType?: string; priority?: string;
  destination?: string; followUp?: string; from?: string; to?: string; q?: string; limit?: number;
}

export function buildLeadQuery(f: LeadFilters, now = new Date()): { query: Record<string, unknown>; error?: string } {
  const query: Record<string, unknown> = {};
  const oneOf = (value: string | undefined, allowed: readonly string[], key: string): string | undefined => {
    if (!value) return undefined;
    if (!allowed.includes(value)) return key;
    query[key] = value;
    return undefined;
  };
  const bad = oneOf(f.status, LEAD_STATUSES, 'status') ?? oneOf(f.source, LEAD_SOURCES, 'source') ?? oneOf(f.leadType, LEAD_TYPES, 'leadType') ?? oneOf(f.priority, LEAD_PRIORITIES, 'priority');
  if (bad) return { query: {}, error: `Invalid ${bad} filter` };

  const and: Record<string, unknown>[] = [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const active = { status: { $nin: [...TERMINAL_STATUSES] } };
  if (f.followUp) {
    if (f.followUp === 'overdue') and.push(active, { nextFollowUpAt: { $lt: today } });
    else if (f.followUp === 'today') and.push(active, { nextFollowUpAt: { $gte: today, $lt: tomorrow } });
    else if (f.followUp === 'upcoming') and.push(active, { nextFollowUpAt: { $gte: tomorrow } });
    else if (f.followUp === 'none') and.push(active, { nextFollowUpAt: { $exists: false } });
    else return { query: {}, error: 'Invalid followUp filter' };
  }
  const range: Record<string, Date> = {};
  for (const [key, op] of [['from', '$gte'], ['to', '$lte']] as const) {
    if (!f[key]) continue;
    const d = new Date(f[key]!);
    if (Number.isNaN(d.getTime())) return { query: {}, error: `Invalid ${key} date` };
    range[op] = key === 'to' && /^\d{4}-\d{2}-\d{2}$/.test(f[key]!) ? new Date(d.getTime() + 86_399_999) : d;
  }
  if (Object.keys(range).length) query.createdAt = range;
  if (f.destination) {
    const rx = new RegExp(escapeRegExp(f.destination.slice(0, 100)), 'i');
    and.push({ $or: [{ destination: rx }, { journeySlug: rx }, { propertyRef: rx }] });
  }
  if (f.q) {
    const term = f.q.trim().slice(0, 100);
    const rx = new RegExp(escapeRegExp(term), 'i');
    const digits = normalizePhone(term) ?? term.replace(/\D/g, '');
    const or: Record<string, unknown>[] = [{ name: rx }, { email: rx }, { destination: rx }, { journeySlug: rx }];
    if (digits.length >= 4) or.push({ phoneNormalized: new RegExp(escapeRegExp(digits)) });
    and.push({ $or: or });
  }
  if (and.length) query.$and = and;
  return { query };
}

/** Fetches up to 500 newest matches, applies the CRM ordering in memory (overdue ->
 *  NEW -> upcoming -> rest). Adequate at current volume; revisit with an aggregation
 *  pipeline if the collection grows to tens of thousands of active leads. */
export async function listLeads(filters: LeadFilters = {}): Promise<ServiceResult<InternalLead[]>> {
  const { query, error } = buildLeadQuery(filters);
  if (error) return fail(error);
  await connectDB();
  const now = new Date();
  const docs: LeadDocument[] = await Lead.find(query).sort({ createdAt: -1 }).limit(500);
  const limit = Math.min(Math.max(Math.trunc(filters.limit ?? 200), 1), 500);
  return { ok: true, value: sortLeads(docs, now).slice(0, limit).map(d => serializeLead(d, now)) };
}

export interface LeadPagination {
  page: number; pageSize: number; total: number; shown: number;
  hasPrevious: boolean; hasNext: boolean; cursor: string; nextCursor?: string; expiresAt: string;
}
export interface LeadPage { leads: InternalLead[]; pagination: LeadPagination }
const LEAD_PAGE_SIZE = 10;
const CURSOR_TTL_MS = 30 * 60_000;
const MAX_CURSOR_PAGE = 1000;
type LeadKey = { at: string; id: string };
type LeadCursor = { v: 1; filter: string; anchor: LeadKey; upper?: LeadKey; lower?: LeadKey; ids?: string[]; page: number; issued: number };
const FILTER_KEYS = ['status', 'source', 'leadType', 'priority', 'destination', 'followUp', 'from', 'to', 'q'] as const;
const filterDigest = (filters: LeadFilters) => createHash('sha256').update(JSON.stringify(
  FILTER_KEYS.map(key => [key, filters[key] || ''])
)).digest('hex');

// Domain-separated, server-only key; no new environment setting or instance-local state.
// Rotating the existing DB credential invalidates cursors, never authorization.
function cursorKey(owner: string): Buffer {
  const secret = process.env.MONGODB_URI;
  if (!secret) throw new Error('Cursor configuration unavailable');
  return createHash('sha256').update('apex-crm-cursor-v1\0').update(secret).update('\0').update(owner).digest();
}
function encodeCursor(value: LeadCursor, owner: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', cursorKey(owner), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url');
}
function validKey(value: unknown): value is LeadKey {
  if (!value || typeof value !== 'object') return false;
  const key = value as LeadKey;
  return isObjectId(key.id) && typeof key.at === 'string' && Number.isFinite(Date.parse(key.at))
    && new Date(key.at).toISOString() === key.at;
}
function decodeCursor(token: string, owner: string, digest: string): LeadCursor | null {
  if (!/^[A-Za-z0-9_-]{60,2048}$/.test(token)) return null;
  try {
    const bytes = Buffer.from(token, 'base64url');
    if (bytes.toString('base64url') !== token) return null;
    const cipher = createDecipheriv('aes-256-gcm', cursorKey(owner), bytes.subarray(0, 12));
    cipher.setAuthTag(bytes.subarray(12, 28));
    const data: LeadCursor = JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString('utf8'));
    if (data.v !== 1 || data.filter !== digest || !validKey(data.anchor)
      || (data.upper !== undefined && !validKey(data.upper)) || (data.lower !== undefined && !validKey(data.lower))
      || (data.ids !== undefined && (!Array.isArray(data.ids) || data.ids.length > LEAD_PAGE_SIZE || data.ids.some(id => !isObjectId(id)) || new Set(data.ids).size !== data.ids.length))
      || !Number.isSafeInteger(data.page) || data.page < 1 || data.page > MAX_CURSOR_PAGE
      || !Number.isSafeInteger(data.issued) || data.issued > Date.now() || Date.now() - data.issued >= CURSOR_TTL_MS) return null;
    return data;
  } catch { return null; }
}
const keyOf = (doc: LeadDocument): LeadKey => ({ at: new Date(doc.createdAt).toISOString(), id: String(doc._id) });
function keyBound(key: LeadKey, direction: 'before' | 'through'): Record<string, unknown> {
  const idOp = direction === 'before' ? '$lt' : '$lte';
  return { $or: [{ createdAt: { $lt: new Date(key.at) } }, { createdAt: new Date(key.at), _id: { [idOp]: key.id } }] };
}

/** Live keyset traversal, not a snapshot. Stable keys and fixed visited-page intervals
 * prevent offset shifts and page overlap. Current filters still apply; a record that
 * enters an already traversed interval requires Refresh. Visited-page IDs are frozen;
 * deleted/nonmatching IDs leave holes. New records above the initial anchor require Refresh. No customer data in tokens. */
export async function listLeadPage(filters: LeadFilters = {}, token?: string, owner = ''): Promise<ServiceResult<LeadPage>> {
  const digest = filterDigest(filters);
  const cursor = token === undefined ? undefined : decodeCursor(token, owner, digest);
  if (token !== undefined && !cursor) return fail('Invalid or expired pagination cursor. Refresh the lead list.');
  const now = new Date(cursor?.issued ?? Date.now());
  const { query, error } = buildLeadQuery(filters, now);
  if (error) return fail(error);
  await connectDB();
  const read = async (conditions: Record<string, unknown>[], limit: number): Promise<LeadDocument[]> =>
    Lead.find({ $and: [query, ...conditions] }).maxTimeMS(5000).sort({ createdAt: -1, _id: -1 }).limit(limit);
  const bounds = cursor ? [keyBound(cursor.anchor, 'through'), ...(cursor.upper ? [keyBound(cursor.upper, 'before')] : [])] : [];
  const rows = await read([...bounds, ...(cursor?.ids ? [{ _id: { $in: cursor.ids } }] : [])], cursor?.ids ? LEAD_PAGE_SIZE : LEAD_PAGE_SIZE + 1);
  const docs = rows.slice(0, LEAD_PAGE_SIZE);
  // Empty initial results have no useful key, but retain the same bounded API shape.
  const anchor = cursor?.anchor ?? (docs.length ? keyOf(docs[0]) : { at: now.toISOString(), id: '000000000000000000000000' });
  const lower = cursor?.lower ?? (docs.length ? keyOf(docs[docs.length - 1]) : undefined);
  const state: LeadCursor = { v: 1, filter: digest, anchor, upper: cursor?.upper, lower, ids: cursor?.ids ?? docs.map(doc => String(doc._id)), page: cursor?.page ?? 1, issued: cursor?.issued ?? now.getTime() };
  const hasNext = cursor?.lower && lower
    ? (await read([keyBound(anchor, 'through'), keyBound(lower, 'before')], 1)).length > 0
    : rows.length > LEAD_PAGE_SIZE;
  const total = await Lead.countDocuments({ $and: [query, keyBound(anchor, 'through')] }).maxTimeMS(5000);
  return { ok: true, value: { leads: docs.map(doc => serializeLead(doc)), pagination: {
    page: state.page, pageSize: LEAD_PAGE_SIZE, total, shown: docs.length,
    hasPrevious: state.page > 1, hasNext, cursor: encodeCursor(state, owner),
    nextCursor: hasNext && lower ? encodeCursor({ ...state, upper: lower, lower: undefined, ids: undefined, page: state.page + 1 }, owner) : undefined,
    expiresAt: new Date(state.issued + CURSOR_TTL_MS).toISOString()
  } } };
}


export interface LeadSummary {
  total: number; newLeads: number; dueToday: number; overdue: number; qualified: number; quoteSent: number; won: number; lost: number;
  bySource: Record<string, number>;
}

/** Counts only — straight from persisted rows. No conversion rate, revenue or ROAS is derived. */
export async function getLeadSummary(now = new Date()): Promise<LeadSummary> {
  await connectDB();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const active = { status: { $nin: [...TERMINAL_STATUSES] } };
  const [byStatus, bySource, dueToday, overdue] = await Promise.all([
    Lead.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Lead.aggregate([{ $group: { _id: '$source', n: { $sum: 1 } } }]),
    Lead.countDocuments({ ...active, nextFollowUpAt: { $gte: today, $lt: tomorrow } }),
    Lead.countDocuments({ ...active, nextFollowUpAt: { $lt: today } })
  ]);
  const status = Object.fromEntries((byStatus as { _id: string; n: number }[]).map(r => [r._id, r.n]));
  return {
    total: Object.values(status).reduce((s: number, n) => s + (n as number), 0),
    newLeads: status.NEW ?? 0, dueToday, overdue, qualified: status.QUALIFIED ?? 0, quoteSent: status.QUOTE_SENT ?? 0,
    won: status.WON ?? 0, lost: status.LOST ?? 0,
    bySource: Object.fromEntries((bySource as { _id: string; n: number }[]).map(r => [r._id, r.n]))
  };
}
