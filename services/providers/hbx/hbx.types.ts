/** Raw HBX (Hotelbeds) wire shapes — deliberately kept separate from the
 *  supplier-agnostic services/pricing/stayPricing.types.ts contract, same reasoning as
 *  services/providers/google/google.types.ts: an HBX response-shape change must never
 *  ripple into the provider-agnostic pricing layer or UI. Only the fields this codebase
 *  actually reads are declared — HBX responses carry many more. */

export type HbxEnvironment = 'test' | 'production';

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
  rooms?: number;
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
