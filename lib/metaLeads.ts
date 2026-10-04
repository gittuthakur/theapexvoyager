/**
 * Pure Meta Lead Ads (Instant Form) helpers: webhook verification, payload parsing,
 * Graph-lead normalisation into the canonical Lead payload, and Leads-Center CSV parsing.
 * No network, no DB, no secrets stored here. A Lead Ad is NOT a Pixel/CAPI event - those
 * are tracking signals; this only handles real form submissions with customer details.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { SENSITIVE, idText, sanitizeMeta, text, type MetaAnswer, type MetaProvenance } from '@/lib/metaProvenance';

export { sanitizeMeta };
export type { MetaAnswer, MetaProvenance };

export const META_LEAD_MODEL = 'MetaLeadAd'; // legacyRef.model -> unique, idempotent provider reference
export const META_SOURCE_DETAIL = 'meta-instant-form';
export const MAX_WEBHOOK_BYTES = 64_000;
export const MAX_CHANGES_PER_REQUEST = 50;

/** Shape of GET /{lead-id} (and each row of /{form-id}/leads) from the Graph API. */
export interface MetaGraphLead {
  id: string; created_time?: string; ad_id?: string; ad_name?: string; adset_id?: string; adset_name?: string;
  campaign_id?: string; campaign_name?: string; form_id?: string; form_name?: string; platform?: string; is_organic?: boolean;
  field_data?: { name?: string; values?: unknown[] }[];
}

// ---------- webhook verification ----------

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** `X-Hub-Signature-256: sha256=<hex HMAC-SHA256 of the RAW body keyed with the App Secret>`. Constant-time. */
export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string | undefined): boolean {
  if (!appSecret || !header || !header.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  return safeEqual(header.slice('sha256='.length), expected);
}

/** GET subscription handshake: returns the challenge to echo, or null to reject. */
export function verifyMetaChallenge(params: URLSearchParams, verifyToken: string | undefined): string | null {
  const challenge = params.get('hub.challenge');
  if (!verifyToken || params.get('hub.mode') !== 'subscribe' || !challenge || challenge.length > 200) return null;
  return safeEqual(params.get('hub.verify_token') ?? '', verifyToken) ? challenge : null;
}

export interface LeadgenChange { leadgenId: string; pageId?: string; formId?: string; adId?: string; createdTime?: number }

/** Extracts leadgen changes; anything else (other objects/fields) is ignored, never an error. */
export function parseLeadgenWebhook(body: unknown): { ok: true; changes: LeadgenChange[]; ignored: number } | { ok: false } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false };
  const b = body as { object?: unknown; entry?: unknown };
  if (b.object !== 'page' || !Array.isArray(b.entry)) return { ok: true, changes: [], ignored: 1 };
  const changes: LeadgenChange[] = [];
  let ignored = 0;
  for (const entry of b.entry.slice(0, MAX_CHANGES_PER_REQUEST)) {
    const list = (entry as { changes?: unknown })?.changes;
    if (!Array.isArray(list)) { ignored++; continue; }
    for (const change of list) {
      const c = change as { field?: unknown; value?: Record<string, unknown> };
      const v = c?.value;
      if (c?.field !== 'leadgen' || !v || typeof v.leadgen_id !== 'string' || !/^\d{5,30}$/.test(v.leadgen_id)) { ignored++; continue; }
      const id = (x: unknown) => (typeof x === 'string' && /^\d{1,30}$/.test(x) ? x : typeof x === 'number' ? String(x) : undefined);
      changes.push({ leadgenId: v.leadgen_id, pageId: id(v.page_id), formId: id(v.form_id), adId: id(v.ad_id), createdTime: typeof v.created_time === 'number' ? v.created_time : undefined });
      if (changes.length >= MAX_CHANGES_PER_REQUEST) return { ok: true, changes, ignored };
    }
  }
  return { ok: true, changes, ignored };
}

// ---------- normalisation ----------

const first = (answers: MetaAnswer[], test: (n: string) => boolean) => answers.find(a => test(a.name) && a.values[0])?.values[0];

export interface NormalizedMetaLead { payload: Record<string, unknown>; meta: MetaProvenance }

