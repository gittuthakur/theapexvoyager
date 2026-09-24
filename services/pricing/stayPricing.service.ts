import { hbxPricingProvider } from '../providers/hbx/hbxAvailability.service';
import type { PriceSourceState, StayPricingProvider, StayPricingQuery, StayPricingResult } from './stayPricing.types';

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
 * ever allowed to call for pricing. It never returns VERIFIED_LIVE_RATE unless every
 * single rate a provider returned self-reports `environment === 'production'` (see
 * services/pricing/stayPricing.types.ts's NormalizedRate.environment) — an evaluation/
 * test-environment rate is downgraded to PRICE_ON_REQUEST regardless of how confident
 * the provider itself was, and the underlying test-environment rates are stripped out
 * entirely rather than passed through with a caveat. Today, with only HBX evaluation
 * credentials configured anywhere in this app, this means every call to this function
 * returns PRICE_ON_REQUEST or UNAVAILABLE/PROVIDER_ERROR — never a price — no matter
 * what the HBX evaluation account itself returns. That is intentional: this phase is
 * architecture only, not a production price-display launch. Flipping this to actually
 * show VERIFIED_LIVE_RATE requires both a production-capable provider AND explicit
 * approval to enable it — never a silent side effect of adding one.
 */
export async function resolvePublicPriceState(query: StayPricingQuery, providerId: StayPricingProvider['id'] = 'hbx'): Promise<{ state: PriceSourceState }> {
  const result = await getRawPricingResult(query, providerId);

  if (result.state === 'PROVIDER_ERROR') return { state: 'PROVIDER_ERROR' };
  if (result.state === 'UNAVAILABLE' || result.rates.length === 0) return { state: 'UNAVAILABLE' };

  const allProductionCapable = result.rates.every((rate) => rate.environment === 'production');
  if (!allProductionCapable) return { state: 'PRICE_ON_REQUEST' };

  return { state: result.state };
}
