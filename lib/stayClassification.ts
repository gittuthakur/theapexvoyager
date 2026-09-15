import type { StayType } from '@/types/stay';

// PlaceCache's `stayType` field records which of the 6 category SEARCH QUERIES
// (lib/googlePlaces.ts's STAY_TYPE_QUERIES — "resorts and luxury lodges in X", etc.)
// happened to return this place — search-query provenance, never a verified property
// identity. Google's fuzzy text search for "resorts in Jibhi" can and does return
// plain hotels, homestays, and hostels alongside actual resorts, and the previous code
// stored every one of them with stayType='resort' regardless (lib/stays.ts's
// fetchAndCacheStayType — the doc literally sets `stayType,` from its own function
// parameter, never from the place's own data). A 2026-09 audit of the live cache found
// 640 (placeId, destinationSlug) pairs stored under 2-4 different stayType values for
// the exact same real property, and confirmed examples like "KORA SPITI" (real Google
// types: hotel, motel, private_guest_room — no resort signal at all) rendered as a
// Resort purely because the resort-category query returned it.
//
// This module is the one place that decides a property's REAL Stay type — from
// Google's own structured `types` array (Table A lodging types, already captured and
// stored on every PlaceCache doc, just never used for classification before this).
// Whichever category search discovered a place plays no part in the answer.

// Ordered most → least specific: the first group whose types intersect a property's
// real Google `types` wins. Every string below is a real Google Places (New) Table A
// lodging type actually observed in this app's live PlaceCache (audited 2026-09).
export const GOOGLE_TYPE_GROUPS: Array<{ stayType: StayType; googleTypes: string[] }> = [
  { stayType: 'resort', googleTypes: ['resort_hotel'] },
  { stayType: 'camp', googleTypes: ['campground', 'camping_cabin', 'rv_park', 'mobile_home_park'] },
  { stayType: 'cottage', googleTypes: ['cottage'] },
  { stayType: 'homestay', googleTypes: ['private_guest_room', 'guest_house', 'bed_and_breakfast', 'farmstay', 'japanese_inn', 'budget_japanese_inn'] },
  { stayType: 'hotel', googleTypes: ['hotel', 'motel', 'inn', 'lodge', 'extended_stay_hotel', 'hostel'] }
];

// No group above maps to 'treehouse' — Google Places has no structured type for a
// treehouse stay, so no property can be verified as one from provider data alone (a
// 2026-09 audit of every currently cached document confirms zero Google `types` values
// anywhere in the dataset correspond to a treehouse). Falling through to 'hotel' —
// this app's existing generic/default lodging bucket (types/stay.ts's
// CATEGORY_TO_STAY_TYPE already maps the unrelated curated categories Hostel and
// Heritage onto 'hotel' for the identical reason) — for a place whose only Google
// signal is the generic 'lodging' type, or (~91 legacy cache docs) no captured `types`
// at all. This never falsely claims verified Resort/Homestay/Cottage/Camp/Treehouse
// character for a property with no real evidence of it.
const FALLBACK_STAY_TYPE: StayType = 'hotel';

export function classifyVerifiedStayType(googleTypes: string[] | undefined): StayType {
  const types = new Set(googleTypes ?? []);
  for (const group of GOOGLE_TYPE_GROUPS) {
    if (group.googleTypes.some((t) => types.has(t))) {
      return group.stayType;
    }
  }
  return FALLBACK_STAY_TYPE;
}

// The exact same rule as classifyVerifiedStayType, expressed as a MongoDB aggregation
// expression — built from the same GOOGLE_TYPE_GROUPS constant so the two can never
// drift apart. Lets getCachedStaysCatalog (lib/stays.ts) filter/paginate at the
// database layer by the verified type instead of loading the whole cache into memory.
export function verifiedStayTypeMongoExpr(): Record<string, unknown> {
  return {
    $switch: {
      branches: GOOGLE_TYPE_GROUPS.map((group) => ({
        case: { $gt: [{ $size: { $setIntersection: [{ $ifNull: ['$types', []] }, group.googleTypes] } }, 0] },
        then: group.stayType
      })),
      default: FALLBACK_STAY_TYPE
    }
  };
}
