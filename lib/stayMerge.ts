import { CATEGORY_TO_STAY_TYPE, type Stay } from '@/types/stay';
import type { HotelPackage } from '@/types/hotel';

// Shared curated-Hotel ↔ Google-Stay merge helpers — used by the client StaysGrid
// (one destination's own "Where to stay" section) AND by server-rendered
// cross-destination listings (app/stays/[...segments]'s 'type' kind, app/stays/search).
// Kept in a plain module (not components/modules/StaysGrid.tsx, which is 'use client')
// because React Server Components cannot call a plain function exported from a
// client-marked file — only render its components as JSX.

export function hotelToStay(hotel: HotelPackage, destinationSlug?: string): Stay {
  return {
    placeId: `curated:${hotel.slug}`,
    name: hotel.title,
    slug: hotel.slug,
    stayType: CATEGORY_TO_STAY_TYPE[hotel.category],
    formattedAddress: hotel.location,
    rating: hotel.rating,
    userRatingCount: hotel.reviewCount,
    photos: hotel.images,
    customPrice: hotel.pricePerNight,
    destinationSlug: destinationSlug ?? hotel.slug,
    source: 'curated'
  };
}

function identityKey(name: string, address: string | undefined): string {
  return `${name.trim().toLowerCase()}|${(address ?? '').trim().toLowerCase()}`;
}

/** Excludes any Google Places result that's an exact (not fuzzy) name+address match for
 *  a curated stay already shown — a curated listing and a live Places result for the
 *  same real property should never both render as separate cards. Deliberately does
 *  NOT use substring/`includes()` matching (too easy to falsely collapse two distinct
 *  properties with related names) — see AGENTS.md Phase B section 19. */
export function dedupeAgainstCurated(curated: Stay[], google: Stay[]): Stay[] {
  const curatedKeys = new Set(curated.map((stay) => identityKey(stay.name, stay.formattedAddress)));
  return google.filter((stay) => !curatedKeys.has(identityKey(stay.name, stay.formattedAddress)));
}
