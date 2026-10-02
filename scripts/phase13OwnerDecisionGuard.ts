import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { assertPhase12DraftInventory, findDraftPublicLeaks } from './phase12DraftPreparationGuard';

export { findDraftPublicLeaks };
// Fifth slug verified from production name and Phase 12, not inferred from a URL.
export const PHASE13_SLUGS = Object.freeze([
  'auli-tour', 'badrinath-yatra',
  'dharamshala-mcleodganj-dalhousie-khajjiar-circuit',
  'kedarnath-yatra', 'uttarakhand-honeymoon-circuit'
]);
export const PHASE13_FIELDS = Object.freeze([
  'price', 'pickupInfo', 'dropInfo', 'mealPlan', 'transportType', 'minTravellers',
  'roomsIncluded', 'hotelCategoryDescription', 'inclusions', 'exclusions',
  'image', 'usesGeneralCancellationPolicy', 'itinerary'
]);
export type Source = 'EXISTING' | 'NORMALIZED' | 'OWNER DECISION REQUIRED' | 'SUPPLIER CONFIRMATION REQUIRED';
export type RecordData = Record<string, unknown>;
export type FieldProposal = { current: unknown; proposed: unknown; source: Source; basis: string };
export type Proposal = {
  slug: string; expected: RecordData; allowedFields: readonly string[];
  fields: Record<string, FieldProposal>; ownerApproved: false; executable: false;
};

export function fingerprint(value: unknown): string {
  function canonical(item: unknown): unknown {
    if (Array.isArray(item)) return item.map(canonical);
    if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => [key, canonical(val)]));
    return item;
  }
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

export function assertInventory(rows: RecordData[]) {
  assertPhase12DraftInventory(rows.filter(row => row.status === 'draft'));
  if (rows.length !== 40 || rows.filter(row => row.status === 'published').length !== 28) throw new Error('Production baseline drift');
  const honeymoon = rows.filter(row => typeof row.name === 'string' && /Uttarakhand.*Honeymoon/i.test(row.name));
  if (honeymoon.length !== 1 || honeymoon[0].slug !== PHASE13_SLUGS[4]) throw new Error('Honeymoon identity changed; resolve manually');
  return PHASE13_SLUGS.map(slug => {
    const matches = rows.filter(row => row.slug === slug);
    if (matches.length !== 1 || matches[0].status !== 'draft') throw new Error(`Target must exist once and remain draft: ${slug}`);
    return matches[0];
  });
}

export function assertReadOnlyArguments(args: string[]) {
  if (args.includes('--execute')) throw new Error('PHASE13_EXECUTION_DISABLED: no owner-approved commercial payload; no database writes authorized');
  if (args.some(arg => arg !== '--write-report') || new Set(args).size !== args.length) throw new Error('Only --write-report is accepted; default is read-only dry-run');
}

