import { isValidCalendarDateISO } from '@/lib/dateValidation';
import type {
  TransportLocationRef,
  TransportProviderErrorCode,
  TransportProviderQuote,
  TransportQuoteInclusions,
  TransportQuoteProvider,
  TransportQuoteRequest
} from './transportProvider.types';
import { TransportProviderError } from './transportProvider.types';

/**
 * T1 — server-only. Validates and contains whatever a TransportQuoteProvider returns. It never
 * throws, never calls a booking method, reads no credentials and talks to nothing itself: the
 * provider object passed in does any I/O. No real provider is registered (see
 * getRegisteredTransportProviders), so nothing in the website calls a supplier today.
 */

export const EXPECTED_CURRENCY = 'INR';
export const DEFAULT_PROVIDER_TIMEOUT_MS = 8000;
const MAX_PUBLIC_QUOTES = 5;

/** Intentionally empty: adding a provider requires supplier documentation, written permission and review (T2). */
export function getRegisteredTransportProviders(): readonly TransportQuoteProvider[] {
  return [];
}

export type QuoteRejectionReason =
  | 'EXPIRED'
  | 'CURRENCY_MISMATCH'
  | 'CAPACITY_MISMATCH'
  | 'ROUTE_MISMATCH'
  | 'TRIP_TYPE_MISMATCH'
  | 'VEHICLE_MISMATCH'
  | 'INVALID_AMOUNT'
  | 'INVALID_QUOTE'
  | 'DUPLICATE'
  | 'UNAVAILABLE';

export type UnsupportedReason = 'NO_LIVE_QUOTES' | 'TRIP_TYPE' | 'HIMALAYAN_ROUTE' | 'LOCATION_KIND' | 'INVALID_REQUEST';

export interface ValidatedTransportQuote {
  supplierQuoteRef: string;
  amountMinorUnits: number;
  currency: 'INR';
  inclusions: TransportQuoteInclusions;
  surchargesMinorUnits?: number;
  validUntil: string;
  requiresRevalidation: boolean;
  /** AVAILABLE quotes are bookable-in-principle; ON_REQUEST means the supplier has not verified availability. */
  availability: 'AVAILABLE' | 'ON_REQUEST';
}

export type ProviderQuoteOutcome =
  | {
      kind: 'QUOTES';
      /** 'LIVE' only for an AUTHORIZED_LIVE integration. A FIXTURE or SANDBOX provider yields 'NON_LIVE', which the presentation layer never shows as a live price. */
      origin: 'LIVE' | 'NON_LIVE';
      providerId: string;
      quotes: ValidatedTransportQuote[];
      rejected: Array<{ reason: QuoteRejectionReason }>;
    }
  | { kind: 'UNAVAILABLE'; providerId: string; rejected: Array<{ reason: QuoteRejectionReason }> }
  | { kind: 'UNSUPPORTED'; providerId: string; reason: UnsupportedReason }
  | { kind: 'ERROR'; providerId: string; code: TransportProviderErrorCode };

/** Reasons a provider cannot be asked at all (explicit capability flags), or null when it can. */
export function unsupportedReason(provider: Pick<TransportQuoteProvider, 'capabilities'>, request: TransportQuoteRequest, isHimalayan = false): UnsupportedReason | null {
  const caps = provider.capabilities;
  if (
    !isValidCalendarDateISO(request.travelDate) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(request.pickupTime) ||
    !Number.isInteger(request.passengers) ||
    request.passengers < 1 ||
    (request.tripType === 'MULTI_DAY' && !(Number.isInteger(request.tripDays) && (request.tripDays as number) >= 2))
  ) {
    return 'INVALID_REQUEST';
  }
  if (!caps.liveQuotes) return 'NO_LIVE_QUOTES';
  if (request.tripType === 'ONE_WAY' && !(caps.intercityOneWay || caps.airportTransfers || caps.cityTransfers)) return 'TRIP_TYPE';
  if (request.tripType === 'ROUND_TRIP' && !caps.roundTrip) return 'TRIP_TYPE';
  if (request.tripType === 'MULTI_DAY' && !caps.multiDay) return 'TRIP_TYPE';
  const kinds = [request.pickup.kind, request.dropoff.kind];
  if (kinds.includes('AIRPORT') && !caps.airportTransfers) return 'LOCATION_KIND';
  if (kinds.some((kind) => kind === 'CITY' || kind === 'ADDRESS' || kind === 'RAILWAY_STATION') && !kinds.includes('AIRPORT') && !(caps.cityTransfers || caps.intercityOneWay)) {
    return 'LOCATION_KIND';
  }
  if (isHimalayan && !caps.himalayanRoutes) return 'HIMALAYAN_ROUTE';
  return null;
}

/** Same kind AND same id: an airport is never the city it serves, and direction matters. */
export function sameLocation(a: TransportLocationRef, b: TransportLocationRef): boolean {
  return a.kind === b.kind && a.id === b.id;
}

