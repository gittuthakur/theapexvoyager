import { siteConfig } from '@/config/site.config';
import type { HbxBookingDocument } from '@/models/HbxBooking';

export interface HbxVoucherDocumentProps {
  booking: HbxBookingDocument;
}

function formatDate(value?: string): string {
  if (!value) return 'Not provided';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function paxLabel(pax: { type: 'AD' | 'CH'; age?: number; name?: string; surname?: string }, index: number): string {
  const fullName = [pax.name, pax.surname].filter(Boolean).join(' ');
  if (fullName) {
    return pax.type === 'CH' && pax.age !== undefined ? `${fullName} (Child, age ${pax.age})` : fullName;
  }
  // Never invents a name — Hotelbeds does not always require one for a child pax. Falls
  // back to an honest, generic occupant label instead.
  const genericLabel = pax.type === 'CH' ? `Child ${index + 1}` : `Guest ${index + 1}`;
  return pax.age !== undefined ? `${genericLabel} (age ${pax.age})` : genericLabel;
}

/**
 * The printable voucher document itself — pure presentation, reads only fields already
 * persisted on the HbxBooking record (never fetches, never invents). Deliberately never
 * renders any monetary amount (netAmount/totalNetAmount/cancellationPolicies' charge
 * amounts all exist on the record but are not read here) — no strong business
 * requirement for showing price on the voucher has been established.
 */
export function HbxVoucherDocument({ booking }: HbxVoucherDocumentProps) {
  // Strict, case-sensitive match on purpose: only the exact provider values CANCELLED and
  // CONFIRMED are trusted. Anything else (PENDING, empty, unknown, odd casing) fails safe
  // to a "not confirmed" warning rather than presenting a valid or a cancelled voucher.
  const isCancelled = booking.status === 'CANCELLED';
  const isConfirmed = booking.status === 'CONFIRMED';
  const isUnconfirmed = !isCancelled && !isConfirmed;

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-slate-900 sm:p-10 print:p-0">
      {isUnconfirmed ? (
        <div className="mb-6 rounded-2xl border-2 border-amber-500 bg-amber-50 px-6 py-4 text-center print:border print:bg-white">
          <p className="text-lg font-bold uppercase tracking-wide text-amber-800">Booking confirmation required</p>
          <p className="mt-1 text-sm text-amber-800">
            {`Booking is not confirmed yet. This document should not be used for check-in until confirmation is received from ${siteConfig.name}.`}
          </p>
          {booking.status ? <p className="mt-1 text-xs text-amber-700">Status: {booking.status}</p> : null}
        </div>
      ) : null}

      {isCancelled ? (
        <div className="mb-6 rounded-2xl border-2 border-red-600 bg-red-50 px-6 py-4 text-center print:border print:bg-white">
          <p className="text-lg font-bold uppercase tracking-wide text-red-700">This booking has been cancelled</p>
          <p className="mt-1 text-sm text-red-700">
            Status: {booking.status}
            {booking.cancellationReference ? ` · Cancellation reference: ${booking.cancellationReference}` : ''}
          </p>
          <p className="mt-1 text-xs text-red-600">This document is not valid for check-in and must not be used as an active voucher.</p>
        </div>
      ) : null}

      <header className="flex flex-col gap-1 border-b border-slate-200 pb-6">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Booking Voucher</p>
        <h1 className="text-2xl font-bold text-slate-900">{booking.hotelName ?? 'Hotel name not available'}</h1>
        {booking.hotelAddress ? <p className="text-sm text-slate-600">{booking.hotelAddress}</p> : null}
        {booking.hotelCity || booking.hotelPostalCode ? (
          <p className="text-sm text-slate-600">{[booking.hotelCity, booking.hotelPostalCode].filter(Boolean).join(' ')}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
          {booking.hotelCategoryDescription ? <span>Category: {booking.hotelCategoryDescription}</span> : null}
          {booking.destinationName ? <span>Destination: {booking.destinationName}</span> : null}
          {booking.hotelPhone ? <span>Phone: {booking.hotelPhone}</span> : null}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 border-b border-slate-200 py-6 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Booking reference</p>
          <p className="font-semibold text-slate-900">{booking.reference}</p>
        </div>
        {booking.clientReference ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Agency / client reference</p>
            <p className="font-semibold text-slate-900">{booking.clientReference}</p>
          </div>
        ) : null}
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Lead passenger</p>
          <p className="font-semibold text-slate-900">
            {booking.holderName} {booking.holderSurname}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Check-in</p>
          <p className="font-semibold text-slate-900">{formatDate(booking.checkIn)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Check-out</p>
          <p className="font-semibold text-slate-900">{formatDate(booking.checkOut)}</p>
        </div>
      </section>

      <section className="space-y-6 py-6">
        {booking.rooms.map((room, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-900">
              Room {index + 1}: {room.name ?? room.code ?? 'Room type not provided'}
            </p>
            <p className="mt-1 text-xs text-slate-500">Board: {room.boardName ?? room.boardCode ?? 'Not provided'}</p>

            <div className="mt-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Guests</p>
              <ul className="mt-1 list-inside list-disc text-sm text-slate-800">
                {room.paxes.length > 0 ? (
                  room.paxes.map((pax, paxIndex) => <li key={paxIndex}>{paxLabel(pax, paxIndex)}</li>)
                ) : (
                  <li>Guest details not available</li>
                )}
              </ul>
            </div>

            {room.rateComments ? (
              <div className="mt-3 rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Rate conditions</p>
                <p className="mt-1 text-sm text-slate-700">{room.rateComments}</p>
              </div>
            ) : null}
          </div>
        ))}
      </section>

      <footer className="border-t border-slate-200 pt-6 text-xs text-slate-500">
        <p>
          {booking.supplierName
            ? `Booking fulfilled by: ${booking.supplierName}${booking.supplierVatNumber ? ` (VAT: ${booking.supplierVatNumber})` : ''}`
            : `Supplier details for this booking will be confirmed by ${siteConfig.name}.`}
        </p>
        <p className="mt-1">Issued by {siteConfig.name}. Please carry a valid photo ID matching the lead passenger name at check-in.</p>
      </footer>
    </div>
  );
}
