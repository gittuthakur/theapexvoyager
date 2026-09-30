// INTERNAL, NOT PUBLIC — a presentation-rounding helper for a raw calculated price
// (lib/journeyCostModel.ts's `finalPackageTotal`/`perPersonSellingPrice`), never itself
// a source of the final public price. This module deliberately does NOT choose a
// "psychologically attractive" ending (e.g. rounding 15,432 down to 14,999) — that is a
// marketing/pricing decision for the business owner to make explicitly, not something
// this codebase decides on their behalf. The only thing this does is round a raw number
// to whatever step the caller asks for; the default step (1) performs no rounding at all.

export interface PriceRoundingInput {
  rawCalculatedPrice: number;
  /** Round to the nearest multiple of this amount, e.g. 100, 500, 1000. Defaults to 1
   *  (no rounding) — there is no built-in "nice price" step; the owner chooses one. */
  roundToNearest?: number;
}

export function roundForDisplay({ rawCalculatedPrice, roundToNearest = 1 }: PriceRoundingInput): number {
  if (!Number.isFinite(rawCalculatedPrice) || rawCalculatedPrice < 0) {
    throw new Error(`rawCalculatedPrice must be a non-negative number — received ${rawCalculatedPrice}.`);
  }
  if (!Number.isFinite(roundToNearest) || roundToNearest <= 0) {
    throw new Error(`roundToNearest must be a positive number — received ${roundToNearest}.`);
  }
  return Math.round(rawCalculatedPrice / roundToNearest) * roundToNearest;
}

// Reusable public disclaimer (Phase 3, Part 7) for eventual use wherever an approved
// starting price is shown on a published Journey page — matches the site's existing
// plain, factual tone (see e.g. lib/schema.ts's own comments on never overstating what's
// backed by real data). Not wired into any page yet; no Journey using this string is
// published. Never implies a fixed, guaranteed price for a specific booking.
export const JOURNEY_PRICE_DISCLAIMER =
  'Starting price is indicative and based on selected occupancy/package configuration. Final price may vary by travel dates, group size, hotel category, transport, season and availability.';

function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

// The exact public-facing contract (Phase 4, Part 2): always "Starting From", always
// qualified "per person", always carrying the trailing asterisk that ties back to
// JOURNEY_PRICE_DISCLAIMER above — never a bare, unqualified figure that could read as a
// fixed, guaranteed price. Throws rather than silently rendering a fabricated-looking
// price for 0/negative/non-finite input — the same "never treated as set" rule
// lib/journeyCommercialReadiness.ts's MISSING_PRICE blocker already enforces.
export function buildStartingFromLabel(price: number): string {
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`price must be a real, positive number — received ${price}.`);
  }
  return `Starting From ${formatINR(price)} per person*`;
}

export interface PublicDisplayPrice {
  rawCalculatedPrice: number;
  roundedPrice: number;
  /** Never set by this module — a display price only becomes eligible to reach a public
   *  page once a human sets this to `true` through whatever process the business uses to
   *  review pricing (this codebase has no automated publish path; see
   *  lib/journeyCommercialReadiness.ts). */
  ownerApproved: boolean;
}

// Bundles a rounded price with an explicit, always-false-by-default approval flag — a
// caller cannot construct an "approved" PublicDisplayPrice by accident; it has to be set
// afterward, deliberately, by whatever reviews pricing.
export function buildDisplayPrice(input: PriceRoundingInput): PublicDisplayPrice {
  return {
    rawCalculatedPrice: input.rawCalculatedPrice,
    roundedPrice: roundForDisplay(input),
    ownerApproved: false
  };
}
