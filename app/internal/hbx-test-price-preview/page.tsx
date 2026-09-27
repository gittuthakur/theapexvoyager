import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLocalDevelopment } from '@/lib/env';
import { resolveTestModePrice } from '@/services/pricing/stayPricing.service';
import { StayPricePanel } from '@/components/modules/stays/StayPricePanel';

export const dynamic = 'force-dynamic';

// noindex/nofollow is defense-in-depth only — the real protection is the notFound()
// guard below, same convention as app/internal/hotel-mappings/page.tsx.
export const metadata: Metadata = {
  title: 'HBX Test Price Preview (Internal)',
  robots: { index: false, follow: false }
};

// A hotel/date/occupancy combination manually confirmed (2026-09-27) to return real HBX
// TEST-environment availability — see the HBX sandbox end-to-end verification report.
// Only the QUERY is fixed here; the price itself is never hardcoded — every render asks
// resolveTestModePrice fresh (or reuses a fresh StayRateCache hit), so this page always
// shows whatever HBX's TEST environment genuinely returns right now, never a stored
// number. This hotel has no HotelProviderMapping and this page never creates or confirms
// one — it queries HBX by raw provider hotel id specifically so it can never be mistaken
// for, or affect, a real property's mapping status.
const TEST_FIXTURE = {
  providerHotelId: '617065',
  destinationSlug: 'manali',
  checkIn: '2026-10-05',
  checkOut: '2026-10-07',
  adults: 2,
  children: 0,
  rooms: 1
};

/**
 * Local-development-only internal tool — same isLocalDevelopment()/notFound() gate as
 * app/internal/hotel-mappings/page.tsx, so a request for this route in any real
 * deployment gets Next's genuine 404, never this component's markup. Exists solely to let
 * a developer visually confirm the HBX TEST pricing pipeline (HBX -> hbx.mapper ->
 * StayRateCache -> resolveTestModePrice -> UI) renders correctly, using the exact same
 * StayPricePanel component the real Stay detail page uses. resolveTestModePrice itself is
 * structurally incapable of ever returning a result outside a 'test'-classified HBX
 * environment (services/pricing/stayPricing.service.ts) — this page adds no further gate
 * of its own beyond the same one every other internal page already relies on.
 */
export default async function HbxTestPricePreviewPage() {
  if (!isLocalDevelopment()) {
    notFound();
  }

  const priceResult = await resolveTestModePrice(TEST_FIXTURE);

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">HBX Test Price Preview (Internal)</h1>
      <p className="mt-2 text-sm text-slate-600">
        Hotel {TEST_FIXTURE.providerHotelId} · {TEST_FIXTURE.checkIn} → {TEST_FIXTURE.checkOut} · {TEST_FIXTURE.adults} adults,{' '}
        {TEST_FIXTURE.rooms} room
      </p>
      <div className="mt-6 space-y-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center">
        <StayPricePanel priceResult={priceResult} isTestRate />
      </div>
    </main>
  );
}
