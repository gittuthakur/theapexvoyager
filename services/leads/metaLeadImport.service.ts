import { normalizeMetaLead, type MetaGraphLead } from '@/lib/metaLeads';
import { normalizePhone, validateLeadInput } from '@/lib/leads';

export interface ExistingCrmIndex { metaLeadIds: Set<string>; phones: Set<string>; emails: Set<string> }

export interface MetaImportAnalysis {
  retrieved: number; identifiable: number; invalid: number; invalidReasons: Record<string, number>; requiresReview: number;
  classification: Record<'WOULD_CREATE' | 'ALREADY_IMPORTED' | 'INVALID_OR_NON_IDENTIFIABLE' | 'DUPLICATE_PROVIDER_RECORD' | 'REQUIRES_REVIEW', number>;
  newCustomerContacts: number; rowsWithPhone: number; rowsWithEmail: number; rowsWithBoth: number; rowsWithNeither: number; uniquePhones: number; uniqueEmails: number;
  alreadyImported: number; matchesExistingContact: number; duplicatesWithinBatch: number; wouldCreate: number;
  forms: number; campaigns: number; dateRange: { from?: string; to?: string };
  byPlatform: Record<string, number>; payloads: Record<string, unknown>[]; createdAt: (Date | undefined)[];
}

const contactKeys = (phone?: string, email?: string) => [phone && `p:${phone}`, email && `e:${email}`].filter(Boolean) as string[];
const bump = (o: Record<string, number>, k: string) => { o[k] = (o[k] ?? 0) + 1; };

/**
 * Pure dry-run analysis of a batch of Meta leads (from the Graph API or a Leads-Center CSV)
 * against the existing CRM. Aggregate output only - the returned `payloads` are for the
 * (separately authorised) execute step and must never be printed.
 */
export function analyzeMetaLeads(leads: MetaGraphLead[], existing: ExistingCrmIndex): MetaImportAnalysis {
  const out: MetaImportAnalysis = {
    retrieved: leads.length, identifiable: 0, invalid: 0, invalidReasons: {}, requiresReview: 0, newCustomerContacts: 0, rowsWithPhone: 0, rowsWithEmail: 0, rowsWithBoth: 0, rowsWithNeither: 0, uniquePhones: 0, uniqueEmails: 0,
    classification: { WOULD_CREATE: 0, ALREADY_IMPORTED: 0, INVALID_OR_NON_IDENTIFIABLE: 0, DUPLICATE_PROVIDER_RECORD: 0, REQUIRES_REVIEW: 0 }, alreadyImported: 0, matchesExistingContact: 0,
    duplicatesWithinBatch: 0, wouldCreate: 0, forms: 0, campaigns: 0, dateRange: {}, byPlatform: {}, payloads: [], createdAt: []
  };
  const forms = new Set<string>(), campaigns = new Set<string>(), seenIds = new Set<string>(), seenContacts = new Set<string>(), phones = new Set<string>(), emails = new Set<string>();
  let min = Infinity, max = -Infinity;

  for (const lead of leads) {
    const n = normalizeMetaLead(lead);
    if (!n) { out.invalid++; out.rowsWithNeither++; out.classification.INVALID_OR_NON_IDENTIFIABLE++; bump(out.invalidReasons, 'missing or malformed lead id'); continue; }
    const rawPhone = normalizePhone(typeof n.payload.phone === 'string' ? n.payload.phone : undefined) ?? normalizePhone(typeof n.payload.whatsappNumber === 'string' ? n.payload.whatsappNumber : undefined);
    const rawEmail = typeof n.payload.email === 'string' && n.payload.email.trim() ? n.payload.email.trim().toLowerCase() : undefined;
    if (rawPhone) out.rowsWithPhone++;
    if (rawEmail) out.rowsWithEmail++;
    if (rawPhone && rawEmail) out.rowsWithBoth++;
    if (!rawPhone && !rawEmail) out.rowsWithNeither++;
    if (rawPhone) phones.add(rawPhone);
    if (rawEmail) emails.add(rawEmail);
    const parsed = validateLeadInput(n.payload, { allowMeta: true });
    if (!parsed.ok) {
      // A named person with no phone/email (e.g. an Instagram-only enquiry) cannot be stored under the CRM's contact rule: the owner decides.
      if (!rawPhone && !rawEmail && n.payload.name) { out.requiresReview++; out.classification.REQUIRES_REVIEW++; bump(out.invalidReasons, 'named lead without phone/email (review)'); }
      else { out.invalid++; out.classification.INVALID_OR_NON_IDENTIFIABLE++; bump(out.invalidReasons, parsed.error); }
      continue;
    }
    out.identifiable++;
    const formKey = n.meta.formId ?? n.meta.formName; if (formKey) forms.add(formKey);
    if (n.meta.campaignId ?? n.meta.campaignName) campaigns.add((n.meta.campaignId ?? n.meta.campaignName)!);
    bump(out.byPlatform, n.meta.platform ?? 'unknown');
    const t = n.meta.createdTime?.getTime();
    if (t !== undefined) { min = Math.min(min, t); max = Math.max(max, t); }

    if (seenIds.has(n.meta.leadId)) { out.classification.DUPLICATE_PROVIDER_RECORD++; out.alreadyImported++; continue; }
    if (existing.metaLeadIds.has(n.meta.leadId)) { out.alreadyImported++; out.classification.ALREADY_IMPORTED++; continue; }
    seenIds.add(n.meta.leadId);

    const phone = normalizePhone(parsed.value.phone) ?? normalizePhone(parsed.value.whatsappNumber);
    const email = parsed.value.email?.toLowerCase();
    const matchesExisting = !!((phone && existing.phones.has(phone)) || (email && existing.emails.has(email)));
    if (matchesExisting) out.matchesExistingContact++;
    else if (!contactKeys(phone, email).some(k => seenContacts.has(k))) out.newCustomerContacts++;
    const keys = contactKeys(phone, email);
    if (keys.some(k => seenContacts.has(k))) out.duplicatesWithinBatch++;
    keys.forEach(k => seenContacts.add(k));

    out.wouldCreate++; out.classification.WOULD_CREATE++; // every new leadgen id is a genuine enquiry; matches/duplicates are preserved, never dropped
    out.payloads.push(n.payload);
    out.createdAt.push(n.meta.createdTime);
  }
  out.forms = forms.size; out.campaigns = campaigns.size; out.uniquePhones = phones.size; out.uniqueEmails = emails.size;
  if (min !== Infinity) out.dateRange = { from: new Date(min).toISOString().slice(0, 10), to: new Date(max).toISOString().slice(0, 10) };
  return out;
}