export function buildProposal(record: RecordData): Proposal {
  const slug = String(record.slug);
  if (!PHASE13_SLUGS.includes(slug) || record.status !== 'draft') throw new Error('Target outside exact draft allowlist');
  const fields: Record<string, FieldProposal> = {};
  const add = (field: string, proposed: unknown, source: Source, basis: string) => {
    fields[field] = { current: record[field] ?? null, proposed, source, basis };
  };
  const honeymoon = slug === 'uttarakhand-honeymoon-circuit';
  add('price', honeymoon ? 17999 : null, 'OWNER DECISION REQUIRED', honeymoon
    ? 'Phase 8/12 historical proposal only; not approved or cost-validated. Do not write.'
    : 'No documented target price. Obtain route-specific supplier costing before proposing a number; sibling prices are not cost evidence.');
  add('pickupInfo', null, 'OWNER DECISION REQUIRED', `Stored startingCity=${record.startingCity}; exact point, time and included transfer unresolved.`);
  add('dropInfo', null, 'OWNER DECISION REQUIRED', `Stored endingCity=${record.endingCity}; exact point, time and included return sector unresolved.`);
  add('mealPlan', null, 'SUPPLIER CONFIRMATION REQUIRED', honeymoon ? 'Historical Phase 8 breakfast-only proposal; no confirmed meal schedule or cost.' : 'No target-specific approved meal schedule or supplier costs.');
  add('transportType', null, 'SUPPLIER CONFIRMATION REQUIRED', 'Confirm private/shared basis, vehicle, permitted endpoints, daily sectors, local transfer fees and driver costs.');
  add('minTravellers', honeymoon ? 2 : null, 'OWNER DECISION REQUIRED', honeymoon ? 'Historical Phase 8 two-adult proposal, unapproved.' : 'Approve party size before per-person costing.');
  add('roomsIncluded', honeymoon ? 1 : null, 'OWNER DECISION REQUIRED', honeymoon ? 'Historical Phase 8 one double-sharing room proposal, unapproved.' : 'Approve occupancy and room count; not inherited from another Journey.');
  add('hotelCategoryDescription', null, 'SUPPLIER CONFIRMATION REQUIRED', 'Confirm exact overnight bases, category, operating dates, occupancy and room availability. No hotel promise exists.');
  add('inclusions', null, 'OWNER DECISION REQUIRED', 'Approve a costed list of stays, meals and permitted transfers only after route/service confirmation; no current inclusions.');
  const extras: Record<string, string[]> = {
    'auli-tour': ['Ropeway tickets', 'Skiing and snow activities', 'Equipment and instructors', 'Local vehicles'],
    'badrinath-yatra': ['Special temple services and paid guides'],
    'kedarnath-yatra': ['Helicopter', 'Pony', 'Palki', 'Local shuttle', 'Trek guide or porter'],
    'dharamshala-mcleodganj-dalhousie-khajjiar-circuit': ['Paid guides and attraction/activity tickets'],
    'uttarakhand-honeymoon-circuit': ['Boating', 'Cake', 'Flowers and room decoration', 'Candlelight dinner', 'Room upgrades']
  };
  add('exclusions', ['Travel to/from agreed endpoints', 'Personal expenses', ...extras[slug], 'Services not expressly included in the final written quote'], 'OWNER DECISION REQUIRED', 'Proposed paid-item boundaries only; mandatory local access costs and support responsibilities must be settled before sale. No item is confirmed included.');
  add('image', null, 'OWNER DECISION REQUIRED', 'Select and approve a geographically accurate existing candidate; verify rights and add Journey credit through config/imageCredits.config.ts.');
  add('usesGeneralCancellationPolicy', null, 'OWNER DECISION REQUIRED', 'Confirm live policy and applicability to the finalized services before setting true.');
  add('itinerary', record.itinerary ?? [], 'EXISTING', 'Retain exact source until route/night decisions are approved. Proposed wording corrections are separate in the decision pack.');
  return { slug, expected: structuredClone(record), allowedFields: [...PHASE13_FIELDS], fields, ownerApproved: false, executable: false };
}

export function evaluateProposal(record: RecordData, proposal: Proposal) {
  const reasons = ['PHASE13_EXECUTION_DISABLED', 'OWNER_COMMERCIAL_APPROVAL_REQUIRED'];
  if (!PHASE13_SLUGS.includes(proposal.slug) || record.slug !== proposal.slug) reasons.push('SLUG_NOT_ALLOWLISTED');
  if (record.status !== 'draft') reasons.push('TARGET_NOT_DRAFT');
  if (!isDeepStrictEqual(record, proposal.expected)) reasons.push('SOURCE_CONFLICT');
  if (!isDeepStrictEqual([...proposal.allowedFields].sort(), [...PHASE13_FIELDS].sort())) reasons.push('INVALID_FIELD_ALLOWLIST');
  if (!isDeepStrictEqual(Object.keys(proposal.fields).sort(), [...PHASE13_FIELDS].sort())) reasons.push('INVALID_PAYLOAD_FIELDS');
  for (const field of new Set([...proposal.allowedFields, ...Object.keys(proposal.fields)])) {
    if (['status', 'slug', 'duration'].includes(field)) reasons.push(`PROTECTED_FIELD:${field}`);
    if (!PHASE13_FIELDS.includes(field)) reasons.push(`FIELD_NOT_ALLOWLISTED:${field}`);
  }
  return { slug: proposal.slug, action: 'REFUSED' as const, reasons: [...new Set(reasons)], changedFields: [] };
}

export function assertUnchanged(before: unknown, after: unknown) {
  if (!isDeepStrictEqual(before, after)) throw new Error('SOURCE_CONFLICT: production records changed during audit');
}
