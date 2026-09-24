import { connectDB } from '@/lib/mongodb';
import { PlaceCache } from '@/models/PlaceCache';
import { getHbxDestinationMapping } from '@/config/hbxDestinations.config';
import { getSampleHotelsForDestination } from './hbxHotels.service';
import { matchGoogleStaysToHbxHotels, type GoogleStayForMapping } from '../../pricing/hotelMapping.service';
import { createPendingCandidate } from '../../pricing/hotelMappingRegistry.service';

/**
 * CONTENT mapping only — see the Phase-4 brief. Reads a small Google PlaceCache sample
 * and a small HBX Hotel Content sample (getSampleHotelsForDestination — Content API
 * only), scores them, and persists PENDING_REVIEW candidates for a human to review.
 * Deliberately never imports or calls hbxAvailability.service.ts — availability/rate
 * lookups belong only to a customer's actual price request, gated on an already-
 * CONFIRMED mapping (see stayPricing.service.ts), never to this offline pass.
 */

// Matches the sample size the 2026-09-24 Phase-3 validation used against real data —
// large enough to be representative, small enough to stay well inside the evaluation
// account's daily request quota when run across several destinations.
const GOOGLE_SAMPLE_SIZE = 10;
const HBX_CONTENT_SAMPLE_SIZE = 20;

export interface HbxCandidateGenerationSummary {
  destinationSlug: string;
  hbxDestinationCode: string;
  googleStaysSampled: number;
  hbxHotelsFetched: number;
  created: number;
  refreshed: number;
  skippedNoMatch: number;
  skippedCoordinateAnomaly: number;
  skippedExistingTerminal: number;
}

export type GenerateCandidatesResult = { ok: true; summary: HbxCandidateGenerationSummary } | { ok: false; error: string };

export async function generateHbxCandidatesForDestination(destinationSlug: string): Promise<GenerateCandidatesResult> {
  const mapping = getHbxDestinationMapping(destinationSlug);
  if (!mapping) {
    // Fail safe — never guess a destination code just to produce candidates.
    return { ok: false, error: `No verified HBX destination mapping for "${destinationSlug}" — see config/hbxDestinations.config.ts.` };
  }

  await connectDB();

  // Same reasoning as the Phase-3 validation script: HBX is a wholesale HOTEL supplier,
  // so only the hotel/resort-tagged PlaceCache slice is a meaningful comparison —
  // sampling camps/homestays/glamping would just manufacture NO_MATCH noise.
  const docs = await PlaceCache.find({ destinationSlug, stayType: { $in: ['hotel', 'resort'] } })
    .limit(GOOGLE_SAMPLE_SIZE)
    .lean();

  const googleStays: GoogleStayForMapping[] = docs.map((doc) => ({
    placeId: doc.placeId,
    name: doc.name,
    latitude: doc.latitude,
    longitude: doc.longitude
  }));

  const hbxHotels = await getSampleHotelsForDestination(mapping.hbxCode, HBX_CONTENT_SAMPLE_SIZE);
  const results = matchGoogleStaysToHbxHotels(googleStays, hbxHotels);

  let created = 0;
  let refreshed = 0;
  let skippedNoMatch = 0;
  let skippedCoordinateAnomaly = 0;
  let skippedExistingTerminal = 0;

  for (const result of results) {
    if (result.status === 'no_match' || !result.bestCandidate) {
      skippedNoMatch += 1;
      continue;
    }

    // Never automatically persisted — see this file's own top comment and
    // models/HotelProviderMapping.ts's hasCoordinateAnomaly field doc comment for the
    // second, independent guard at confirmMapping() time.
    if (result.bestCandidate.flags.includes('coordinate_anomaly_suspected')) {
      skippedCoordinateAnomaly += 1;
      continue;
    }

    const outcome = await createPendingCandidate({
      googlePlaceId: result.googleStay.placeId,
      destinationSlug,
      provider: 'hbx',
      providerHotelId: String(result.bestCandidate.hbxHotel.hbxCode),
      providerDestinationCode: mapping.hbxCode,
      googleHotelName: result.googleStay.name,
      providerHotelName: result.bestCandidate.hbxHotel.name,
      googleLatitude: result.googleStay.latitude,
      googleLongitude: result.googleStay.longitude,
      providerLatitude: result.bestCandidate.hbxHotel.latitude,
      providerLongitude: result.bestCandidate.hbxHotel.longitude,
      nameSimilarity: result.bestCandidate.nameSimilarity,
      distanceMeters: result.bestCandidate.distanceMeters,
      hasCoordinateAnomaly: false
    });

    if (outcome.created) {
      if (outcome.refreshed) refreshed += 1;
      else created += 1;
    } else {
      skippedExistingTerminal += 1;
    }
  }

  return {
    ok: true,
    summary: {
      destinationSlug,
      hbxDestinationCode: mapping.hbxCode,
      googleStaysSampled: googleStays.length,
      hbxHotelsFetched: hbxHotels.length,
      created,
      refreshed,
      skippedNoMatch,
      skippedCoordinateAnomaly,
      skippedExistingTerminal
    }
  };
}
