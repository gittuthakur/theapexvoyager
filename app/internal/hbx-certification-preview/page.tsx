import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLocalDevelopment } from '@/lib/env';
import { connectDB } from '@/lib/mongodb';
import { getHbxEnvironment } from '@/services/providers/hbx/hbx.client';
import { hbxPricingProvider } from '@/services/providers/hbx/hbxAvailability.service';
import { resolveApplicableRateComments } from '@/services/providers/hbx/hbxRateComments.service';
import { retrieveBooking } from '@/services/providers/hbx/hbxBookingWorkflow.service';
import { HbxBooking } from '@/models/HbxBooking';

export const dynamic = 'force-dynamic';

// noindex/nofollow is defense-in-depth only — the real protection is the notFound()
// guard below (same convention as every other app/internal page).
export const metadata: Metadata = {
  title: 'HBX Certification Preview (Internal)',
  robots: { index: false, follow: false }
};

// Same manually-confirmed real TEST fixture as app/internal/hbx-test-price-preview —
// known to return real HBX Availability data.
const AVAILABILITY_QUERY = {
  destinationSlug: 'manali',
  checkIn: '2026-10-05',
  checkOut: '2026-10-07',
  adults: 2,
  children: 0,
  rooms: 1,
  providerHotelIds: ['617065']
};

// A genuine Hotelbeds TEST booking this codebase itself created and already cancelled
// during the 2026-09-28 certification-readiness verification (create -> retrieve ->
// cancel cycle, confirmed clean). Reused here — via live, read-only GET calls only — to
// demonstrate the Booking Confirmation / Voucher / Booking Detail / Cancellation steps
// without ever creating a new real reservation, per this task's explicit instruction to
// prefer existing fixtures over another live booking.
const EXAMPLE_BOOKING_REFERENCE = '270-2962712';

/**
 * Local-development-only, dev/test-only demonstration of the full certification
 * workflow: Availability -> rate selection -> applicable rate comments -> CheckRate
 * (only if RECHECK) -> booking confirmation -> confirmed booking -> voucher -> booking
 * detail -> cancellation. Gated the same way as every other app/internal page
 * (isLocalDevelopment() + notFound()), PLUS an explicit getHbxEnvironment() !== 'test'
 * refusal — this page must never render against a real production HBX environment even
 * if local credentials were ever misconfigured to point at one.
 */
export default async function HbxCertificationPreviewPage() {
  const environment = getHbxEnvironment();
  if (!isLocalDevelopment() || environment === 'production') {
    notFound();
  }

  // Step 1: Availability.
  const availability = await hbxPricingProvider.getAvailability(AVAILABILITY_QUERY);
  const selectedRate = availability.rates[0];

  // Step 2 (rate selection) is `selectedRate` itself — the first bookable rate this
  // account's real TEST inventory returned for the fixture above.

  // Step 3: applicable rate comments (mandatory before a real confirmBooking call) —
  // internally calls CheckRate only when selectedRate.rateType === 'RECHECK', never for
  // a 'BOOKABLE' rate (services/providers/hbx/hbxRateComments.service.ts).
  const resolvedComments = selectedRate ? await resolveApplicableRateComments(selectedRate) : null;

  // Steps 5-8: booking confirmation / confirmed booking / voucher / booking detail /
  // cancellation — demonstrated against the existing, already-cancelled example booking
  // above via a live, read-only GET (services/providers/hbx/hbxBooking.service.ts's
  // getHbxBookingDetail), never a new POST /bookings call.
  const exampleBooking = await retrieveBooking(EXAMPLE_BOOKING_REFERENCE);

  // The voucher link's token is read directly from our own persisted record — safe only
  // because this entire page is itself gated to local development; a real customer-
  // facing flow never exposes this token anywhere except the one link handed to that
  // specific customer.
  await connectDB();
  const persistedExample = await HbxBooking.findOne({ reference: EXAMPLE_BOOKING_REFERENCE }).lean();

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">HBX Certification Preview (Internal)</h1>
        <p className="mt-1 text-sm text-slate-500">HBX environment: {environment}. Local-development-only — never reachable in a real deployment.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">1-2. Availability &amp; rate selection</h2>
        <p className="mt-2 text-sm text-slate-700">
          State: {availability.state} · {availability.rates.length} rate(s) returned for hotel {AVAILABILITY_QUERY.providerHotelIds[0]}.
        </p>
        {selectedRate ? (
          <p className="mt-1 text-sm text-slate-700">
            Selected: {selectedRate.roomName ?? selectedRate.roomCode ?? 'Room'} · {selectedRate.boardName ?? 'Board not specified'} · rateType:{' '}
            {selectedRate.rateType ?? 'not specified'}
          </p>
        ) : (
          <p className="mt-1 text-sm text-amber-700">No live rate available right now for this fixture — steps 3+ below are skipped.</p>
        )}
      </section>

      {resolvedComments ? (
        <section className="rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            3. Applicable rate comments {selectedRate?.rateType === 'RECHECK' ? '(resolved via CheckRate)' : ''}
          </h2>
          <p className="mt-2 text-xs text-slate-500">Source: {resolvedComments.source}</p>
          {resolvedComments.comments.length > 0 ? (
            <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
              {resolvedComments.comments.map((comment, index) => (
                <li key={index}>{comment}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No applicable comments returned for this rate (never invented).</p>
          )}
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">4. CheckRate</h2>
        <p className="mt-2 text-sm text-slate-700">
          {selectedRate?.rateType === 'RECHECK'
            ? 'This rate is rateType=RECHECK — a real confirmBooking() call revalidates it via CheckRate immediately before booking.'
            : 'This rate is rateType=BOOKABLE (or unspecified) — CheckRate is skipped entirely, per the certification workflow rule.'}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">5-7. Booking confirmation, confirmed booking &amp; voucher</h2>
        <p className="mt-2 text-sm text-slate-700">
          Reusing an existing, already-cancelled real TEST booking ({EXAMPLE_BOOKING_REFERENCE}) created during this codebase&apos;s own
          certification-readiness verification — this section makes only a live, read-only lookup, never a new booking.
        </p>
        {exampleBooking.ok ? (
          <div className="mt-3 space-y-1 text-sm text-slate-700">
            <p>Reference: {exampleBooking.booking.reference}</p>
            <p>Status (live from Hotelbeds): {exampleBooking.booking.status}</p>
            <p>Hotel: {exampleBooking.booking.hotelName}</p>
            {persistedExample?.voucherAccessToken ? (
              <p>
                Example voucher link:{' '}
                <a
                  className="text-apex-600 underline"
                  href={`/bookings/hbx/${EXAMPLE_BOOKING_REFERENCE}/voucher?token=${persistedExample.voucherAccessToken}`}
                >
                  /bookings/hbx/{EXAMPLE_BOOKING_REFERENCE}/voucher
                </a>{' '}
                (will show a clearly CANCELLED voucher, not an active one)
              </p>
            ) : (
              <p className="text-amber-700">No local voucher record found for this reference — voucher link unavailable.</p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-amber-700">Could not retrieve this booking live from Hotelbeds right now: {exampleBooking.reason}</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">8. Cancellation</h2>
        <p className="mt-2 text-sm text-slate-700">
          This example booking was already cancelled during live verification
          {exampleBooking.ok && exampleBooking.booking.cancellationReference
            ? ` (cancellation reference: ${exampleBooking.booking.cancellationReference})`
            : ''}
          . A fresh confirmBooking()/cancelBooking() cycle is not repeated here to avoid creating another real Hotelbeds transaction.
        </p>
      </section>
    </main>
  );
}
