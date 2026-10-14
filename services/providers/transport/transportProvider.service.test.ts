import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { getRegisteredTransportProviders, searchProviderQuotes, sameLocation, unsupportedReason } from './transportProvider.service';
import { TransportProviderError, type TransportQuoteRequest } from './transportProvider.types';
import { FUTURE, PAST, REQUEST, quoteFor, syntheticProvider } from './__fixtures__/syntheticProvider';
import { presentExistingPriceResponse, presentProviderOutcome, type PresentableProviderOutcome } from '@/lib/transportPriceState';

const LIVE = { status: 'AUTHORIZED_LIVE' as const };

describe('searchProviderQuotes', () => {
  it('returns a validated live quote from an AUTHORIZED_LIVE provider', async () => {
    const provider = syntheticProvider((r) => [quoteFor(r)], LIVE);
    const outcome = await searchProviderQuotes(provider, REQUEST);
    expect(outcome).toMatchObject({ kind: 'QUOTES', origin: 'LIVE' });
    if (outcome.kind === 'QUOTES') expect(outcome.quotes[0]).toMatchObject({ amountMinorUnits: 850000, currency: 'INR' });
  });

  it('a FIXTURE or SANDBOX provider is NON_LIVE', async () => {
    for (const status of ['FIXTURE', 'SANDBOX'] as const) {
      const outcome = await searchProviderQuotes(syntheticProvider((r) => [quoteFor(r)], { status }), REQUEST);
      expect(outcome).toMatchObject({ kind: 'QUOTES', origin: 'NON_LIVE' });
    }
  });

  it('rejects an expired quote', async () => {
    const outcome = await searchProviderQuotes(syntheticProvider((r) => [quoteFor(r, { validUntil: PAST })], LIVE), REQUEST);
    expect(outcome).toEqual({ kind: 'UNAVAILABLE', providerId: 'synthetic', rejected: [{ reason: 'EXPIRED' }] });
  });

  it('a quote expiring exactly now is expired', async () => {
    const now = new Date('2099-01-01T00:00:00.000Z');
    const outcome = await searchProviderQuotes(syntheticProvider((r) => [quoteFor(r, { validUntil: FUTURE })], LIVE), REQUEST, { now });
    expect(outcome.kind).toBe('UNAVAILABLE');
  });

  it('reports no supplier availability for an empty response and for an UNAVAILABLE quote', async () => {
    expect((await searchProviderQuotes(syntheticProvider(() => [], LIVE), REQUEST)).kind).toBe('UNAVAILABLE');
    const outcome = await searchProviderQuotes(syntheticProvider((r) => [quoteFor(r, { availability: 'UNAVAILABLE' })], LIVE), REQUEST);
    expect(outcome).toMatchObject({ kind: 'UNAVAILABLE', rejected: [{ reason: 'UNAVAILABLE' }] });
  });

  it('does not ask a provider without Himalayan capability about a Himalayan route', async () => {
    const respond = vi.fn(() => []);
    const outcome = await searchProviderQuotes(syntheticProvider(respond, { ...LIVE, caps: { himalayanRoutes: false } }), REQUEST, { isHimalayan: true });
    expect(outcome).toEqual({ kind: 'UNSUPPORTED', providerId: 'synthetic', reason: 'HIMALAYAN_ROUTE' });
    expect(respond).not.toHaveBeenCalled();
  });

  it('maps a provider-declared unsupported route to UNSUPPORTED', async () => {
    const provider = syntheticProvider(() => Promise.reject(new TransportProviderError('UNSUPPORTED_ROUTE')), LIVE);
    expect((await searchProviderQuotes(provider, REQUEST)).kind).toBe('UNSUPPORTED');
  });

  it('rejects a vehicle that cannot carry the passengers', async () => {
    const request = { ...REQUEST, passengers: 5 };
    const outcome = await searchProviderQuotes(syntheticProvider((r) => [quoteFor(r, { vehicleMaxPassengers: 4 })], LIVE), request);
    expect(outcome).toMatchObject({ kind: 'UNAVAILABLE', rejected: [{ reason: 'CAPACITY_MISMATCH' }] });
  });

  it('rejects a non-INR currency instead of converting it', async () => {
    const outcome = await searchProviderQuotes(syntheticProvider((r) => [quoteFor(r, { currency: 'USD' })], LIVE), REQUEST);
    expect(outcome).toMatchObject({ kind: 'UNAVAILABLE', rejected: [{ reason: 'CURRENCY_MISMATCH' }] });
  });

  it('rejects fractional, zero and negative amounts', async () => {
    for (const amountMinorUnits of [100.5, 0, -5, Number.NaN]) {
      const outcome = await searchProviderQuotes(syntheticProvider((r) => [quoteFor(r, { amountMinorUnits })], LIVE), REQUEST);
      expect(outcome.kind).toBe('UNAVAILABLE');
    }
  });

  it('keeps tax/toll/permit/surcharge inclusion flags and listed surcharges for disclosure', async () => {
    const outcome = await searchProviderQuotes(syntheticProvider((r) => [quoteFor(r, { surchargesMinorUnits: 50000 })], LIVE), REQUEST);
    if (outcome.kind !== 'QUOTES') throw new Error('expected quotes');
    expect(outcome.quotes[0].inclusions).toEqual({ tax: 'INCLUDED', toll: 'EXCLUDED', permit: 'UNKNOWN', surcharges: 'EXCLUDED' });
    expect(outcome.quotes[0].surchargesMinorUnits).toBe(50000);
    const shown = presentProviderOutcome(outcome);
    expect(shown.disclosures).toEqual(expect.arrayContaining(['Taxes included', 'Tolls not included', 'Permits to be confirmed', 'Surcharges not included']));
    expect(shown.disclosures.join(' ')).toContain('₹500');
  });

  it('contains a supplier timeout and aborts the request', async () => {
    let aborted = false;
    const provider = syntheticProvider((_r, signal) => new Promise(() => signal.addEventListener('abort', () => (aborted = true))), LIVE);
    const outcome = await searchProviderQuotes(provider, REQUEST, { timeoutMs: 20 });
    expect(outcome).toEqual({ kind: 'ERROR', providerId: 'synthetic', code: 'TIMEOUT' });
    expect(aborted).toBe(true);
  });

  it('de-duplicates repeated supplier quote references', async () => {
    const outcome = await searchProviderQuotes(syntheticProvider((r) => [quoteFor(r), quoteFor(r), quoteFor(r, { supplierQuoteRef: 'SYNTH-2', amountMinorUnits: 700000 })], LIVE), REQUEST);
    if (outcome.kind !== 'QUOTES') throw new Error('expected quotes');
    expect(outcome.quotes.map((q) => q.supplierQuoteRef)).toEqual(['SYNTH-2', 'SYNTH-1']);
    expect(outcome.rejected).toEqual([{ reason: 'DUPLICATE' }]);
  });

  it('contains provider errors, thrown non-errors and malformed responses without throwing', async () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await searchProviderQuotes(syntheticProvider(() => Promise.reject(new TransportProviderError('RATE_LIMITED', 'secret supplier detail')), LIVE), REQUEST)).toEqual({ kind: 'ERROR', providerId: 'synthetic', code: 'RATE_LIMITED' });
    expect(await searchProviderQuotes(syntheticProvider(() => Promise.reject('boom'), LIVE), REQUEST)).toMatchObject({ kind: 'ERROR', code: 'UPSTREAM_ERROR' });
    expect(await searchProviderQuotes(syntheticProvider((() => ({ not: 'an array' })) as never, LIVE), REQUEST)).toMatchObject({ kind: 'ERROR', code: 'INVALID_RESPONSE' });
    expect(JSON.stringify(quiet.mock.calls)).not.toContain('secret supplier detail');
    quiet.mockRestore();
  });

  it('the same route in the reverse direction is a different route', async () => {
    const reverse: TransportQuoteRequest = { ...REQUEST, pickup: REQUEST.dropoff, dropoff: REQUEST.pickup };
    // The provider answers the forward route only; the reverse request must not accept it.
    const provider = syntheticProvider(() => [quoteFor(REQUEST)], LIVE);
    expect((await searchProviderQuotes(provider, REQUEST)).kind).toBe('QUOTES');
    expect(await searchProviderQuotes(provider, reverse)).toMatchObject({ kind: 'UNAVAILABLE', rejected: [{ reason: 'ROUTE_MISMATCH' }] });
  });

  it('an airport and the city it serves are different locations', async () => {
    expect(sameLocation({ kind: 'AIRPORT', id: 'chandigarh' }, { kind: 'CITY', id: 'chandigarh' })).toBe(false);
    const airportRequest: TransportQuoteRequest = { ...REQUEST, pickup: { kind: 'AIRPORT', id: 'chandigarh' } };
    const provider = syntheticProvider(() => [quoteFor(REQUEST)], LIVE); // quote is for the CITY pickup
    expect(await searchProviderQuotes(provider, airportRequest)).toMatchObject({ rejected: [{ reason: 'ROUTE_MISMATCH' }] });
  });

  it('applies explicit capability flags to one-way, round-trip and multi-day, and to airports', () => {
    const airportOnly = { capabilities: { ...syntheticProvider(() => []).capabilities, intercityOneWay: false, cityTransfers: false, roundTrip: false, multiDay: false } };
    const airport = { ...REQUEST, pickup: { kind: 'AIRPORT' as const, id: 'chandigarh' } };
    expect(unsupportedReason(airportOnly, airport)).toBeNull();
    expect(unsupportedReason(airportOnly, { ...REQUEST, tripType: 'ROUND_TRIP' })).toBe('TRIP_TYPE');
    expect(unsupportedReason(airportOnly, { ...REQUEST, tripType: 'MULTI_DAY', tripDays: 4 })).toBe('TRIP_TYPE');
    expect(unsupportedReason(airportOnly, REQUEST)).toBe('LOCATION_KIND');
    const noAirport = { capabilities: { ...airportOnly.capabilities, airportTransfers: false, intercityOneWay: true } };
    expect(unsupportedReason(noAirport, airport)).toBe('LOCATION_KIND');
    expect(unsupportedReason({ capabilities: { ...syntheticProvider(() => []).capabilities } }, { ...REQUEST, tripType: 'MULTI_DAY' })).toBe('INVALID_REQUEST');
  });

  it('forces revalidation when luggage is requested from a luggage-unaware provider', async () => {
    const provider = syntheticProvider((r) => [quoteFor(r)], { ...LIVE, caps: { luggageAware: false } });
    const outcome = await searchProviderQuotes(provider, { ...REQUEST, luggage: { large: 2, small: 1 } });
    if (outcome.kind !== 'QUOTES') throw new Error('expected quotes');
    expect(outcome.quotes[0].requiresRevalidation).toBe(true);
  });

  it('never creates a booking', async () => {
    const provider = syntheticProvider((r) => [quoteFor(r)], LIVE);
    await searchProviderQuotes(provider, REQUEST);
    expect(provider.createBooking).not.toHaveBeenCalled();
  });
});

