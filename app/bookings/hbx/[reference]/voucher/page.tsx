import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getVoucherBooking } from '@/lib/hbxVoucher';
import { HbxVoucherDocument } from '@/components/modules/bookings/HbxVoucherDocument';
import { PrintVoucherButton } from '@/components/modules/bookings/PrintVoucherButton';

export const dynamic = 'force-dynamic';

// A voucher link is a private, single-purpose document, never meant to be indexed or
// browsed to — same reasoning as app/internal pages, but this route is NOT gated to
// local-development only: a real customer must be able to open it in production. The
// only protection is the reference+token match inside getVoucherBooking.
export const metadata: Metadata = {
  title: 'Booking Voucher',
  robots: { index: false, follow: false }
};

interface VoucherPageProps {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ token?: string }>;
}

/**
 * The only public entry point that can ever read an HbxBooking record. Requires the
 * request to name BOTH the real Hotelbeds `reference` (a path segment, so it appears in
 * server logs/URLs — expected, it is not itself a secret) AND the random
 * `voucherAccessToken` (a query param, so it never leaks into an <a href> a crawler or
 * referrer header would carry forward the same way path segments do). A wrong or
 * missing token renders the exact same 404 as a nonexistent reference — this route
 * structurally cannot be used to enumerate real booking references or their status.
 */
export default async function HbxVoucherPage({ params, searchParams }: VoucherPageProps) {
  const { reference } = await params;
  const { token } = await searchParams;

  const booking = await getVoucherBooking(reference, token);
  if (!booking) {
    notFound();
  }

  return (
    <main id="main-content" className="bg-slate-100 px-4 py-10 print:bg-white print:p-0">
      <div className="mx-auto mb-6 flex max-w-3xl justify-end print:hidden">
        <PrintVoucherButton />
      </div>
      <HbxVoucherDocument booking={booking} />
    </main>
  );
}
