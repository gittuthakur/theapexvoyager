import { hbxPricingProvider } from '../providers/hbx/hbxAvailability.service';
import { getConfirmedMapping } from './hotelMappingRegistry.service';
import { getCachedAvailability, saveCachedAvailability } from './stayRateCache.service';
import type { NormalizedRate, PriceSourceState, PublicPriceQuery, PublicPriceResult, StayPricingProvider, StayPricingQuery, StayPricingResult } from './stayPricing.types';

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

/** Cache-aware version of getRawPricingResult, used only by the public resolution path
 *  below — the diagnostic route intentionally keeps calling getRawPricingResult directly
 *  so it always shows the truly-current live state, never a cached one. A cache hit
 *  short-circuits before the provider is ever called; a miss (or an expired entry) falls
 *  through to a real live call and then persists it, never caching a PROVIDER_ERROR or a
 *  sampling-mode query (see stayRateCache.service.ts). */
async function getCachedOrFreshPricingResult(query: StayPricingQuery, providerId: StayPricingProvider['id']): Promise<StayPricingResult> {
  const cached = await getCachedAvailability(query, providerId);
  if (cached) return cached;

  const fresh = await getRawPricingResult(query, providerId);
  await saveCachedAvailability(query, providerId, fresh);
  return fresh;
}

function cheapestRate(rates: NormalizedRate[]): NormalizedRate {
  return rates.reduce((min, rate) => (rate.totalStayPrice < min.totalStayPrice ? rate : min));
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
export async function resolvePublicPrice(query: PublicPriceQuery, providerId: StayPricingProvider['id'] = 'hbx'): Promise<PublicPriceResult> {
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

  const result = await getCachedOrFreshPricingResult(providerQuery, providerId);

  if (result.state === 'PROVIDER_ERROR') return { state: 'PROVIDER_ERROR' };
  if (result.state === 'UNAVAILABLE' || result.rates.length === 0) return { state: 'UNAVAILABLE' };

  const productionRates = result.rates.filter((rate) => rate.environment === 'production');
  if (productionRates.length === 0) return { state: 'PRICE_ON_REQUEST' };

  // Lowest total-stay price among production-capable rates only — never averaged, never
  // adjusted, and never picked from a non-production rate even if it happened to be
  // cheaper (TP-Stay Section 10: the two safety gates apply to which rates are eligible
  // at all, not just to the final state label).
  const rate = cheapestRate(productionRates);
  return {
    state: 'VERIFIED_LIVE_RATE',
    price: { currency: rate.currency, totalStayPrice: rate.totalStayPrice, displayPerNight: rate.displayPerNight, nightCount: rate.nightCount }
  };
}

/** Thin, backward-compatible wrapper over resolvePublicPrice for a caller that only ever
 *  needs the state label, never the amount (kept so the diagnostic-adjacent call sites
 *  that predate resolvePublicPrice don't need to change). */
export async function resolvePublicPriceState(query: PublicPriceQuery, providerId: StayPricingProvider['id'] = 'hbx'): Promise<{ state: PriceSourceState }> {
  const result = await resolvePublicPrice(query, providerId);
  return { state: result.state };
}
