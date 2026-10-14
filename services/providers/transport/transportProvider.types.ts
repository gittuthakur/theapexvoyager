/**
 * T1 — server-only contract for a FUTURE authorized B2B cab supplier API.
 *
 * NO SUPPLIER IS APPROVED OR CONNECTED. This file defines only OUR side of the seam: what the
 * website needs from any supplier. It deliberately contains no supplier endpoint, auth method,
 * request/response schema, error code or booking policy — each real adapter (T2) maps its own
 * documented API onto these types, and none may be written before that documentation and
 * commercial permission exist. Never import this module from a client component; the public
 * surface is lib/transportPriceState.ts, which carries only customer-safe fields.
 */

export type TransportTripType = 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_DAY';

/**
 * 'FIXTURE' (local synthetic test data) and 'SANDBOX' (a supplier test environment) can NEVER
 * produce a customer-visible live quote. Only 'AUTHORIZED_LIVE' — set by a reviewed adapter after
 * written supplier permission — can.
 */
export type TransportProviderIntegrationStatus = 'FIXTURE' | 'SANDBOX' | 'AUTHORIZED_LIVE';

/** Explicit per-supplier capabilities: a supplier may do airport transfers but not multi-day Himalayan journeys. */
export interface TransportProviderCapabilities {
  liveQuotes: boolean;
  airportTransfers: boolean;
  cityTransfers: boolean;
  intercityOneWay: boolean;
  roundTrip: boolean;
  multiDay: boolean;
  himalayanRoutes: boolean;
  /** Quote can be re-checked with the supplier before booking. */
  quoteRevalidation: boolean;
  /** Supplier prices luggage; when false the request's luggage cannot be honoured and is not claimed to be. */
  luggageAware: boolean;
  /** FUTURE: supplier can create bookings. No code path calls it in T1 (see TransportBookingContract). */
  booking: boolean;
  cancellation: boolean;
}

/** An airport and the city it serves are DIFFERENT places: kinds are never interchangeable. */
export type TransportLocationKind = 'AIRPORT' | 'CITY' | 'RAILWAY_STATION' | 'ADDRESS';

export interface TransportLocationRef {
  kind: TransportLocationKind;
  /** Our own stable id (e.g. TransportRoute endpoint / destination slug) or a supplier-mapped id. */
  id: string;
  label?: string;
}

export interface TransportQuoteRequest {
  pickup: TransportLocationRef;
  dropoff: TransportLocationRef;
  tripType: TransportTripType;
  vehicleCategory: string;
  /** ISO YYYY-MM-DD, judged in IST like the rest of the site. */
  travelDate: string;
  /** 24h HH:mm local pickup time. */
  pickupTime: string;
  passengers: number;
  luggage?: { large: number; small: number };
  /** Required for MULTI_DAY. */
  tripDays?: number;
}

export type TransportInclusion = 'INCLUDED' | 'EXCLUDED' | 'UNKNOWN';

export interface TransportQuoteInclusions {
  tax: TransportInclusion;
  toll: TransportInclusion;
  permit: TransportInclusion;
  surcharges: TransportInclusion;
}

export type TransportSupplierAvailability = 'AVAILABLE' | 'ON_REQUEST' | 'UNAVAILABLE';

/**
 * One quote as an adapter reports it. UNTRUSTED until validated by searchProviderQuotes
 * (services/providers/transport/transportProvider.service.ts) — a provider's data is never shown as-is.
 */
export interface TransportProviderQuote {
  /** The supplier's own reference. PRIVATE: never sent to a browser. */
  supplierQuoteRef: string;
  pickup: TransportLocationRef;
  dropoff: TransportLocationRef;
  tripType: TransportTripType;
  vehicleCategory: string;
  vehicleMaxPassengers: number;
  /** Integer minor units (paise for INR). */
  amountMinorUnits: number;
  currency: string;
  inclusions: TransportQuoteInclusions;
  /** Surcharges the supplier lists separately, in the same currency; informational disclosure only. */
  surchargesMinorUnits?: number;
  /** ISO timestamp after which the price must not be shown or used. */
  validUntil: string;
  availability: TransportSupplierAvailability;
  /** True when the price must be re-confirmed with the supplier before it may be relied on for a booking. */
  requiresRevalidation: boolean;
}

export type TransportProviderErrorCode = 'TIMEOUT' | 'RATE_LIMITED' | 'UNAUTHORIZED' | 'UPSTREAM_ERROR' | 'UNSUPPORTED_ROUTE' | 'INVALID_RESPONSE';

/** An adapter throws this (or anything else — all failures are contained by the service). */
export class TransportProviderError extends Error {
  constructor(
    public readonly code: TransportProviderErrorCode,
    message?: string
  ) {
    super(message ?? code);
    this.name = 'TransportProviderError';
  }
}

export interface TransportProviderCallOptions {
  signal: AbortSignal;
}

export interface TransportQuoteProvider {
  /** Stable internal id, never shown to customers. */
  readonly id: string;
  readonly displayName: string;
  readonly integrationStatus: TransportProviderIntegrationStatus;
  readonly capabilities: TransportProviderCapabilities;
  searchQuotes(request: TransportQuoteRequest, options: TransportProviderCallOptions): Promise<TransportProviderQuote[]>;
  /** Present only when capabilities.quoteRevalidation. */
  revalidateQuote?(supplierQuoteRef: string, options: TransportProviderCallOptions): Promise<TransportProviderQuote | null>;
}

/**
 * FUTURE, MOCK-ONLY booking contract. Nothing implements or calls it against a real supplier in T1.
 * A booking can only ever be CONFIRMED by a supplier confirmation that a reviewed adapter has verified;
 * `confirmedBySupplier` has no default and no code path sets it in T1. Payment is out of scope entirely.
 */
export type TransportBookingState = 'NOT_REQUESTED' | 'REQUESTED_PENDING_SUPPLIER' | 'CONFIRMED_BY_SUPPLIER' | 'REJECTED' | 'FAILED';

export interface TransportBookingRequest {
  /** A quote that passed validation AND was revalidated when the provider requires it. */
  quoteId: string;
  leadId: string;
  idempotencyKey: string;
}

export interface TransportBookingResult {
  state: TransportBookingState;
  /** Private supplier booking reference; set only for CONFIRMED_BY_SUPPLIER. */
  supplierBookingRef?: string;
}

export interface TransportBookingContract {
  createBooking(request: TransportBookingRequest, options: TransportProviderCallOptions): Promise<TransportBookingResult>;
}
