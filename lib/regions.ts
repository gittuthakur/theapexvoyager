import { regions } from '@/config/regions.config';
import type { Region, RegionId } from '@/types';

export function getAllRegions(): Region[] {
  return regions;
}

// The MongoDB Region Hub document's real `slug` (models/Region.ts, app/regions/[slug]/page.tsx)
// isn't always identical to this static config's `id` — today only Kashmir differs, because the
// Hub was seeded with the shorter editorial slug "kashmir" while `id` stays "jammu-kashmir" to
// match `Destination.state` derivations elsewhere. Any `/regions/[slug]` link built from a
// `RegionId` must resolve through this map rather than assume `id === slug`, or it 404s.
const REGION_HUB_SLUGS: Record<RegionId, string> = {
  'himachal-pradesh': 'himachal-pradesh',
  'jammu-kashmir': 'kashmir',
  uttarakhand: 'uttarakhand'
};

export function getRegionHubSlug(id: RegionId): string {
  return REGION_HUB_SLUGS[id] ?? id;
}

/** Exact match against `Destination.state` — mirrors the region filter already used in app/api/destinations/route.ts. */
export function getRegionForState(state?: string): Region | undefined {
  if (!state) return undefined;
  return regions.find((region) => region.name === state);
}

export function getRegionById(id: string): Region | undefined {
  return regions.find((region) => region.id === id);
}
