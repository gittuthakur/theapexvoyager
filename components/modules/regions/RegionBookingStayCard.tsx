import { Star } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import type { RegionBookingStayCardProps } from '@/services/providers/booking/booking.mapper';

// The designed-but-dataless Booking.com stay variant — bookingMode "affiliate", distinct
// CTA copy from the curated Mongo stay card (RegionStays reuses HotelCard for those).
// Only ever rendered when bookingContext.accommodations is non-empty, which never
// happens today (see services/providers/booking/bookingAccommodation.service.ts) — this
// exists so the visual slot and copy contract are correct once real credentials land.
export default function RegionBookingStayCard({ name, photoUrl, priceFrom, currency, providerUrl, rating }: RegionBookingStayCardProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        {photoUrl ? <SafeImage src={photoUrl} alt={name} fill sizes="(min-width: 1024px) 360px, 45vw" className="object-cover" /> : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-semibold text-slate-900">{name}</h3>
        {rating ? (
          <span className="inline-flex items-center gap-1 text-sm text-amber-500">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
          </span>
        ) : null}
        <div className="flex-1" />
        {priceFrom ? (
          <p className="text-lg font-semibold text-apex-600">
            {currency ?? ''} {priceFrom.toLocaleString('en-IN')} <span className="text-sm font-normal text-slate-500">/ night</span>
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={providerUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-apex-500 px-4 py-2 text-sm font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-apex-400"
          >
            Check Availability
          </a>
          <a
            href={providerUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors duration-300 ease-in-out hover:bg-slate-50"
          >
            View on Booking.com
          </a>
        </div>
      </div>
    </div>
  );
}
