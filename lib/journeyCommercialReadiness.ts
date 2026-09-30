// INTERNAL, NOT PUBLIC — reports what's still missing before a draft Journey could be
// considered for publication. This is advisory only: nothing in this codebase calls this
// function to actually change a Journey's `status`, and it never will on its own —
// `OWNER_APPROVAL_REQUIRED` is unconditionally included for any non-published Journey,
// specifically so a caller can never treat "zero blockers" as "safe to auto-publish."
// Publishing remains a manual, human decision (see models/Journey.ts's pre-validate
// hook, which independently enforces the commercially-required fields at the database
// layer regardless of what this function reports).

export type CommercialBlocker =
  | 'MISSING_PRICE'
  | 'MISSING_HOTEL_PLAN'
  | 'MISSING_TRANSPORT_PLAN'
  | 'MISSING_OCCUPANCY'
  | 'MISSING_PICKUP_INFO'
  | 'MISSING_DROP_INFO'
  | 'MISSING_MEAL_PLAN'
  | 'MISSING_INCLUSIONS'
  | 'MISSING_EXCLUSIONS'
  | 'CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED'
  | 'OWNER_APPROVAL_REQUIRED';

export interface CommercialReadinessInput {
  status?: 'draft' | 'published';
  price?: number;
  hotelCategoryDescription?: string;
  stayOptions?: unknown[];
  transportType?: string;
  transportOptions?: unknown[];
  minTravellers?: number;
  roomsIncluded?: number;
  pickupInfo?: string;
  dropInfo?: string;
  mealPlan?: string;
  inclusions?: string[];
  exclusions?: string[];
  /** See models/Journey.ts's own doc comment on the field of the same name — must only
   *  ever be `true` when the general /cancellation-policy page has actually been
   *  confirmed live, public, and applicable to Journeys. This function trusts the value
   *  it's given (the same way it trusts `price`/`inclusions`/every other field is real,
   *  not fabricated) — it does not and cannot verify the page itself. */
  usesGeneralCancellationPolicy?: boolean;
}

/** Every blocker this Journey currently has, in a stable, deterministic order — never
 *  used to gate any automated action; see this module's own doc comment. */
export function getCommercialBlockers(journey: CommercialReadinessInput): CommercialBlocker[] {
  const blockers: CommercialBlocker[] = [];

  if (typeof journey.price !== 'number' || !Number.isFinite(journey.price) || journey.price <= 0) {
    blockers.push('MISSING_PRICE');
  }
  // A hotel plan is satisfied by either a real descriptive category or at least one
  // priced stay-tier option — either one is a genuine, non-fabricated hotel plan.
  if (!journey.hotelCategoryDescription && !(journey.stayOptions && journey.stayOptions.length > 0)) {
    blockers.push('MISSING_HOTEL_PLAN');
  }
  if (!journey.transportType && !(journey.transportOptions && journey.transportOptions.length > 0)) {
    blockers.push('MISSING_TRANSPORT_PLAN');
  }
  if (typeof journey.minTravellers !== 'number' || typeof journey.roomsIncluded !== 'number') {
    blockers.push('MISSING_OCCUPANCY');
  }
  if (!journey.pickupInfo) {
    blockers.push('MISSING_PICKUP_INFO');
  }
  if (!journey.dropInfo) {
    blockers.push('MISSING_DROP_INFO');
  }
  if (!journey.mealPlan) {
    blockers.push('MISSING_MEAL_PLAN');
  }
  if (!journey.inclusions || journey.inclusions.length === 0) {
    blockers.push('MISSING_INCLUSIONS');
  }
  if (!journey.exclusions || journey.exclusions.length === 0) {
    blockers.push('MISSING_EXCLUSIONS');
  }
  // Resolved ONLY by usesGeneralCancellationPolicy === true — a statement of fact (the
  // real, public /cancellation-policy page genuinely covers this Journey), never a
  // package-specific percentage this codebase doesn't have and never fabricates (see
  // components/modules/CancellationPolicyContent.tsx, which deliberately only describes
  // a general, case-by-case policy with no fixed percentages). Approving "use the
  // general policy" as an approach is not the same fact as "the general policy actually
  // exists and is publicly reachable" — this field must only be set true once the latter
  // has actually been verified, never merely because the former was approved.
  if (!journey.usesGeneralCancellationPolicy) {
    blockers.push('CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED');
  }
  // Unconditional for anything not already published — see this module's own doc
  // comment on why this can never be removed by resolving the other blockers.
  if (journey.status !== 'published') {
    blockers.push('OWNER_APPROVAL_REQUIRED');
  }

  return blockers;
}

// Convenience read-only check — NEVER wired to any publish action in this codebase.
// "Ready" here means "every field-level blocker is resolved," not "safe to publish
// automatically" — OWNER_APPROVAL_REQUIRED is deliberately excluded from this specific
// check because it is never something a field update alone can resolve; it always needs
// a human decision on top, made through whatever process the business uses, not this
// function or any code path that calls it.
// CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED is NOT excluded here (unlike before
// usesGeneralCancellationPolicy existed): it is now a genuinely resolvable field-level
// blocker, exactly like MISSING_PRICE or MISSING_INCLUSIONS — it only clears when that
// field is truthfully `true`, never by this function treating it as unresolvable.
export function isCommerciallyContentComplete(journey: CommercialReadinessInput): boolean {
  return getCommercialBlockers(journey).every((blocker) => blocker === 'OWNER_APPROVAL_REQUIRED');
}
