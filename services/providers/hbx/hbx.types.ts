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

// ============================================================================
// Single-hotel Content detail — GET /hotel-content-api/1.0/hotels/{code}/details.
// Confirmed against a real captured response (2026-09-28 certification-readiness
// verification, hotel 617065/White Meadows Manali) — only the fields this codebase
// actually reads are declared; the real response carries many more (rooms, facilities,
// images, etc.), deliberately not modelled here per the "no full catalogue mirror" scope.
// ============================================================================

export interface HbxHotelPhone {
  phoneNumber: string;
  phoneType: string;
}

export interface HbxHotelDetail {
  code: number;
  name: { content: string };
  address?: { content?: string };
  city?: { content?: string };
  postalCode?: string;
  category?: { description?: { content?: string } };
  destination?: { name?: { content?: string } };
  phones?: HbxHotelPhone[];
}

export interface HbxHotelDetailResponse {
  hotel: HbxHotelDetail;
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
  /** Availability typically returns only this id (a reference to resolve elsewhere) —
   *  never the full text. CheckRate/Booking/Booking Detail may instead (or also) return
   *  the resolved `rateComments` text directly. This codebase preserves whichever of the
   *  two fields HBX actually sent at each stage and never resolves one from the other or
   *  invents comment text. */
  rateCommentsId?: string;
  rateComments?: string;
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

// ============================================================================
// CheckRate — POST /hotel-api/1.0/checkrates. Real Hotelbeds contract: takes the
// already-quoted rateKey(s) from an Availability response and returns a single,
// revalidated hotel object (not an array) — a rate is either still bookable at the
// re-checked price/conditions, or the call fails/returns something that must never be
// silently substituted for the original rate.
// ============================================================================

export interface HbxCheckRateRoomRequest {
  rateKey: string;
}

export interface HbxCheckRateRequestBody {
  rooms: HbxCheckRateRoomRequest[];
}

export interface HbxCheckRateResponse {
  hotel: HbxAvailabilityHotel;
}

// ============================================================================
// Booking — POST /hotel-api/1.0/bookings, GET /hotel-api/1.0/bookings/{reference},
// DELETE /hotel-api/1.0/bookings/{reference}.
// ============================================================================

export interface HbxHolder {
  name: string;
  surname: string;
}

/** One passenger on one room. `roomId` is the 1-based index of the room this pax belongs
 *  to within the booking request's own `rooms` array — required by Hotelbeds so a
 *  multi-room booking can assign each passenger to the correct room. `age` is required
 *  for `type: 'CH'` (a child), never invented or defaulted for one.
 *
 *  `name`/`surname` are typed optional here (Hotelbeds' own Availability/CheckRate rate
 *  objects can echo a pax without them), but a real Hotelbeds Booking Confirmation call
 *  rejects an adult pax with neither — confirmed directly against a real HTTP 400
 *  ("An adult name must be reported for each room.") during the 2026-09-28
 *  certification-readiness verification. Every caller of
 *  services/providers/hbx/hbxBooking.service.ts's createHbxBooking must supply both for
 *  every adult pax. */
export interface HbxPax {
  roomId: number;
  type: 'AD' | 'CH';
  age?: number;
  name?: string;
  surname?: string;
}

export interface HbxBookingRoomRequest {
  rateKey: string;
  paxes: HbxPax[];
}

export interface HbxBookingRequestBody {
  holder: HbxHolder;
  rooms: HbxBookingRoomRequest[];
  /** Confirmed via a real HTTP 400 ("Attribute size must be between 1 and 20.") during
   *  the 2026-09-28 certification-readiness verification — Hotelbeds rejects anything
   *  outside 1-20 characters. Callers must keep their own reference generation within
   *  this limit. */
  clientReference: string;
  sourceMarket: string;
  remark?: string;
  tolerance?: number;
}

/** Confirmed against a real captured Hotelbeds TEST booking response (2026-09-28
 *  certification-readiness verification): the rate/board/comments/cancellation data
 *  lives one level DEEPER than the room object itself, under `room.rates[]` — NOT
 *  flattened onto the room the way an initial guess (mirroring HbxRoom's Availability
 *  shape) would suggest. A confirmed booking's room always has exactly one rate. No
 *  `rateKey` appears anywhere in a Booking/Booking-Detail/Cancellation response — it is
 *  only ever meaningful pre-booking (Availability/CheckRate). */
export interface HbxBookingRoomRate {
  rateClass?: string;
  net: string;
  rateComments?: string;
  rateCommentsId?: string;
  paymentType?: string;
  boardCode?: string;
  boardName?: string;
  cancellationPolicies?: HbxCancellationPolicy[];
  rooms?: number;
  adults?: number;
  children?: number;
}

export interface HbxBookingHotelRoom {
  status?: string;
  id?: number;
  code?: string;
  name?: string;
  paxes?: HbxPax[];
  rates: HbxBookingRoomRate[];
}

/** The genuine, identifiable supplier fulfilling this booking — required on a voucher,
 *  confirmed present on both the Booking and Cancellation responses. */
export interface HbxBookingSupplier {
  name: string;
  vatNumber?: string;
}

export interface HbxBookingHotel {
  code: number;
  name?: string;
  currency: string;
  checkIn?: string;
  checkOut?: string;
  rooms: HbxBookingHotelRoom[];
  totalNet?: string;
  supplier?: HbxBookingSupplier;
}

export interface HbxBooking {
  reference: string;
  /** Present only on a Cancellation response. */
  cancellationReference?: string;
  clientReference?: string;
  creationDate?: string;
  status: string;
  holder: HbxHolder;
  hotel: HbxBookingHotel;
  totalNet?: string;
  currency?: string;
}

export interface HbxBookingResponse {
  booking: HbxBooking;
}