export function normalizeMetaLead(lead: MetaGraphLead, extra: { pageId?: string; formName?: string } = {}): NormalizedMetaLead | null {
  const leadId = idText(lead?.id);
  if (!leadId) return null;
  const answers: MetaAnswer[] = (Array.isArray(lead.field_data) ? lead.field_data : []).slice(0, 40).flatMap(f => {
    const name = text(f?.name, 100)?.toLowerCase();
    if (!name || SENSITIVE.test(name)) return [];
    const values = (Array.isArray(f?.values) ? f.values : []).slice(0, 5).map(v => text(v, 500)).filter((v): v is string => !!v);
    return values.length ? [{ name, values }] : [];
  });

  const email = first(answers, n => /e-?mail/.test(n));
  const phone = first(answers, n => /phone|mobile|whatsapp|contact_?number/.test(n));
  const fullName = first(answers, n => n === 'full_name' || n === 'name' || n === 'your_name');
  const joined = [first(answers, n => n === 'first_name'), first(answers, n => n === 'last_name')].filter(Boolean).join(' ');
  const name = fullName ?? (joined || undefined);
  const destination = first(answers, n => /destination|place|where|package|trip_?(to|type)?$/.test(n));
  const travelDate = first(answers, n => /date|month|when|travel_?(time|period)/.test(n));
  const budget = first(answers, n => /budget/.test(n));
  const travellersRaw = first(answers, n => /traveller|traveler|people|persons|guests|group_?size|pax/.test(n));
  const travellers = travellersRaw && /^\d{1,3}$/.test(travellersRaw.trim()) ? Number(travellersRaw) : undefined;

  const coreNames = new Set(['full_name', 'name', 'your_name', 'first_name', 'last_name', 'email', 'phone_number', 'phone']);
  const lines = answers.filter(a => !coreNames.has(a.name) && !/e-?mail|phone|mobile/.test(a.name)).map(a => `${a.name.replace(/_/g, ' ')}: ${a.values.join(', ')}`);
  const message = [`Meta Instant Form${text(lead.form_name ?? extra.formName, 100) ? ` "${text(lead.form_name ?? extra.formName, 100)}"` : ''}`, ...lines].join('\n').slice(0, 5000);

  const created = lead.created_time ? new Date(lead.created_time) : undefined;
  const meta: MetaProvenance = {
    leadId, pageId: idText(extra.pageId), formId: idText(lead.form_id), formName: text(lead.form_name ?? extra.formName, 120),
    campaignId: idText(lead.campaign_id), campaignName: text(lead.campaign_name, 150), adSetId: idText(lead.adset_id), adSetName: text(lead.adset_name, 150),
    adId: idText(lead.ad_id), adName: text(lead.ad_name, 150), platform: text(lead.platform, 20),
    isOrganic: typeof lead.is_organic === 'boolean' ? lead.is_organic : undefined,
    createdTime: created && !Number.isNaN(created.getTime()) ? created : undefined, answers
  };
  const isoDay = travelDate && /^\d{4}-\d{2}-\d{2}$/.test(travelDate) ? travelDate : undefined;
  return {
    meta,
    payload: {
      name, phone, email, leadType: 'GENERAL', captureKind: 'META_LEAD_AD', destination, budget, message,
      travelStartDate: isoDay, adults: travellers && travellers >= 1 ? travellers : undefined,
      attribution: { source: 'meta', sourceDetail: META_SOURCE_DETAIL },
      legacyRef: { model: META_LEAD_MODEL, id: leadId }, meta
    }
  };
}

// ---------- Leads Center CSV (alternative historical source) ----------

/** Decodes a Meta CSV export: UTF-16LE (BOM) or UTF-8, tab- or comma-delimited. */
export function decodeMetaCsv(bytes: Uint8Array): string {
  const utf16 = bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xfe;
  const textOut = new TextDecoder(utf16 ? 'utf-16le' : 'utf-8').decode(bytes);
  return textOut.replace(/^﻿/, '');
}

