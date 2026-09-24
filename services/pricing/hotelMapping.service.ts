import type { HbxHotelSummary } from '../providers/hbx/hbx.mapper';

/** Deliberately a narrow local shape, not the full `Stay` type (types/stay.ts) — this
 *  module only ever reads name/coordinates/identity, and staying decoupled means a
 *  future second Google-side shape (or a non-Google source) can reuse it unchanged. */
export interface GoogleStayForMapping {
  placeId: string;
  name: string;
  latitude?: number;
  longitude?: number;
}

export type HotelMatchStatus = 'high_confidence' | 'manual_review_required' | 'no_match';

export interface HotelMatchCandidate {
  hbxHotel: HbxHotelSummary;
  nameSimilarity: number;
  distanceMeters?: number;
  confidence: number;
  flags: string[];
}

export interface HotelMatchResult {
  googleStay: GoogleStayForMapping;
  status: HotelMatchStatus;
  bestCandidate?: HotelMatchCandidate;
}

const GENERIC_WORDS = new Set(['hotel', 'hotels', 'resort', 'resorts', 'the', 'and', 'inn', 'stay', 'stays', 'a']);

/** Lowercases, strips punctuation, and drops generic hospitality words ("Hotel",
 *  "Resort", "The", ...) that add noise rather than identity signal — "Radisson Hotel
 *  Shimla" and "Radisson Shimla" should normalize to the same tokens. Never strips a
 *  brand name or place name, only the generic vocabulary above. */
export function normalizeHotelName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0 && !GENERIC_WORDS.has(word))
    .join(' ')
    .trim();
}

function bigrams(value: string): Set<string> {
  const compact = value.replace(/\s+/g, '');
  const result = new Set<string>();
  for (let i = 0; i < compact.length - 1; i += 1) {
    result.add(compact.slice(i, i + 2));
  }
  return result;
}

/** Sorensen-Dice bigram coefficient — 1.0 for an exact match, 0 for no shared bigrams at
 *  all. Chosen over Levenshtein for this use case: it tolerates word reordering
 *  ("Shimla Radisson Hotel" vs "Radisson Hotel Shimla") without a fuzzy-matching
 *  dependency, and degrades gracefully for very short names instead of dividing by
 *  zero. */
export function nameSimilarity(a: string, b: string): number {
  const normalizedA = normalizeHotelName(a);
  const normalizedB = normalizeHotelName(b);
  if (normalizedA.length === 0 || normalizedB.length === 0) return 0;
  if (normalizedA === normalizedB) return 1;

  const bigramsA = bigrams(normalizedA);
  const bigramsB = bigrams(normalizedB);
  if (bigramsA.size === 0 || bigramsB.size === 0) return normalizedA === normalizedB ? 1 : 0;

  let intersection = 0;
  for (const gram of bigramsA) {
    if (bigramsB.has(gram)) intersection += 1;
  }
  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

const EARTH_RADIUS_METERS = 6371000;

export function haversineDistanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Both thresholds were chosen against the 2026-09-24 diagnostic's real sample data
// (e.g. Shimla/Manali hotel coordinates cluster within a few km of the town centre) —
// not arbitrary round numbers.
// Exported so the review UI (app/internal/hotel-mappings) can label a stored candidate
// "strong" using the exact same thresholds this scorer uses for HIGH_CONFIDENCE —
// display-only, and never a second, drifting copy of these numbers.
export const HIGH_CONFIDENCE_NAME_THRESHOLD = 0.82;
export const HIGH_CONFIDENCE_DISTANCE_METERS = 300;
const REVIEW_NAME_THRESHOLD = 0.5;
const REVIEW_DISTANCE_METERS = 2000;
// Beyond this, even a strong name match is more likely a coordinate data error on one
// side than the same real property — e.g. the diagnostic's own "Grand Dragon Hotel"
// row for Manali carrying Leh's coordinates (~380km away). Flagged for manual review
// rather than silently trusted or silently discarded.
const COORDINATE_ANOMALY_METERS = 20000;

/** Scores one Google stay against one HBX hotel candidate. Requires BOTH strong name
 *  similarity AND geographic proximity for `high_confidence` — matching the brief's
 *  explicit rule; neither signal alone is ever sufficient on its own. */
function scoreCandidate(googleStay: GoogleStayForMapping, hbxHotel: HbxHotelSummary): HotelMatchCandidate {
  const similarity = nameSimilarity(googleStay.name, hbxHotel.name);
  const flags: string[] = [];

  let distanceMeters: number | undefined;
  if (
    googleStay.latitude !== undefined &&
    googleStay.longitude !== undefined &&
    hbxHotel.latitude !== undefined &&
    hbxHotel.longitude !== undefined
  ) {
    distanceMeters = haversineDistanceMeters(
      { latitude: googleStay.latitude, longitude: googleStay.longitude },
      { latitude: hbxHotel.latitude, longitude: hbxHotel.longitude }
    );
  } else {
    flags.push('missing_coordinates');
  }

  if (distanceMeters !== undefined && similarity >= REVIEW_NAME_THRESHOLD && distanceMeters > COORDINATE_ANOMALY_METERS) {
    flags.push('coordinate_anomaly_suspected');
  }

  const proximityScore = distanceMeters === undefined ? 0 : distanceMeters <= HIGH_CONFIDENCE_DISTANCE_METERS ? 1 : distanceMeters <= REVIEW_DISTANCE_METERS ? 0.5 : 0;
  const confidence = similarity * 0.6 + proximityScore * 0.4;

  return { hbxHotel, nameSimilarity: similarity, distanceMeters, confidence, flags };
}

/** Pure, read-only scoring — never writes to MongoDB or any other store. See
 *  AGENTS.md-style Phase-2 rule: hotel mapping is design-only this phase, no automatic
 *  persistence of fuzzy matches. Callers decide what (if anything) to do with the
 *  result; nothing here has a side effect. */
export function matchGoogleStayToHbxHotels(googleStay: GoogleStayForMapping, hbxHotels: HbxHotelSummary[]): HotelMatchResult {
  if (hbxHotels.length === 0) {
    return { googleStay, status: 'no_match' };
  }

  const candidates = hbxHotels.map((hotel) => scoreCandidate(googleStay, hotel)).sort((a, b) => b.confidence - a.confidence);
  const best = candidates[0];

  const isHighConfidence =
    best.nameSimilarity >= HIGH_CONFIDENCE_NAME_THRESHOLD &&
    best.distanceMeters !== undefined &&
    best.distanceMeters <= HIGH_CONFIDENCE_DISTANCE_METERS &&
    !best.flags.includes('coordinate_anomaly_suspected');

  if (isHighConfidence) {
    return { googleStay, status: 'high_confidence', bestCandidate: best };
  }

  const hasSomeSignal =
    best.flags.includes('coordinate_anomaly_suspected') ||
    best.nameSimilarity >= REVIEW_NAME_THRESHOLD ||
    (best.distanceMeters !== undefined && best.distanceMeters <= REVIEW_DISTANCE_METERS);

  if (hasSomeSignal) {
    return { googleStay, status: 'manual_review_required', bestCandidate: best };
  }

  return { googleStay, status: 'no_match', bestCandidate: best };
}

export function matchGoogleStaysToHbxHotels(googleStays: GoogleStayForMapping[], hbxHotels: HbxHotelSummary[]): HotelMatchResult[] {
  return googleStays.map((stay) => matchGoogleStayToHbxHotels(stay, hbxHotels));
}
