import { isDeepStrictEqual } from 'node:util';

export const PHASE12_DRAFT_COUNT = 12;

export const PREPARATION_FIELDS = Object.freeze([
  'price',
  'pickupInfo',
  'dropInfo',
  'mealPlan',
  'transportType',
  'minTravellers',
  'roomsIncluded',
  'hotelCategoryDescription',
  'inclusions',
  'exclusions',
  'image',
  'regionId',
  'usesGeneralCancellationPolicy',
  'itinerary'
]);

const PROTECTED_FIELDS = Object.freeze(['status', 'slug', 'duration']);

export interface Phase12PreparationPlan {
  slug: string;
  allowedFields: readonly string[];
  values: Record<string, unknown>;
  expectedCurrentValues?: Record<string, unknown>;
  evidence: {
    ownerApproved: boolean;
    supplierConfirmed: boolean;
    imageVerified: boolean;
  };
}

export type PreparationDecision = {
  slug: string;
  action: 'UPDATE' | 'ALREADY_CORRECT' | 'REFUSED';
  changedFields: string[];
  blockers: string[];
  conflicts: string[];
  proposed: Record<string, unknown>;
};

export function assertPhase12DraftInventory(rows: Array<Record<string, unknown>>) {
  if (rows.length !== PHASE12_DRAFT_COUNT) throw new Error(`Expected ${PHASE12_DRAFT_COUNT} production drafts, found ${rows.length}`);
  const slugs = rows.map((row) => row.slug);
  if (slugs.some((slug) => typeof slug !== 'string' || !slug) || new Set(slugs).size !== PHASE12_DRAFT_COUNT) {
    throw new Error('Draft inventory has a missing or duplicate slug');
  }
  if (rows.some((row) => row.status !== 'draft')) throw new Error('Draft inventory includes a non-draft record');
  return slugs as string[];
}

export function evaluatePreparationPlan(
  record: Record<string, unknown>,
  plan: Phase12PreparationPlan,
  readinessBlockers: string[]
): PreparationDecision {
  const blockers: string[] = [];
  const conflicts: string[] = [];
  const valueFields = Object.keys(plan.values);

  if (record.slug !== plan.slug) blockers.push('SLUG_MISMATCH');
  if (record.status !== 'draft') blockers.push('TARGET_NOT_DRAFT');
  if (!plan.evidence.ownerApproved) blockers.push('OWNER_APPROVAL_REQUIRED_FOR_VALUES');
  if (!plan.evidence.supplierConfirmed) blockers.push('SUPPLIER_CONFIRMATION_REQUIRED');
  if (!plan.evidence.imageVerified) blockers.push('IMAGE_VERIFICATION_REQUIRED');

  if (new Set(plan.allowedFields).size !== plan.allowedFields.length) blockers.push('DUPLICATE_FIELD_ALLOWLIST');
  for (const field of plan.allowedFields) {
    if (!PREPARATION_FIELDS.includes(field)) blockers.push(`FIELD_NOT_PREPARABLE:${field}`);
    if (PROTECTED_FIELDS.includes(field)) blockers.push(`PROTECTED_FIELD:${field}`);
  }
  for (const field of valueFields) {
    if (!plan.allowedFields.includes(field)) blockers.push(`FIELD_NOT_ALLOWLISTED:${field}`);
    if (PROTECTED_FIELDS.includes(field)) blockers.push(`PROTECTED_FIELD:${field}`);
  }

  if (!plan.allowedFields.includes('image') && plan.values.image !== undefined) blockers.push('IMAGE_FIELD_NOT_ALLOWLISTED');
  if (!plan.allowedFields.includes('itinerary') && plan.values.itinerary !== undefined) blockers.push('ITINERARY_FIELD_NOT_ALLOWLISTED');
  if (!isDeepStrictEqual(plan.allowedFields.slice().sort(), valueFields.slice().sort())) blockers.push('ALLOWLIST_MUST_MATCH_EXPLICIT_PAYLOAD');

  for (const [field, value] of Object.entries(plan.values)) {
    const current = record[field];
    if (isDeepStrictEqual(current, value)) continue;
    const hasExpected = Object.prototype.hasOwnProperty.call(plan.expectedCurrentValues ?? {}, field);
    const expected = plan.expectedCurrentValues?.[field];
    if (hasExpected && isDeepStrictEqual(current, expected)) continue;
    const empty = current === undefined || current === null || current === '' || (Array.isArray(current) && current.length === 0);
    if (!empty) conflicts.push(field);
  }

  for (const blocker of readinessBlockers) {
    if (blocker !== 'OWNER_APPROVAL_REQUIRED') blockers.push(`READINESS:${blocker}`);
  }

  const changedFields = valueFields.filter((field) => !isDeepStrictEqual(record[field], plan.values[field]));
  const uniqueBlockers = [...new Set(blockers)];
  const action = conflicts.length || uniqueBlockers.length
    ? 'REFUSED'
    : changedFields.length
      ? 'UPDATE'
      : 'ALREADY_CORRECT';

  return { slug: plan.slug, action, changedFields, blockers: uniqueBlockers, conflicts, proposed: plan.values };
}

export function preparationOnlyChangesAllowed(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  values: Record<string, unknown>
) {
  if (Object.keys(values).some((field) => PROTECTED_FIELDS.includes(field))) return false;
  return isDeepStrictEqual(after, { ...before, ...values });
}

export function findDraftPublicLeaks(draftSlugs: string[], catalogueSlugs: string[], sitemapUrls: string[]) {
  const catalogueLeaks = draftSlugs.filter((slug) => catalogueSlugs.includes(slug));
  const sitemapLeaks = draftSlugs.filter((slug) => sitemapUrls.some((url) => url.endsWith(`/journeys/${slug}`)));
  return { catalogueLeaks, sitemapLeaks, isolated: catalogueLeaks.length === 0 && sitemapLeaks.length === 0 };
}