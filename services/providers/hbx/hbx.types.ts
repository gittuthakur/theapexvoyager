/** Raw HBX (Hotelbeds) wire shapes — deliberately kept separate from the
 *  supplier-agnostic services/pricing/stayPricing.types.ts contract, same reasoning as
 *  services/providers/google/google.types.ts: an HBX response-shape change must never
 *  ripple into the provider-agnostic pricing layer or UI. Only the fields this codebase
 *  actually reads are declared — HBX responses carry many more. */

/** 'unknown' is the fail-closed default for anything that isn't an exact match against
 *  a known evaluation origin or an explicitly approved+confirmed production origin (see
 *  hbx.client.ts's getHbxEnvironment()) — it is deliberately distinct from 'test' so a
 *  malformed/typo'd/unrecognized configuration is never conflated with the real,
 *  intentionally-configured evaluation environment. Both 'test' and 'unknown' are
 *  equally non-production to every consumer (stayPricing.service.ts's public gate only
 *  ever special-cases 'production'), so this distinction is for honest logging/
 *  diagnostics, not a second safety branch to keep in sync. */
export type HbxEnvironment = 'test' | 'unknown' | 'production';

export interface HbxDestinationZone {
  zoneCode: number;
  name: string;
}

export interface HbxDestination {
  code: string;
  name: { content: string };
  countryCode: string;
  zones?: HbxDestinationZone[];
}

export interface HbxDestinationsResponse {
  total: number;
  from: number;
  to: number;
  destinations: HbxDestination[];
}

export interface HbxHotelContent {
  code: number;
  name: { content: string };
  destinationCode: string;
  zoneCode?: number;
  categoryCode?: string;
  /** HBX nests coordinates under this object — confirmed against a real Hotel Content
   *  API response (2026-09-24 diagnostic, Woodville Palace/SLV): `{"coordinates":
   *  {"longitude":77.17934,"latitude":31.08754}}`, never flat `latitude`/`longitude`
   *  fields on the hotel itself. */
  coordinates?: { latitude: number; longitude: number };
}

export interface HbxHotelsResponse {
  total: number;
  from: number;
  to: number;
  hotels: HbxHotelContent[];
}

export interface HbxOccupancy {
  rooms: number;
  adults: number;
  children: number;
}

export interface HbxAvailabilityQuery {
  checkIn: string;
  checkOut: string;
  occupancy: HbxOccupancy;
  hotelCodes: number[];
}

export interface HbxCancellationPolicy {
  amount: string;
  from: string;
}

export interface HbxRate {
  rateKey?: string;
  boardCode?: string;
  boardName?: string;
  rateClass?: string;
  rateType?: string;
  net: string;
  /** Occupancy ECHO of the request (rooms/adults/children the caller asked for) — this
   *  always equals the caller's own query and is NOT the supplier's remaining
   *  availability count. See `allotment` below for that. Confirmed against a real
   *  response (2026-09-24 Phase-7 audit): a request for `rooms: 1` returned
   *  `"rooms": 1, "allotment": 2` on the same rate object — two different numbers with
   *  two different meanings. */
  rooms?: number;
  /** The supplier's actual remaining bookable quantity at this rate — this is what
   *  `NormalizedRate.roomsRemaining` must be derived from, never `rooms` above. */
  allotment?: number;
  cancellationPolicies?: HbxCancellationPolicy[];
}

export interface HbxRoom {
  code?: string;
  name?: string;
  rates: HbxRate[];
}

export interface HbxAvailabilityHotel {
  code: number;
  name?: string;
  currency: string;
  rooms: HbxRoom[];
}

export interface HbxAvailabilityResponse {
  hotels?: {
    hotels: HbxAvailabilityHotel[];
  };
}
