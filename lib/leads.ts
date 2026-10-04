/**
 * Pure (no DB, no React) Lead CRM domain rules: vocab, normalization, validation,
 * status transitions, follow-up bucketing, ordering and the public/internal split.
 * Everything stateful lives in services/leads/lead.service.ts.
 */
import { normalizeCustomerEmail } from '@/lib/customerValidation';
import { sanitizeMeta, type MetaProvenance } from '@/lib/metaProvenance';

export const LEAD_SOURCES = ['website', 'whatsapp', 'meta', 'instagram', 'google', 'direct', 'referral', 'manual', 'other'] as const;
export const LEAD_TYPES = ['JOURNEY', 'CUSTOM_TRIP', 'STAY', 'TRANSPORT', 'GENERAL'] as const;
export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'QUOTE_SENT', 'FOLLOW_UP', 'WON', 'LOST', 'SPAM'] as const;
export const LEAD_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
/** WHATSAPP_CLICK = a click that opened WhatsApp with no contact details captured;
 *  FORM_SUBMITTED = a real enquiry form; MANUAL = entered by staff. */
export const CAPTURE_KINDS = ['FORM_SUBMITTED', 'WHATSAPP_CLICK', 'MANUAL', 'META_LEAD_AD'] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];
export type LeadType = (typeof LEAD_TYPES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];
export type CaptureKind = (typeof CAPTURE_KINDS)[number];

/** WON / LOST / SPAM never count as an active (or overdue) follow-up until reopened. */
export const TERMINAL_STATUSES: readonly LeadStatus[] = ['WON', 'LOST', 'SPAM'];
export const isTerminalStatus = (status: LeadStatus) => TERMINAL_STATUSES.includes(status);

export const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface Attribution {
  source?: LeadSource;
  sourceDetail?: string;
  landingPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

const clean = (value: unknown, max: number): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const text = value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : undefined;
};

/** Digits-only comparison key. A 10-digit Indian number and its +91/91/0-prefixed forms
 *  collapse to the same key, so duplicate detection sees them as one person. Returns
 *  undefined for anything that isn't a plausible 7-15 digit number (e.g. "Not provided"). */
export function normalizePhone(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || !/^[+\d\s().-]+$/.test(raw.trim())) return undefined;
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.length >= 7 && digits.length <= 15 ? digits : undefined;
}

export function normalizeSource(raw: unknown): LeadSource | undefined {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if ((LEAD_SOURCES as readonly string[]).includes(value)) return value as LeadSource;
  if (['fb', 'facebook', 'ig'].includes(value)) return value === 'ig' ? 'instagram' : 'meta';
  if (['cpc', 'adwords', 'googleads'].includes(value)) return 'google';
  return undefined;
}

/** Derives a source from UTM tags when the client didn't state one explicitly. */
export function inferSource(utmSource?: string, utmMedium?: string): LeadSource | undefined {
  const s = utmSource?.toLowerCase();
  if (s) {
    const direct = normalizeSource(s);
    if (direct && direct !== 'other') return direct;
    if (s.includes('instagram')) return 'instagram';
    if (s.includes('facebook') || s.includes('meta')) return 'meta';
    if (s.includes('google')) return 'google';
    return 'other';
  }
  if (utmMedium && /cpc|paid/i.test(utmMedium)) return 'other';
  return undefined;
}

/** Strict allowlist: only these string keys are ever read from a public payload. */
export function sanitizeAttribution(raw: unknown): Attribution {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const r = raw as Record<string, unknown>;
  const out: Attribution = {
    sourceDetail: clean(r.sourceDetail, 100),
    landingPage: clean(r.landingPage, 300),
    referrer: clean(r.referrer, 300),
    utmSource: clean(r.utmSource, 100),
    utmMedium: clean(r.utmMedium, 100),
    utmCampaign: clean(r.utmCampaign, 150),
    utmContent: clean(r.utmContent, 150),
    utmTerm: clean(r.utmTerm, 150)
  };
  out.source = normalizeSource(r.source) ?? inferSource(out.utmSource, out.utmMedium);
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined)) as Attribution;
}