export function parseCsv(input: string): string[][] {
  const firstLine = input.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = (firstLine.match(/\t/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? '\t' : ',';
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') { field += '"'; i++; } else if (ch === '"') quoted = false; else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && input[i + 1] === '\n') i++; row.push(field); field = ''; if (row.some(c => c !== '')) rows.push(row); row = []; }
    else field += ch;
  }
  row.push(field);
  if (row.some(c => c !== '')) rows.push(row);
  return rows;
}

const CSV_META_COLUMNS = new Set(['id', 'created_time', 'ad_id', 'ad_name', 'adset_id', 'adset_name', 'campaign_id', 'campaign_name', 'form_id', 'form_name', 'is_organic', 'platform', 'lead_status', 'partner_name']);

/**
 * The Leads Center CRM export ("Created, Name, Email address, Source, Form, Channel, Stage, Owner,
 * Labels, Phone, Secondary phone number, WhatsApp number") has NO lead id, campaign, ad or form
 * answers. Dates are M/D/YYYY h:mmam/pm (verified unambiguous on the real export) and are taken
 * as India time, the business's account zone.
 */
export const isLeadsCenterCrmExport = (header: string[]) => {
  const h = header.map(x => x.trim().toLowerCase());
  return h.includes('created') && h.includes('email address') && !h.includes('id');
};

export function parseLeadsCenterDate(value: string | undefined): string | undefined {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec((value ?? '').trim());
  if (!m) return undefined;
  const [month, day, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  let hour = Number(m[4]) % 12;
  if (m[6].toLowerCase() === 'pm') hour += 12;
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  const p = (n: number) => String(n).padStart(2, '0');
  const iso = `${year}-${p(month)}-${p(day)}T${p(hour)}:${m[5]}:00+05:30`;
  return Number.isNaN(new Date(iso).getTime()) ? undefined : iso;
}

/** Deterministic provider reference for exports without a lead id: stable across re-runs, so the import stays idempotent. */
const syntheticLeadId = (parts: string[]) => 'lc:' + createHash('sha256').update(parts.join('\u0001')).digest('hex').slice(0, 24);

function leadsCenterToMetaLeads(rows: string[][]): MetaGraphLead[] {
  const header = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1).map(cells => {
    const get = (k: string) => { const i = header.indexOf(k); return i >= 0 ? cells[i]?.trim() || undefined : undefined; };
    const answers: [string, string | undefined][] = [
      ['full_name', get('name')], ['email', get('email address')], ['phone_number', get('phone')], ['whatsapp_number', get('whatsapp number')],
      ['secondary_phone_number', get('secondary phone number')], ['leads_center_channel', get('channel')], ['leads_center_stage', get('stage')]
    ];
    return {
      id: syntheticLeadId([get('created') ?? '', get('name') ?? '', get('email address') ?? '', get('phone') ?? '', get('form') ?? '']),
      created_time: parseLeadsCenterDate(get('created')), form_name: get('form'),
      is_organic: get('source') === undefined ? undefined : /^direct$/i.test(get('source')!),
      field_data: answers.flatMap(([name, value]) => (value ? [{ name, values: [value] }] : []))
    };
  });
}

/** Turns a parsed Leads-Center export into the same MetaGraphLead shape the API returns. */
export function csvToMetaLeads(rows: string[][]): MetaGraphLead[] {
  if (rows.length < 2) return [];
  if (isLeadsCenterCrmExport(rows[0])) return leadsCenterToMetaLeads(rows);
  const header = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1).map(cells => {
    const get = (k: string) => { const i = header.indexOf(k); return i >= 0 ? cells[i]?.trim() || undefined : undefined; };
    return {
      id: get('id') ?? '', created_time: get('created_time'), ad_id: get('ad_id'), ad_name: get('ad_name'), adset_id: get('adset_id'), adset_name: get('adset_name'),
      campaign_id: get('campaign_id'), campaign_name: get('campaign_name'), form_id: get('form_id'), form_name: get('form_name'), platform: get('platform'),
      is_organic: get('is_organic') === undefined ? undefined : /^(true|1|yes)$/i.test(get('is_organic')!),
      field_data: header.flatMap((h, i) => (!h || CSV_META_COLUMNS.has(h) || !cells[i]?.trim() ? [] : [{ name: h, values: [cells[i].trim()] }]))
    };
  });
}
