import { hbxFetch, isHbxConfigured } from './hbx.client';
import { logHbxError } from './hbx.errors';
import { mapHbxHotelContentToSummary, type HbxHotelSummary } from './hbx.mapper';
import type { HbxHotelsResponse } from './hbx.types';

/** HBX's own daily-quota-friendly ceiling for a "sample", not a real catalog page size —
 *  see the 2026-09-24 diagnostic's Phase 4/5 note: the evaluation account is limited to
 *  ~50 requests/day, and this service exists for mapping/diagnostic use, never to mirror
 *  HBX's full hotel catalog into this app. */
const DEFAULT_SAMPLE_SIZE = 10;
const MAX_SAMPLE_SIZE = 25;

/** Fetches a small sample of HBX Hotel Content API rows for one already-verified HBX
 *  destination code (config/hbxDestinations.config.ts — never call this with a guessed
 *  code). Never throws: a misconfigured account, network failure, or HBX outage
 *  degrades to an empty array so a caller can always fail safe to "no mapping data
 *  available" rather than crash a page or diagnostic run. */
export async function getSampleHotelsForDestination(hbxDestinationCode: string, limit = DEFAULT_SAMPLE_SIZE): Promise<HbxHotelSummary[]> {
  if (!isHbxConfigured()) return [];

  const boundedLimit = Math.max(1, Math.min(limit, MAX_SAMPLE_SIZE));

  try {
    const response = await hbxFetch<HbxHotelsResponse>(
      `/hotel-content-api/1.0/hotels?fields=all&language=ENG&destinationCode=${encodeURIComponent(hbxDestinationCode)}&from=1&to=${boundedLimit}`
    );
    return (response.hotels ?? []).map(mapHbxHotelContentToSummary);
  } catch (error) {
    logHbxError(`getSampleHotelsForDestination(${hbxDestinationCode})`, error);
    return [];
  }
}
