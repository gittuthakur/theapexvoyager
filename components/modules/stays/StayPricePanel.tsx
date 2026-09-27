import type { PublicPriceResult } from '@/services/pricing/stayPricing.types';

/** ISO 4217 currency-agnostic — an HBX rate's currency is never assumed to be INR (its
 *  evaluation/test environment returns EUR); falls back to a plain "amount CODE" string
 *  if the supplier ever sends something Intl.NumberFormat doesn't recognize. */
function formatCurrencyAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export interface StayPricePanelProps {
  priceResult: PublicPriceResult | null;
  /** Only ever passed `true` by the local-development-only HBX test-price preview page
   *  (app/internal/hbx-test-price-preview/page.tsx) — never by any real customer-facing
   *  Stay page, since resolvePublicPrice (the only pricing function a real page may call)
   *  can structurally never itself return a test-environment rate. */
  isTestRate?: boolean;
}

/** The one shared price-panel presentation for a Stay's sticky price card — used by both
 *  the real Google-backed property detail page and the internal HBX test-price preview
 *  page, so a visual check of one is a visual check of the exact same markup the other
 *  renders. Purely presentational: never fetches, never computes a price itself. */
export function StayPricePanel({ priceResult, isTestRate }: StayPricePanelProps) {
  if (priceResult?.state === 'VERIFIED_LIVE_RATE' && priceResult.price) {
    return (
      <>
        {isTestRate ? (
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            TEST RATE — Not for booking
          </span>
        ) : null}
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
          {isTestRate ? 'HBX Test Price — ' : ''}Total for {priceResult.price.nightCount} night{priceResult.price.nightCount === 1 ? '' : 's'}
        </p>
        <p className="text-2xl font-semibold text-slate-900">{formatCurrencyAmount(priceResult.price.totalStayPrice, priceResult.price.currency)}</p>
        <p className="text-xs text-slate-500">
          ≈ {formatCurrencyAmount(priceResult.price.displayPerNight, priceResult.price.currency)} / night. Final price and room selection confirmed at
          booking.
        </p>
      </>
    );
  }

  return (
    <>
      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Starting from</p>
      <p className="text-2xl font-semibold text-slate-900">Contact for pricing</p>
      <p className="text-xs text-slate-500">
        Property and rating data from Google. Live availability and pricing are not connected — our team will confirm the current
        rates directly with you.
      </p>
    </>
  );
}
