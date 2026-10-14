import { vi } from 'vitest';
import type { TransportBookingContract, TransportProviderCapabilities, TransportProviderIntegrationStatus, TransportProviderQuote, TransportQuoteProvider, TransportQuoteRequest } from '../transportProvider.types';

/** Fully local, synthetic test double. Not a model of any real supplier: every value is invented for tests. */
export const ALL_CAPS: TransportProviderCapabilities = {
  liveQuotes: true,
  airportTransfers: true,
  cityTransfers: true,
  intercityOneWay: true,
  roundTrip: true,
  multiDay: true,
  himalayanRoutes: true,
  quoteRevalidation: true,
  luggageAware: true,
  booking: false,
  cancellation: false
};

export const FUTURE = '2099-01-01T00:00:00.000Z';
export const PAST = '2000-01-01T00:00:00.000Z';

export const REQUEST: TransportQuoteRequest = {
  pickup: { kind: 'CITY', id: 'chandigarh' },
  dropoff: { kind: 'CITY', id: 'manali' },
  tripType: 'ONE_WAY',
  vehicleCategory: 'sedan',
  travelDate: '2099-03-10',
  pickupTime: '08:30',
  passengers: 3
};

export function quoteFor(request: TransportQuoteRequest, overrides: Partial<TransportProviderQuote> = {}): TransportProviderQuote {
  return {
    supplierQuoteRef: 'SYNTH-1',
    pickup: request.pickup,
    dropoff: request.dropoff,
    tripType: request.tripType,
    vehicleCategory: request.vehicleCategory,
    vehicleMaxPassengers: 4,
    amountMinorUnits: 850000,
    currency: 'INR',
    inclusions: { tax: 'INCLUDED', toll: 'EXCLUDED', permit: 'UNKNOWN', surcharges: 'EXCLUDED' },
    validUntil: FUTURE,
    availability: 'AVAILABLE',
    requiresRevalidation: false,
    ...overrides
  };
}

export function syntheticProvider(
  respond: (request: TransportQuoteRequest, signal: AbortSignal) => Promise<TransportProviderQuote[]> | TransportProviderQuote[],
  options: { caps?: Partial<TransportProviderCapabilities>; status?: TransportProviderIntegrationStatus } = {}
): TransportQuoteProvider & TransportBookingContract & { createBooking: ReturnType<typeof vi.fn<TransportBookingContract['createBooking']>> } {
  return {
    id: 'synthetic',
    displayName: 'Synthetic Test Provider',
    integrationStatus: options.status ?? 'FIXTURE',
    capabilities: { ...ALL_CAPS, ...options.caps },
    searchQuotes: async (request, { signal }) => respond(request, signal),
    createBooking: vi.fn<TransportBookingContract['createBooking']>()
  };
}
