import { hbxFetch, isHbxConfigured } from './hbx.client';
import { logHbxError } from './hbx.errors';
import { mapHbxHotelContentToSummary, type HbxHotelSummary } from './hbx.mapper';
import type { HbxHotelsResponse, HbxHotelDetailResponse } from './hbx.types';

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

export interface HotelContentDetailSummary {
  hbxCode: number;
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  categoryDescription?: string;
  destinationName?: string;
  /** Prefers a PHONEHOTEL/PHONEBOOKING entry over a fax number, when more than one
   *  phone is listed — never invents one when HBX returns none. */
  phone?: string;
}

/** Single-hotel Content detail — GET /hotel-content-api/1.0/hotels/{code}/details.
 *  Confirmed against a real captured response (2026-09-28 certification-readiness
 *  verification). Used only to fill in voucher fields (address/phone/category/
 *  destination) that a Booking Confirmation response doesn't itself carry — never to
 *  build a general hotel-content catalogue. Never throws: degrades to `null` on any
 *  failure so a voucher can still render with whatever it already has. */
export async function getHotelContentDetail(hbxCode: number): Promise<HotelContentDetailSummary | null> {
  if (!isHbxConfigured()) return null;

  try {
    const response = await hbxFetch<HbxHotelDetailResponse>(`/hotel-content-api/1.0/hotels/${hbxCode}/details?language=ENG`);
    const { hotel } = response;
    const phone = hotel.phones?.find((p) => p.phoneType === 'PHONEHOTEL' || p.phoneType === 'PHONEBOOKING')?.phoneNumber ?? hotel.phones?.[0]?.phoneNumber;
    return {
      hbxCode: hotel.code,
      name: hotel.name?.content ?? 'Unnamed property',
      address: hotel.address?.content,
      city: hotel.city?.content,
      postalCode: hotel.postalCode,
      categoryDescription: hotel.category?.description?.content,
      destinationName: hotel.destination?.name?.content,
      phone
    };
  } catch (error) {
    logHbxError(`getHotelContentDetail(${hbxCode})`, error);
    return null;
  }
}