export interface LeadInput {
  name?: string; // absent for WHATSAPP_CLICK (no contact details known)
  phone?: string;
  email?: string;
  whatsappNumber?: string;
  leadType: LeadType;
  captureKind: CaptureKind;
  destination?: string;
  journeySlug?: string;
  propertyRef?: string;
  travelStartDate?: Date;
  travelEndDate?: Date;
  duration?: string;
  adults?: number;
  children?: number;
  infants?: number;
  rooms?: number;
  budget?: string;
  pickupLocation?: string;
  travelStyle?: string;
  message?: string;
  priority?: LeadPriority;
  attribution?: Attribution;
  legacyRef?: { model: string; id: string };
  /** Meta Lead Ads provenance - only ever set by the server-side Meta ingest (captureKind META_LEAD_AD). */
  meta?: MetaProvenance;
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

const count = (value: unknown, max: number): number | undefined | null => {
  if (value === undefined || value === null || value === '') return undefined;
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max ? value : null;
};

function parseDate(value: unknown): Date | undefined | null {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Validates + normalizes an untrusted payload into LeadInput. Unknown keys are ignored,
 *  never persisted. Deliberately has no field for Aadhaar/PAN/passport/payment data. */
/** `allowMeta` is true only for the server-side Meta ingest; a public/manual payload can never inject provenance. */
export function validateLeadInput(raw: unknown, options: { allowMeta?: boolean } = {}): ValidationResult<LeadInput> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'Invalid lead payload' };
  const r = raw as Record<string, unknown>;

  const captureKind = (r.captureKind ?? 'FORM_SUBMITTED') as CaptureKind;
  if (!CAPTURE_KINDS.includes(captureKind)) return { ok: false, error: 'Invalid captureKind' };
  const leadType = (r.leadType ?? 'GENERAL') as LeadType;
  if (!LEAD_TYPES.includes(leadType)) return { ok: false, error: 'Invalid leadType' };
  const priority = r.priority === undefined ? undefined : (r.priority as LeadPriority);
  if (priority !== undefined && !LEAD_PRIORITIES.includes(priority)) return { ok: false, error: 'Invalid priority' };

  const name = clean(r.name, 200);
  const nameOptional = captureKind === 'WHATSAPP_CLICK' || captureKind === 'META_LEAD_AD';
  if (!name && !nameOptional) return { ok: false, error: 'Name is required' };

  const phone = r.phone === undefined || r.phone === '' ? undefined : normalizePhone(r.phone);
  // A Meta form can carry a malformed phone next to a good email: drop the phone, keep the lead.
  if (r.phone !== undefined && r.phone !== '' && !phone && captureKind !== 'WHATSAPP_CLICK' && captureKind !== 'META_LEAD_AD') return { ok: false, error: 'Invalid phone number' };
  const whatsappNumber = r.whatsappNumber === undefined || r.whatsappNumber === '' ? undefined : normalizePhone(r.whatsappNumber);
  if (r.whatsappNumber !== undefined && r.whatsappNumber !== '' && !whatsappNumber) return { ok: false, error: 'Invalid WhatsApp number' };
  const email = normalizeCustomerEmail(r.email);
  if (email === null) return { ok: false, error: 'Invalid email address' };
  if (captureKind !== 'WHATSAPP_CLICK' && !phone && !email && !whatsappNumber) return { ok: false, error: 'A phone, WhatsApp number or email is required' };

  const adults = count(r.adults, 100);
  const children = count(r.children, 100);
  const infants = count(r.infants, 100);
  const rooms = count(r.rooms, 50);
  if ([adults, children, infants, rooms].includes(null)) return { ok: false, error: 'Traveller and room counts must be whole numbers' };

  const start = parseDate(r.travelStartDate);
  const end = parseDate(r.travelEndDate);
  if (start === null || end === null) return { ok: false, error: 'Invalid travel date' };
  if (start && end && end < start) return { ok: false, error: 'Travel end date is before start date' };

  const legacy = r.legacyRef as { model?: unknown; id?: unknown } | undefined;
  const legacyRef = legacy && typeof legacy.model === 'string' && typeof legacy.id === 'string'
    ? { model: legacy.model.slice(0, 40), id: legacy.id.slice(0, 80) }
    : undefined;

