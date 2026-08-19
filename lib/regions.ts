import { regions } from '@/config/regions.config';
import type { Region } from '@/types';

export function getAllRegions(): Region[] {
  return regions;
}

/** Exact match against `Destination.state` — mirrors the region filter already used in app/api/destinations/route.ts. */
export function getRegionForState(state?: string): Region | undefined {
  if (!state) return undefined;
  return regions.find((region) => region.name === state);
}

export function getRegionById(id: string): Region | undefined {
  return regions.find((region) => region.id === id);
}