describe('customer-facing price state', () => {
  it('only an authorized live provider outcome can be labelled Live Supplier Quote', async () => {
    const live = await searchProviderQuotes(syntheticProvider((r) => [quoteFor(r)], LIVE), REQUEST);
    const fixture = await searchProviderQuotes(syntheticProvider((r) => [quoteFor(r)], { status: 'FIXTURE' }), REQUEST);
    const sandbox = await searchProviderQuotes(syntheticProvider((r) => [quoteFor(r)], { status: 'SANDBOX' }), REQUEST);
    expect(presentProviderOutcome(live as PresentableProviderOutcome).state).toBe('LIVE_SUPPLIER_QUOTE');
    expect(presentProviderOutcome(fixture as PresentableProviderOutcome).state).toBe('PRICE_ON_REQUEST');
    expect(presentProviderOutcome(sandbox as PresentableProviderOutcome).state).toBe('PRICE_ON_REQUEST');
    expect(presentProviderOutcome(fixture as PresentableProviderOutcome).amountMinorUnits).toBeUndefined();
  });

  it('a calculated estimate or stored supplier rate is never a live quote', () => {
    for (const status of ['CALCULATED_ESTIMATE', 'EXACT_SUPPLIER_RATE', 'GENERIC_SUPPLIER_ESTIMATE']) {
      const shown = presentExistingPriceResponse({ status, label: 'Confirmed Fare', amountMinorUnits: 1200000, currency: 'INR' });
      expect(shown.state).toBe('ESTIMATED_FARE');
      expect(shown.label).toBe('Estimated Fare');
    }
  });

  it('QUOTE_REQUIRED, malformed and null responses are Price On Request', () => {
    expect(presentExistingPriceResponse({ status: 'QUOTE_REQUIRED' }).state).toBe('PRICE_ON_REQUEST');
    expect(presentExistingPriceResponse(null).state).toBe('PRICE_ON_REQUEST');
    expect(presentExistingPriceResponse({ status: 'CALCULATED_ESTIMATE', amountMinorUnits: -1, currency: 'INR' }).state).toBe('PRICE_ON_REQUEST');
    expect(presentExistingPriceResponse({ status: 'CALCULATED_ESTIMATE', amountMinorUnits: 100, currency: 'USD' }).state).toBe('PRICE_ON_REQUEST');
  });

  it('maps availability-pending, unavailable and provider-error states with no price', async () => {
    const pending = await searchProviderQuotes(syntheticProvider((r) => [quoteFor(r, { availability: 'ON_REQUEST' })], LIVE), REQUEST);
    expect(presentProviderOutcome(pending as PresentableProviderOutcome).state).toBe('AVAILABILITY_PENDING');
    expect(presentProviderOutcome({ kind: 'UNAVAILABLE' }).state).toBe('CURRENTLY_UNAVAILABLE');
    const error = presentProviderOutcome({ kind: 'ERROR' });
    expect(error.state).toBe('PROVIDER_ERROR');
    for (const display of [presentProviderOutcome({ kind: 'UNAVAILABLE' }), error]) expect(display.amountMinorUnits).toBeUndefined();
  });

  it('provider failure falls back to the existing estimate when one exists', () => {
    const estimate = presentExistingPriceResponse({ status: 'CALCULATED_ESTIMATE', amountMinorUnits: 900000, currency: 'INR' });
    expect(presentProviderOutcome({ kind: 'UNSUPPORTED' }, estimate)).toBe(estimate);
    expect(presentProviderOutcome(null, estimate)).toBe(estimate);
  });

  it('exposes no supplier reference or provider id to the browser model', async () => {
    const live = await searchProviderQuotes(syntheticProvider((r) => [quoteFor(r, { supplierQuoteRef: 'PRIVATE-REF-42' })], LIVE), REQUEST);
    expect(JSON.stringify(presentProviderOutcome(live as PresentableProviderOutcome))).not.toMatch(/PRIVATE-REF-42|synthetic/i);
  });
});