  return {
    ok: true,
    value: {
      name, phone, email: email ?? undefined, whatsappNumber, leadType, captureKind,
      destination: clean(r.destination, 200),
      journeySlug: clean(r.journeySlug, 200)?.toLowerCase(),
      propertyRef: clean(r.propertyRef, 200),
      travelStartDate: start ?? undefined,
      travelEndDate: end ?? undefined,
      duration: clean(r.duration, 60),
      adults: adults ?? undefined, children: children ?? undefined,
      infants: infants ?? undefined, rooms: rooms ?? undefined,
      budget: clean(r.budget, 100),
      pickupLocation: clean(r.pickupLocation, 200),
      travelStyle: clean(r.travelStyle, 100),
      message: clean(r.message, 5000),
      priority,
      attribution: sanitizeAttribution(r.attribution),
      legacyRef,
      meta: options.allowMeta && captureKind === 'META_LEAD_AD' ? sanitizeMeta(r.meta) : undefined
    }
  };
}

/** Moving out of WON/LOST/SPAM is only allowed as an explicit reopen. Same-state is a no-op error. */
export function checkStatusTransition(from: LeadStatus, to: LeadStatus, reopen = false): ValidationResult<true> {
  if (!LEAD_STATUSES.includes(to)) return { ok: false, error: 'Invalid status' };
  if (from === to) return { ok: false, error: `Lead is already ${to}` };
  if (isTerminalStatus(from) && !isTerminalStatus(to) && !reopen) return { ok: false, error: `Lead is ${from}; reopen explicitly to change it` };
  return { ok: true, value: true };
}

export type FollowUpBucket = 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' | 'NONE' | 'CLOSED';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Terminal leads are always CLOSED — they never surface as overdue. Compares calendar
 *  days in the server's local zone; "due today" = any time today, even if already past. */
export function followUpBucket(status: LeadStatus, nextFollowUpAt: Date | undefined | null, now = new Date()): FollowUpBucket {
  if (isTerminalStatus(status)) return 'CLOSED';
  if (!nextFollowUpAt) return 'NONE';
  const day = startOfDay(nextFollowUpAt).getTime();
  const today = startOfDay(now).getTime();
  if (day < today) return 'OVERDUE';
  return day === today ? 'DUE_TODAY' : 'UPCOMING';
}

/** Default ordering: overdue, NEW, upcoming/due-today follow-ups, then everything else (newest first within a rank). */
export function leadSortRank(lead: { status: LeadStatus; nextFollowUpAt?: Date | null }, now = new Date()): number {
  const bucket = followUpBucket(lead.status, lead.nextFollowUpAt, now);
  if (bucket === 'OVERDUE') return 0;
  if (lead.status === 'NEW') return 1;
  if (bucket === 'DUE_TODAY' || bucket === 'UPCOMING') return 2;
  return isTerminalStatus(lead.status) ? 4 : 3;
}

export function sortLeads<T extends { status: LeadStatus; nextFollowUpAt?: Date | null; createdAt: Date }>(leads: T[], now = new Date()): T[] {
  return [...leads].sort((a, b) => {
    const rank = leadSortRank(a, now) - leadSortRank(b, now);
    if (rank) return rank;
    const rankNow = leadSortRank(a, now);
    if ((rankNow === 0 || rankNow === 2) && a.nextFollowUpAt && b.nextFollowUpAt) {
      const diff = a.nextFollowUpAt.getTime() - b.nextFollowUpAt.getTime();
      if (diff) return diff;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export interface LeadEvent {
  at: Date;
  type: 'CREATED' | 'STATUS_CHANGE' | 'NOTE' | 'FOLLOW_UP_SET' | 'CONTACTED' | 'PRIORITY_CHANGE' | 'QUOTE_UPDATED' | 'ASSIGNED' | 'REPEAT_ENQUIRY' | 'DUPLICATE_OF';
  actor: string;
  text?: string;
  from?: string;
  to?: string;
}

/** The one shape any PUBLIC response may use. No status, notes, assignment, amounts or ids beyond a boolean. */
export function toPublicLeadAck(): { received: true } {
  return { received: true };
}
