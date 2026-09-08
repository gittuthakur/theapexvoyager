import Link from 'next/link';
import HotelCard from '@/components/modules/HotelCard';
import RegionBookingStayCard from '@/components/modules/regions/RegionBookingStayCard';
import { mapBookingAccommodationToCard } from '@/services/providers/booking/booking.mapper';
import type { HotelPackage } from '@/types/hotel';
import type { RegionBookingContext } from '@/types/regionHub';

export interface RegionStaysProps {
  curatedStays: HotelPackage[];
  bookingContext: RegionBookingContext;
  regionName: string;
}

export default function RegionStays({ curatedStays, bookingContext, regionName }: RegionStaysProps) {
  const hasBookingStays = bookingContext.enabled && bookingContext.accommodations.length > 0;

  return (
    <section id="stays" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">Where to stay</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Handpicked Stays in {regionName}</h2>
        </div>
        <Link
          href="/stays"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-apex-500 px-5 py-3 text-sm font-medium text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
        >
          Explore all stays
        </Link>
      </div>

      {curatedStays.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {curatedStays.map((hotel) => (
            <HotelCard key={hotel.slug} hotel={hotel} />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No curated stays published for {regionName} yet — our team can still recommend one.
        </p>
      )}

      {hasBookingStays ? (
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-slate-900">More stays via Booking.com</h3>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bookingContext.accommodations.map((accommodation) => (
              <RegionBookingStayCard key={accommodation.id} {...mapBookingAccommodationToCard(accommodation)} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
