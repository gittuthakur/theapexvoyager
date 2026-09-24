import { hbxPricingProvider } from '../providers/hbx/hbxAvailability.service';
import { getConfirmedMapping } from './hotelMappingRegistry.service';
import type { PriceSourceState, PublicPriceQuery, StayPricingProvider, StayPricingQuery, StayPricingResult } from './stayPricing.types';

/** Every registered provider, in lookup order. Adding Booking.com/TripJack/TBO/direct-
 *  contract/manual later means registering another StayPricingProvider here — nothing
 *  else in this file, and nothing in the UI, changes. */
const PROVIDERS: StayPricingProvider[] = [hbxPricingProvider];

/** Internal/diagnostic use only (app/api/internal/hbx-diagnostic/route.ts) — returns
 *  whatever the provider actually found, evaluation rates included, with each rate's own
 *  honest `environment` tag intact. NEVER call this from a public-facing page or
 *  component; see resolvePublicPriceState below for the function every real UI must use
 *  instead. */
export async function getRawPricingResult(query: StayPricingQuery, providerId: StayPricingProvider['id'] = 'hbx'): Promise<StayPricingResult> {
  const provider = PROVIDERS.find((candidate) => candidate.id === providerId);
  if (!provider) {
    return { state: 'UNAVAILABLE', rates: [] };
  }
  return provider.getAvailability(query);
}

/**
 * THE SAFETY GATE. This is the one function any public-facing Stays page/component is
 * ever allowed to call for pricing, and the only one that takes a `googlePlaceId`
 * rather than a raw provider hotel id.
 *
 * Two independent gates, both mandatory (see the Phase-4 brief's Price Resolution
 * Rule):
 *
 *  1. CONFIRMED MAPPING REQUIRED. A provider is only ever queried once a human has
 *     explicitly confirmed a HotelProviderMapping (models/HotelProviderMapping.ts) for
 *     this exact (googlePlaceId, provider) pair — see hotelMappingRegistry.service.ts's
 *     getConfirmedMapping. No mapping, or one still PENDING_REVIEW/REJECTED/DISABLED,
 *     means PRICE_ON_REQUEST immediately, with NO provider call made at all — the fuzzy
 *     matcher never runs live against a customer's price request; it only ever runs
 *     offline (services/providers/hbx/hbxMappingCandidates.service.ts).
 *
 *  2. PRODUCTION-CAPABLE ENVIRONMENT REQUIRED. Even with a CONFIRMED mapping, this never
 *     returns VERIFIED_LIVE_RATE unless every rate a provider returned self-reports
 *     `environment === 'production'` (services/pricing/stayPricing.types.ts's
 *     NormalizedRate.environment) — an evaluation/test-environment rate is downgraded to
 *     PRICE_ON_REQUEST regardless of the mapping's confirmation status.
 *
 * Today, with only HBX evaluation credentials configured anywhere in this app, this
 * means every call returns PRICE_ON_REQUEST/UNAVAILABLE/PROVIDER_ERROR — never a price —
 * no matter how many mappings get confirmed. That is intentional: production price
 * display requires BOTH a confirmed mapping AND production-capable provider
 * credentials, never either alone.
 */
export async function resolvePublicPriceState(query: PublicPriceQuery, providerId: StayPricingProvider['id'] = 'hbx'): Promise<{ state: PriceSourceState }> {
  const mapping = await getConfirmedMapping({ googlePlaceId: query.googlePlaceId, provider: providerId });
  if (!mapping) return { state: 'PRICE_ON_REQUEST' };

  const providerQuery: StayPricingQuery = {
    destinationSlug: query.destinationSlug,
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    adults: query.adults,
    children: query.children,
    rooms: query.rooms,
    providerHotelIds: [mapping.providerHotelId]
  };

  const result = await getRawPricingResult(providerQuery, providerId);

  if (result.state === 'PROVIDER_ERROR') return { state: 'PROVIDER_ERROR' };
  if (result.state === 'UNAVAILABLE' || result.rates.length === 0) return { state: 'UNAVAILABLE' };

  const allProductionCapable = result.rates.every((rate) => rate.environment === 'production');
  if (!allProductionCapable) return { state: 'PRICE_ON_REQUEST' };

  return { state: result.state };
}
