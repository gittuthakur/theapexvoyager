import { Suspense } from 'react';
import type { Metadata } from 'next';
import StaySearch from '@/components/modules/StaySearch';
import StayFilters from '@/components/modules/StayFilters';
import PropertyCard from '@/components/modules/PropertyCard';
import { FILTER_EMPTY_STATE_CLASS } from '@/components/modules/filters/filterStyles';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { getHotels } from '@/lib/hotels';
import { findStayTypeBySlug } from '@/config/stayTypes.config';
import { findStayMoodBySlug } from '@/config/stayMoods.config';
import type { HotelCategory, HotelPackage } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Search Stays | Apex Stays — The Apex Voyager',
  description: 'Search Himalayan hotels, resorts, homestays and unique stays by destination, dates and stay type.'
};

interface StaySearchPageProps {
  searchParams: Promise<{
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    type?: string;
    priceMax?: string;
    amenity?: string;
    mood?: string;
  }>;
}

export default async function StaySearchPage({ searchParams }: StaySearchPageProps) {
  const { destination, checkIn, checkOut, guests, type, priceMax, amenity, mood } = await searchParams;

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-[1440px] space-y-6">
        <div className="">
          <p className="text-md font-semibold uppercase tracking-[0.16em] text-apex-600">Apex Stays</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            {destination ? `Stays in ${destination}` : 'All Himalayan Stays'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {[checkIn && checkOut ? `${checkIn} – ${checkOut}` : null, guests ? `${guests} Guest${guests === '1' ? '' : 's'}` : null]
              .filter(Boolean)
              .join(' · ') || 'Any dates · Any guests'}
          </p>
          <StaySearch
            defaultDestination={destination}
            defaultCheckIn={checkIn}
            defaultCheckOut={checkOut}
            defaultGuests={guests}
          />
        </div>

        <Suspense
          key={`${destination ?? ''}:${type ?? ''}:${priceMax ?? ''}:${amenity ?? ''}:${mood ?? ''}`}
          fallback={<SkeletonGrid count={4} className="xl:grid-cols-2" />}
        >
          <StaySearchResults
            destination={destination}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            type={type}
            priceMax={priceMax}
            amenity={amenity}
            mood={mood}
          />
        </Suspense>
      </section>
    </main>
  );
}

interface StaySearchResultsProps {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  type?: string;
  priceMax?: string;
  amenity?: string;
  mood?: string;
}

async function StaySearchResults({ destination, checkIn, checkOut, guests, type, priceMax, amenity, mood }: StaySearchResultsProps) {
  const stayType = type ? findStayTypeBySlug(type) : undefined;
  const stayMood = !stayType && mood ? findStayMoodBySlug(mood) : undefined;
  const category: HotelCategory | undefined = stayType?.category ?? stayMood?.category;
  const isBoutiqueOnly = type === 'boutique-stays';
  const moodKeyword = stayMood?.keyword?.toLowerCase();

  const allHotels = await getHotels({ category, destination });

  const scoped = allHotels.filter((hotel) => {
    if (isBoutiqueOnly && !hotel.featured) return false;
    if (moodKeyword) {
      const haystack = `${hotel.description} ${(hotel.amenities ?? []).join(' ')}`.toLowerCase();
      if (!haystack.includes(moodKeyword)) return false;
    }
    return true;
  });

  const amenityOptions = Array.from(new Set(scoped.flatMap((hotel) => hotel.amenities ?? []))).sort((a, b) => a.localeCompare(b));

  // Real min/max nightly price across the current (destination/type-scoped) result
  // set, for the desktop price slider — never fabricated; null when there's nothing
  // meaningful to slide between, mirroring PriceRangeSlider's own honest-empty-state rule.
  const scopedPrices = scoped.map((hotel) => hotel.places?.customPrice ?? hotel.pricePerNight);
  const priceBounds =
    scopedPrices.length > 0 && Math.max(...scopedPrices) > Math.min(...scopedPrices)
      ? { min: Math.min(...scopedPrices), max: Math.max(...scopedPrices) }
      : null;

  const priceMaxValue = priceMax ? Number(priceMax) : undefined;
  const hotels: HotelPackage[] = scoped.filter((hotel) => {
    const price = hotel.places?.customPrice ?? hotel.pricePerNight;
    if (priceMaxValue !== undefined && Number.isFinite(priceMaxValue) && price > priceMaxValue) return false;
    if (amenity && !hotel.amenities?.includes(amenity)) return false;
    return true;
  });

  const currentParams: Record<string, string | undefined> = { destination, checkIn, checkOut, guests, type, priceMax, amenity, mood };

  const filters = (
    <StayFilters
      currentParams={currentParams}
      amenityOptions={amenityOptions}
      activePriceMax={priceMax}
      activeType={type}
      activeAmenity={amenity}
      resultCount={hotels.length}
      priceBounds={priceBounds}
    />
  );

  if (hotels.length === 0) {
    return (
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        {filters}
        <div className={cn(FILTER_EMPTY_STATE_CLASS, 'flex-1')}>
          <p className="text-lg font-semibold text-slate-900">No stays match your search.</p>
          <p className="mt-3 text-slate-600">Try a different destination, stay type, or price range.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
      {filters}
      <div className="grid flex-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel, index) => (
          <PropertyCard key={hotel.slug} hotel={hotel} checkIn={checkIn} checkOut={checkOut} guests={guests} priority={index < 4} />
        ))}
      </div>
    </div>
  );
}
