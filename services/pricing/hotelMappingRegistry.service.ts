import { connectDB } from '@/lib/mongodb';
import { HotelProviderMapping, type HotelMappingStatus, type HotelProviderMappingDocument } from '@/models/HotelProviderMapping';
import type { StayPricingProviderId } from './stayPricing.types';

/**
 * The persistent hotel-mapping registry. Every mutation here is server-only and must
 * never be called from public Stays code — the only callers are the offline/admin
 * candidate-generation flow (services/providers/hbx/hbxMappingCandidates.service.ts)
 * and the internal review API (app/api/internal/hotel-mappings/*), both dev-gated. A
 * fuzzy matching algorithm is only ever allowed to reach createPendingCandidate; only
 * confirmMapping — an explicit human review action — can ever set status CONFIRMED.
 */

export interface MappingCandidateInput {
  googlePlaceId: string;
  destinationSlug: string;
  provider: StayPricingProviderId;
  providerHotelId: string;
  providerDestinationCode: string;
  googleHotelName: string;
  providerHotelName: string;
  googleLatitude?: number;
  googleLongitude?: number;
  providerLatitude?: number;
  providerLongitude?: number;
  nameSimilarity: number;
  distanceMeters?: number;
  /** Callers (e.g. hbxMappingCandidates.service.ts) should never pass `true` here for
   *  an automatically-generated candidate — see that service's own doc comment on why
   *  anomaly candidates are filtered out before this function is ever called. This
   *  field exists so the flag can still be recorded honestly if a future manual/admin
   *  path ever intentionally logs an anomaly candidate for the record; confirmMapping()
   *  below refuses to confirm any row with this set, regardless of how it got here. */
  hasCoordinateAnomaly: boolean;
}

export type CreateCandidateResult =
  | { created: true; refreshed: boolean; mapping: HotelProviderMappingDocument }
  | { created: false; reason: 'already_confirmed' | 'already_terminal' };

/** Idempotent: re-running candidate generation for the same (googlePlaceId, provider,
 *  providerHotelId) triple refreshes the existing PENDING_REVIEW row's score rather than
 *  creating a duplicate — but never touches a row that has already left PENDING_REVIEW
 *  (CONFIRMED/REJECTED/DISABLED), matching "do not overwrite an existing CONFIRMED
 *  mapping automatically". */
export async function createPendingCandidate(input: MappingCandidateInput): Promise<CreateCandidateResult> {
  await connectDB();

  const existing = await HotelProviderMapping.findOne({
    googlePlaceId: input.googlePlaceId,
    provider: input.provider,
    providerHotelId: input.providerHotelId
  });

  if (existing) {
    if (existing.status !== 'PENDING_REVIEW') {
      return { created: false, reason: existing.status === 'CONFIRMED' ? 'already_confirmed' : 'already_terminal' };
    }
    existing.nameSimilarity = input.nameSimilarity;
    existing.distanceMeters = input.distanceMeters;
    existing.googleHotelName = input.googleHotelName;
    existing.providerHotelName = input.providerHotelName;
    existing.googleLatitude = input.googleLatitude;
    existing.googleLongitude = input.googleLongitude;
    existing.providerLatitude = input.providerLatitude;
    existing.providerLongitude = input.providerLongitude;
    existing.hasCoordinateAnomaly = input.hasCoordinateAnomaly;
    await existing.save();
    return { created: true, refreshed: true, mapping: existing };
  }

  const mapping = await HotelProviderMapping.create({ ...input, status: 'PENDING_REVIEW' });
  return { created: true, refreshed: false, mapping };
}

export interface MappingCandidateFilter {
  status?: HotelMappingStatus;
  destinationSlug?: string;
  provider?: StayPricingProviderId;
}

export async function getMappingCandidates(filter: MappingCandidateFilter = {}): Promise<HotelProviderMappingDocument[]> {
  await connectDB();
  return HotelProviderMapping.find({
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.destinationSlug ? { destinationSlug: filter.destinationSlug } : {}),
    ...(filter.provider ? { provider: filter.provider } : {})
  })
    .sort({ createdAt: -1 })
    .lean();
}

/** THE gate stayPricing.service.ts's public price resolver depends on — returns a
 *  mapping only when status is exactly CONFIRMED, never PENDING_REVIEW/REJECTED/
 *  DISABLED. No mapping (or a non-confirmed one) must mean PRICE_ON_REQUEST to the
 *  caller, never a fuzzy-matched guess. */
