import { EXPERIENCE_OPTIONS, STAY_TYPE_OPTIONS, TRANSPORT_MODES } from '@/config/tripPlanner.config';
import { MAX_NIGHTS, priceJourney } from '@/lib/tripPlannerPricing';
import type { ExperienceId, JourneyParams, JourneyPriceResult, StayTypeId, TransportModeId } from '@/types/tripPlanner';

export const MAX_PICKUP_DROP_LENGTH = 200;
export const MAX_NOTES_LENGTH = 500;

/**
 * Bounded, optional free-text normalizer for the trip planner's pickup/drop/notes
 * fields — none of these are identity or price-bearing data, so "safe bounded string or
 * absent" is the entire contract. HTML escaping for the email channel happens
 * separately in lib/mailer.ts, which already escapes every interpolated value.
 */
export function normalizeOptionalText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

export interface NormalizedTripPlannerJourney {
  params: JourneyParams;
  tier?: string;
  notes?: string;
  priced: JourneyPriceResult;
}

/**
 * Server-authoritative normalization for a Trip Planner journey request
 * (details.source === 'trip-planner', see app/api/booking-requests/route.ts). Every
 * stay/transport/experience id is allow-listed against the same catalog the client UI
 * offers; every count is clamped to a sane range; price is always re-derived via
 * priceJourney() rather than trusted from the client. Pickup/drop/notes are
 * informational only — bounded strings, never read by priceJourney().
 *
 * `rawParams` must already be known to be a non-null, non-array object (the caller
 * rejects an invalid shape with its own 400 before calling this); `rawTier`/`rawNotes`
 * are the raw `details.tier`/`details.notes` values, validated here.
 */
export function normalizeTripPlannerJourney(
  rawParams: Record<string, unknown>,
  rawTier: unknown,
  rawNotes: unknown
): NormalizedTripPlannerJourney {
  const p = rawParams;

  const requestedStayTypeId = typeof p.stayTypeId === 'string' ? p.stayTypeId : undefined;
  const stayTypeId = (
    STAY_TYPE_OPTIONS.some((option) => option.id === requestedStayTypeId) ? requestedStayTypeId : STAY_TYPE_OPTIONS[0].id
  ) as StayTypeId;

  const requestedTransportModeId = typeof p.transportModeId === 'string' ? p.transportModeId : undefined;
  const transportModeId = (
    TRANSPORT_MODES.some((option) => option.id === requestedTransportModeId) ? requestedTransportModeId : TRANSPORT_MODES[0].id
  ) as TransportModeId;

  const requestedExperienceIds = Array.isArray(p.experienceIds)
    ? p.experienceIds.filter((id: unknown): id is string => typeof id === 'string')
    : [];
  const experienceIds = requestedExperienceIds.filter((id: string) =>
    EXPERIENCE_OPTIONS.some((option) => option.id === id)
  ) as ExperienceId[];

  const nightsRaw = Number(p.nights);
  const travellerCountRaw = Number(p.travellerCount);
  const roomsRaw = Number(p.rooms);

  const pickup = normalizeOptionalText(p.pickup, MAX_PICKUP_DROP_LENGTH);
  const drop = normalizeOptionalText(p.drop, MAX_PICKUP_DROP_LENGTH);
  const notes = normalizeOptionalText(rawNotes, MAX_NOTES_LENGTH);
  const tier = typeof rawTier === 'string' ? rawTier.slice(0, 100) : undefined;

  const params: JourneyParams = {
    // Clamped to MAX_NIGHTS (lib/tripPlannerPricing.ts) so a tampered/huge night count
    // can never reach priceJourney() — client-side clamping in CustomizePanel is a UX
    // nicety only, this is the actual authority.
    nights: Number.isFinite(nightsRaw) && nightsRaw > 0 ? Math.min(MAX_NIGHTS, Math.floor(nightsRaw)) : 1,
    travellerCount: Number.isFinite(travellerCountRaw) && travellerCountRaw > 0 ? Math.floor(travellerCountRaw) : 1,
    rooms: Number.isFinite(roomsRaw) && roomsRaw > 0 ? Math.floor(roomsRaw) : 1,
    stayTypeId,
    transportModeId,
    experienceIds,
    guideIncluded: p.guideIncluded === true,
    mealsIncluded: p.mealsIncluded === true,
    pickup,
    drop
  };

  return { params, tier, notes, priced: priceJourney(params) };
}