function validateQuote(quote: TransportProviderQuote, request: TransportQuoteRequest, now: Date): QuoteRejectionReason | null {
  if (!quote || typeof quote.supplierQuoteRef !== 'string' || !quote.supplierQuoteRef) return 'INVALID_QUOTE';
  if (!sameLocation(quote.pickup, request.pickup) || !sameLocation(quote.dropoff, request.dropoff)) return 'ROUTE_MISMATCH';
  if (quote.tripType !== request.tripType) return 'TRIP_TYPE_MISMATCH';
  if (quote.vehicleCategory !== request.vehicleCategory) return 'VEHICLE_MISMATCH';
  if (quote.currency !== EXPECTED_CURRENCY) return 'CURRENCY_MISMATCH';
  if (!Number.isInteger(quote.amountMinorUnits) || quote.amountMinorUnits <= 0) return 'INVALID_AMOUNT';
  if (quote.surchargesMinorUnits !== undefined && (!Number.isInteger(quote.surchargesMinorUnits) || quote.surchargesMinorUnits < 0)) return 'INVALID_AMOUNT';
  if (!Number.isInteger(quote.vehicleMaxPassengers) || quote.vehicleMaxPassengers < request.passengers) return 'CAPACITY_MISMATCH';
  const expiry = Date.parse(quote.validUntil);
  if (!Number.isFinite(expiry)) return 'INVALID_QUOTE';
  if (expiry <= now.getTime()) return 'EXPIRED';
  if (quote.availability === 'UNAVAILABLE') return 'UNAVAILABLE';
  if (quote.availability !== 'AVAILABLE' && quote.availability !== 'ON_REQUEST') return 'INVALID_QUOTE';
  return null;
}

function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TransportProviderError('TIMEOUT'));
    }, timeoutMs);
  });
  return Promise.race([run(controller.signal), timeout]).finally(() => clearTimeout(timer));
}

export interface SearchProviderQuotesOptions {
  timeoutMs?: number;
  now?: Date;
  /** Whether the route is a remote Himalayan route (from our own route catalog), for the capability check. */
  isHimalayan?: boolean;
}

/** Asks one provider for quotes and returns ONLY validated, de-duplicated, safe results. Never throws. */
export async function searchProviderQuotes(provider: TransportQuoteProvider, request: TransportQuoteRequest, options: SearchProviderQuotesOptions = {}): Promise<ProviderQuoteOutcome> {
  const now = options.now ?? new Date();
  const unsupported = unsupportedReason(provider, request, options.isHimalayan);
  if (unsupported) return { kind: 'UNSUPPORTED', providerId: provider.id, reason: unsupported };

  let raw: TransportProviderQuote[];
  try {
    raw = await withTimeout((signal) => provider.searchQuotes(request, { signal }), options.timeoutMs ?? DEFAULT_PROVIDER_TIMEOUT_MS);
  } catch (error) {
    const code: TransportProviderErrorCode = error instanceof TransportProviderError ? error.code : 'UPSTREAM_ERROR';
    // Only the code is logged: never the supplier's message, which could carry private data.
    console.error('[transportProvider] quote search failed', provider.id, code);
    if (code === 'UNSUPPORTED_ROUTE') return { kind: 'UNSUPPORTED', providerId: provider.id, reason: 'HIMALAYAN_ROUTE' };
    return { kind: 'ERROR', providerId: provider.id, code };
  }
  if (!Array.isArray(raw)) return { kind: 'ERROR', providerId: provider.id, code: 'INVALID_RESPONSE' };

  const rejected: Array<{ reason: QuoteRejectionReason }> = [];
  const seen = new Set<string>();
  const valid: ValidatedTransportQuote[] = [];
  for (const quote of raw) {
    const reason = validateQuote(quote, request, now);
    if (reason) {
      rejected.push({ reason });
      continue;
    }
    if (seen.has(quote.supplierQuoteRef)) {
      rejected.push({ reason: 'DUPLICATE' });
      continue;
    }
    seen.add(quote.supplierQuoteRef);
    valid.push({
      supplierQuoteRef: quote.supplierQuoteRef,
      amountMinorUnits: quote.amountMinorUnits,
      currency: 'INR',
      inclusions: { ...quote.inclusions },
      surchargesMinorUnits: quote.surchargesMinorUnits,
      validUntil: new Date(quote.validUntil).toISOString(),
      // A luggage-unaware provider cannot vouch for the luggage asked: force revalidation rather than imply it can.
      requiresRevalidation: quote.requiresRevalidation || (request.luggage !== undefined && !provider.capabilities.luggageAware),
      availability: quote.availability as 'AVAILABLE' | 'ON_REQUEST'
    });
  }
  if (valid.length === 0) return { kind: 'UNAVAILABLE', providerId: provider.id, rejected };

  valid.sort((a, b) => a.amountMinorUnits - b.amountMinorUnits);
  return {
    kind: 'QUOTES',
    origin: provider.integrationStatus === 'AUTHORIZED_LIVE' ? 'LIVE' : 'NON_LIVE',
    providerId: provider.id,
    quotes: valid.slice(0, MAX_PUBLIC_QUOTES),
    rejected
  };
}