export async function getConfirmedMapping(params: { googlePlaceId: string; provider: StayPricingProviderId }): Promise<HotelProviderMappingDocument | null> {
  await connectDB();
  return HotelProviderMapping.findOne({ googlePlaceId: params.googlePlaceId, provider: params.provider, status: 'CONFIRMED' }).lean();
}

export type ConfirmMappingResult =
  | { confirmed: true; mapping: HotelProviderMappingDocument }
  | { confirmed: false; reason: 'not_found' | 'invalid_status' | 'coordinate_anomaly' | 'conflict_google_place' | 'conflict_provider_hotel' };

/** The ONLY function allowed to set status CONFIRMED. Requires the row to currently be
 *  PENDING_REVIEW (never REJECTED/DISABLED -> CONFIRMED directly — a previously
 *  rejected/disabled decision must never be silently reversed by re-running this),
 *  refuses a coordinate-anomaly-flagged row outright, and re-checks for a conflicting
 *  CONFIRMED row in both directions before writing — matching services/pricing/
 *  hotelMapping.service.ts's Duplicate/Conflict Safety brief. The two partial-unique
 *  indexes on the model are the last-resort backstop against a race between two
 *  concurrent confirm calls; this function's own checks are what actually surface a
 *  clear, safe-to-act-on reason rather than a raw duplicate-key error. */
export async function confirmMapping(params: { mappingId: string; confirmedBy: string }): Promise<ConfirmMappingResult> {
  await connectDB();
  const mapping = await HotelProviderMapping.findById(params.mappingId);
  if (!mapping) return { confirmed: false, reason: 'not_found' };
  if (mapping.status !== 'PENDING_REVIEW') return { confirmed: false, reason: 'invalid_status' };
  if (mapping.hasCoordinateAnomaly) return { confirmed: false, reason: 'coordinate_anomaly' };

  const conflictingGooglePlace = await HotelProviderMapping.findOne({
    _id: { $ne: mapping._id },
    googlePlaceId: mapping.googlePlaceId,
    provider: mapping.provider,
    status: 'CONFIRMED'
  });
  if (conflictingGooglePlace) return { confirmed: false, reason: 'conflict_google_place' };

  const conflictingProviderHotel = await HotelProviderMapping.findOne({
    _id: { $ne: mapping._id },
    provider: mapping.provider,
    providerHotelId: mapping.providerHotelId,
    destinationSlug: mapping.destinationSlug,
    status: 'CONFIRMED'
  });
  if (conflictingProviderHotel) return { confirmed: false, reason: 'conflict_provider_hotel' };

  mapping.status = 'CONFIRMED';
  mapping.confirmedBy = params.confirmedBy;
  mapping.confirmedAt = new Date();

  try {
    await mapping.save();
  } catch {
    // A concurrent confirm won the race between our read and this write — the unique
    // partial index rejected it. Fail safe with the same conflict reason rather than a
    // raw DB error; the caller must not retry this into an overwrite.
    return { confirmed: false, reason: 'conflict_google_place' };
  }

  return { confirmed: true, mapping };
}

export type RejectMappingResult = { rejected: true; mapping: HotelProviderMappingDocument } | { rejected: false; reason: 'not_found' | 'invalid_status' };

/** Allowed from PENDING_REVIEW (the normal review-queue action) or CONFIRMED (correcting
 *  a mistake found later) — never from DISABLED, which is already inactive. */
export async function rejectMapping(params: { mappingId: string }): Promise<RejectMappingResult> {
  await connectDB();
  const mapping = await HotelProviderMapping.findById(params.mappingId);
  if (!mapping) return { rejected: false, reason: 'not_found' };
  if (mapping.status !== 'PENDING_REVIEW' && mapping.status !== 'CONFIRMED') return { rejected: false, reason: 'invalid_status' };

  mapping.status = 'REJECTED';
  await mapping.save();
  return { rejected: true, mapping };
}

export type DisableMappingResult = { disabled: true; mapping: HotelProviderMappingDocument } | { disabled: false; reason: 'not_found' | 'invalid_status' };

/** For turning off a previously-good mapping without deleting its review history (e.g.
 *  the supplier delists the hotel) — only ever from CONFIRMED. */
export async function disableMapping(params: { mappingId: string }): Promise<DisableMappingResult> {
  await connectDB();
  const mapping = await HotelProviderMapping.findById(params.mappingId);
  if (!mapping) return { disabled: false, reason: 'not_found' };
  if (mapping.status !== 'CONFIRMED') return { disabled: false, reason: 'invalid_status' };

  mapping.status = 'DISABLED';
  await mapping.save();
  return { disabled: true, mapping };
}
