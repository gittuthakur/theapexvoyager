/**
 * T1 — the customer-safe presentation model for a transport price. Client-safe: it carries NO
 * supplier reference, provider id, internal rate or partner field, and imports nothing from
 * services/providers (only structural input types are declared here).
 *
 * The six states are the only ones the UI may render. LIVE_SUPPLIER_QUOTE is reachable ONLY from a
 * provider outcome whose origin is 'LIVE' (an AUTHORIZED_LIVE integration); the existing
 * /api/transport/price responses (calculated estimates and stored supplier rates) can never
 * produce it, so a calculated estimate is never labelled as a live supplier rate.
 */

export type TransportPriceState =
  | 'ESTIMATED_FARE'
  | 'LIVE_SUPPLIER_QUOTE'
  | 'PRICE_ON_REQUEST'
  | 'AVAILABILITY_PENDING'
  | 'CURRENTLY_UNAVAILABLE'
  | 'PROVIDER_ERROR';

export interface TransportPriceDisplay {
  state: TransportPriceState;
  label: string;
  /** Present only for ESTIMATED_FARE and LIVE_SUPPLIER_QUOTE. */
  amountMinorUnits?: number;
  currency?: 'INR';
  /** Plain-language disclosures (tolls, taxes, validity...). Never contains a supplier name or reference. */
  disclosures: string[];
  /** LIVE_SUPPLIER_QUOTE only: when the price stops being valid (ISO). */
  validUntil?: string;
  /** Whether the UI may offer a "request this fare" style action; never a confirmed booking. */
  message: string;
}

export const TRANSPORT_PRICE_LABELS: Record<TransportPriceState, string> = {
  ESTIMATED_FARE: 'Estimated Fare',
  LIVE_SUPPLIER_QUOTE: 'Live Supplier Quote',
  PRICE_ON_REQUEST: 'Price On Request',
  AVAILABILITY_PENDING: 'Availability Pending',
  CURRENTLY_UNAVAILABLE: 'Currently Unavailable',
  PROVIDER_ERROR: 'Provider Error'
};

const ESTIMATE_DISCLOSURE = 'Final fare may vary based on tolls, parking, state taxes, permits and final route confirmation.';

function base(state: TransportPriceState, message: string, extra: Partial<TransportPriceDisplay> = {}): TransportPriceDisplay {
  return { state, label: TRANSPORT_PRICE_LABELS[state], disclosures: [], message, ...extra };
}

/** Shape of the existing public /api/transport/price JSON (unchanged contract). */
export interface ExistingTransportPriceResponse {
  status?: string;
  label?: string;
  amountMinorUnits?: number;
  currency?: string;
  disclaimer?: string;
}

/**
 * Maps the existing price endpoint's response. Every priced status — CALCULATED_ESTIMATE,
 * EXACT_SUPPLIER_RATE (a stored contract rate) and GENERIC_SUPPLIER_ESTIMATE — is an ESTIMATED_FARE
 * here: none of them is a live supplier quote. Anything else is Price On Request.
 */
export function presentExistingPriceResponse(response: ExistingTransportPriceResponse | null | undefined): TransportPriceDisplay {
  const priced =
    response &&
    (response.status === 'CALCULATED_ESTIMATE' || response.status === 'EXACT_SUPPLIER_RATE' || response.status === 'GENERIC_SUPPLIER_ESTIMATE') &&
    Number.isInteger(response.amountMinorUnits) &&
    (response.amountMinorUnits as number) > 0 &&
    response.currency === 'INR';
  if (!priced) return base('PRICE_ON_REQUEST', 'Our travel team will confirm a price for this route.');
  return base('ESTIMATED_FARE', 'An estimate, not a confirmed or live fare.', {
    amountMinorUnits: response.amountMinorUnits,
    currency: 'INR',
    disclosures: [response.disclaimer ?? ESTIMATE_DISCLOSURE]
  });
}

/** Structural view of a provider outcome (matches ProviderQuoteOutcome without importing server code). */
export type PresentableProviderOutcome =
  | {
      kind: 'QUOTES';
      origin: 'LIVE' | 'NON_LIVE';
      quotes: Array<{
        amountMinorUnits: number;
        currency: 'INR';
        inclusions: { tax: string; toll: string; permit: string; surcharges: string };
        surchargesMinorUnits?: number;
        validUntil: string;
        requiresRevalidation: boolean;
        availability: 'AVAILABLE' | 'ON_REQUEST';
      }>;
    }
  | { kind: 'UNAVAILABLE' }
  | { kind: 'UNSUPPORTED' }
  | { kind: 'ERROR' };

const INCLUSION_LABELS: Array<['tax' | 'toll' | 'permit' | 'surcharges', string]> = [
  ['tax', 'Taxes'],
  ['toll', 'Tolls'],
  ['permit', 'Permits'],
  ['surcharges', 'Surcharges']
];

/** Maps a validated provider outcome; falls back to a safe state — never a fabricated price. */
export function presentProviderOutcome(outcome: PresentableProviderOutcome | null | undefined, fallback: TransportPriceDisplay = presentExistingPriceResponse(null)): TransportPriceDisplay {
  if (!outcome) return fallback;
  if (outcome.kind === 'ERROR') return base('PROVIDER_ERROR', 'We couldn’t check live fares just now. Our travel team can confirm a price for you.');
  if (outcome.kind === 'UNSUPPORTED') return fallback;
  if (outcome.kind === 'UNAVAILABLE') return base('CURRENTLY_UNAVAILABLE', 'No vehicle is available for this request right now.');
  // Fixture/sandbox data is never customer-visible as a price.
  if (outcome.origin !== 'LIVE' || outcome.quotes.length === 0) return fallback;

  const best = outcome.quotes[0];
  if (best.availability === 'ON_REQUEST') return base('AVAILABILITY_PENDING', 'Availability for this fare is still to be confirmed.');
  const disclosures = INCLUSION_LABELS.map(([key, label]) => {
    const value = best.inclusions[key];
    return value === 'INCLUDED' ? `${label} included` : value === 'EXCLUDED' ? `${label} not included` : `${label} to be confirmed`;
  });
  if (best.surchargesMinorUnits) disclosures.push(`Plus ₹${(best.surchargesMinorUnits / 100).toLocaleString('en-IN')} in listed surcharges`);
  if (best.requiresRevalidation) disclosures.push('Price will be re-confirmed before booking');
  return base('LIVE_SUPPLIER_QUOTE', 'A live fare, valid until the time shown. Not a confirmed booking.', {
    amountMinorUnits: best.amountMinorUnits,
    currency: 'INR',
    disclosures,
    validUntil: best.validUntil
  });
}
