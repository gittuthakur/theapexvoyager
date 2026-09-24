/** Supplier-agnostic pricing contract. Nothing in the UI (or anywhere outside
 *  services/providers/*) should ever import a provider-specific type — a future
 *  Booking.com/TripJack/TBO/direct-contract/manual-rate provider must be able to plug in
 *  here without the UI knowing it exists, exactly the same way the UI never needs to
 *  know HBX authentication works. */

export type StayPricingProviderId = 'hbx' | 'booking' | 'tripjack' | 'tbo' | 'direct-contract' | 'manual';

// Mirrors services/providers/hbx/hbx.types.ts's own HbxEnvironment exactly (a
// pre-existing duplication, not introduced by this change) — kept in sync here because
// NormalizedRate.environment below is typed against this declaration, not that one.
// 'unknown' is the fail-closed default for anything not an exact match against a known
// evaluation origin or an approved+confirmed production origin (see hbx.client.ts's
// getHbxEnvironment()) — never assignable to 'production'.
export type HbxEnvironment = 'test' | 'unknown' | 'production';

export interface CancellationPolicy {
  /** Amount charged if cancelled on/after `chargeFrom` — same currency as the rate. */
  chargeAmount: string;
  /** ISO timestamp: free cancellation before this, the charge applies from here on. */
  chargeFrom: string;
}

/** One bookable room+board combination, already flattened out of whatever nested shape
 *  the source provider returned (see services/providers/hbx/hbx.mapper.ts). */
export interface NormalizedRate {
  provider: StayPricingProviderId;
  /** The provider's own hotel identifier — an HBX numeric code as a string today. */
  providerHotelId: string;
  /** Exactly as returned by the provider — never assumed, never converted. HBX's
   *  evaluation environment returns EUR, not INR; do not hard-code a currency anywhere
   *  downstream of this. */
  currency: string;
  totalStayPrice: number;
  nightCount: number;
  /** totalStayPrice / nightCount, rounded to 2dp — a diagnostic convenience value only,
   *  never itself sent back to a provider or treated as an authoritative nightly rate. */
  displayPerNight: number;
  roomName?: string;
  roomCode?: string;
  boardName?: string;
  rateType?: string;
  /** `undefined` when the provider gave no cancellation policy to infer from — never
   *  defaulted to true or false. See hbx.mapper.ts's isRefundable(). */
  refundable?: boolean;
  /** Every tier the supplier returned, in source order — never truncated to one (see
   *  hbx.mapper.ts's mapCancellationPolicies(), fixed 2026-09-26 Phase-8: HBX can
   *  return several tiers, e.g. free -> 50% -> 100%, and keeping only the first
   *  silently discarded the rest). Empty array when the supplier gave none — never
   *  invented. */
  cancellationPolicies: CancellationPolicy[];
  roomsRemaining?: number;
  lastCheckedAt: string;
  /** Which supplier environment produced this rate — 'test'/'unknown' must never reach
   *  resolvePublicPriceState's production check (`rate.environment === 'production'`,
   *  stayPricing.service.ts); only an environment explicitly classified 'production' by
   *  hbx.client.ts's fail-closed getHbxEnvironment() can. */
  environment: HbxEnvironment;
}

/** The five UI-facing price states from the Phase-2 brief. Only PRICE_ON_REQUEST and
 *  UNAVAILABLE/PROVIDER_ERROR are ever actually returned to a public caller today (see
 *  stayPricing.service.ts's resolvePublicPriceState) — VERIFIED_LIVE_RATE and
 *  VERIFIED_MANUAL_RATE exist so the type is ready the day a production-capable
 *  provider or a real manual rate is connected, without a breaking change here. */
export type PriceSourceState = 'VERIFIED_LIVE_RATE' | 'VERIFIED_MANUAL_RATE' | 'PRICE_ON_REQUEST' | 'UNAVAILABLE' | 'PROVIDER_ERROR';

export interface StayPricingQuery {
  /** config/destinations.config.ts slug — resolved to a provider-specific destination
   *  code internally (e.g. config/hbxDestinations.config.ts for HBX); callers never
   *  pass a provider code directly. */
  destinationSlug: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  /** Provider-specific hotel identifiers to check, when already known (e.g. from a
   *  prior hotel-mapping pass) — when omitted, a provider is free to sample its own
   *  small default set for the destination. */
  providerHotelIds?: string[];
}

export interface StayPricingResult {
  state: PriceSourceState;
  rates: NormalizedRate[];
  /** Present only on PROVIDER_ERROR — a short, secret-free description for logs/
   *  diagnostics; never shown verbatim to a visitor. */
  error?: string;
}

/** One pluggable pricing source. HBX is the first (and today, only) implementation —
 *  see services/providers/hbx/hbxAvailability.service.ts. */
export interface StayPricingProvider {
  id: StayPricingProviderId;
  getAvailability(query: StayPricingQuery): Promise<StayPricingResult>;
}

/**
 * What a real customer-facing price request is allowed to carry — deliberately NOT a
 * StayPricingQuery: it identifies a Google property by `googlePlaceId`, never a raw
 * provider hotel id. See stayPricing.service.ts's resolvePublicPriceState: a provider
 * hotel id may only ever come from an already-CONFIRMED HotelProviderMapping row
 * (models/HotelProviderMapping.ts), resolved server-side — never supplied by the caller
 * and never derived by running the fuzzy matcher live against a customer's request.
 */
export interface PublicPriceQuery {
  googlePlaceId: string;
  destinationSlug: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
}