describe('isolation guarantees', () => {
  it('registers no provider, so no code path can reach a supplier', () => {
    expect(getRegisteredTransportProviders()).toEqual([]);
  });

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      if (['node_modules', '.next', '.git'].includes(name)) return [];
      const full = join(dir, name);
      return statSync(full).isDirectory() ? sourceFiles(full) : /\.(ts|tsx)$/.test(name) ? [full] : [];
    });
  }

  it('no app, component or lib file imports the server-only provider layer; the public price route is unchanged', () => {
    const offenders = ['app', 'components', 'lib'].flatMap((dir) => sourceFiles(join(process.cwd(), dir))).filter((file) => !/\.test\.tsx?$/.test(file) && /services\/providers\/transport/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
    const route = readFileSync(join(process.cwd(), 'app/api/transport/price/route.ts'), 'utf8');
    expect(route).not.toMatch(/providers\/transport|searchProviderQuotes/);
  });

  it('the provider layer holds no credentials, URLs or booking calls', () => {
    const files = sourceFiles(join(process.cwd(), 'services/providers/transport')).filter((file) => !/\.test\.ts$|__fixtures__/.test(file));
    const text = files.map((file) => readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')).join('\n');
    expect(text).not.toMatch(/https?:\/\/|process\.env|apiKey|api_key|Authorization|fetch\(|\.createBooking\(/);
  });
});
