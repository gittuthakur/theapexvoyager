import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import StaySearch from '@/components/modules/StaySearch';
import StayFilters from '@/components/modules/StayFilters';
import PropertyCard from '@/components/modules/PropertyCard';
import { FILTER_EMPTY_STATE_CLASS } from '@/components/modules/filters/filterStyles';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import BackButton from '@/components/ui/BackButton';
import { cn } from '@/lib/utils';
import { getHotels } from '@/lib/hotels';
import { findStayTypeBySlug } from '@/config/stayTypes.config';
import { findStayMoodBySlug } from '@/config/stayMoods.config';
import { parseValidPriceMax } from '@/components/modules/filters/priceMax';
import { images } from '@/config/images.config';
import type { HotelCategory, HotelPackage } from '@/types';

export const dynamic = 'force-dynamic';

// A static canonical/OG pair, not per-filter-combination — same pattern as
// app/journeys/page.tsx: every filter combination on this listing canonicalizes
// back to this one URL rather than indexing a separate page per query string.
const title = 'Search Stays | Apex Stays — The Apex Voyager';
const description = 'Search Himalayan hotels, resorts, homestays and unique stays by destination, dates and stay type.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/stays/search' },
  openGraph: { title, description, url: '/stays/search', images: [{ url: images.experiences.riversideCamp, alt: 'Himalayan mountain-view stay overlooking a river valley' }] }
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
    /** Raw HotelCategory value (e.g. "Homestay") — the homepage Global Search's Stays
     *  tab sends this directly instead of a /stays/[slug]-style `type` slug. Only used
     *  as a fallback when `type`/`mood` aren't set, and intentionally left out of
     *  StayFilters' `currentParams` so the sidebar's own type/mood vocabulary takes
     *  over cleanly the moment the visitor interacts with it. */
    category?: string;
  }>;
}

export default async function StaySearchPage({ searchParams }: StaySearchPageProps) {
  const { destination, checkIn, checkOut, guests, type, priceMax, amenity, mood, category } = await searchParams;

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-[1440px] space-y-6">
        <BackButton fallbackHref="/stays" label="Back to Apex Stays" />

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

        {/* Visually hidden — the visible heading is the h1 above; this just gives the
            filters/results region its own place in the h1→h2→h3 (card title) outline
            without adding a second visible heading the approved design didn't call for. */}
        <h2 className="sr-only">Browse Stays</h2>

        <Suspense
          key={`${destination ?? ''}:${type ?? ''}:${priceMax ?? ''}:${amenity ?? ''}:${mood ?? ''}:${category ?? ''}`}
          fallback={<SkeletonGrid count={4} className="md:grid-cols-2 lg:grid-cols-3" />}
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
            category={category}
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
  category?: string;
}

const HOTEL_CATEGORIES: HotelCategory[] = ['Hotel', 'Homestay', 'Resort', 'Villa', 'Camp', 'Treehouse', 'Farmstay', 'Hostel', 'Heritage', 'GuestHouse'];
function isHotelCategory(value?: string): value is HotelCategory {
  return Boolean(value) && HOTEL_CATEGORIES.includes(value as HotelCategory);
}

async function StaySearchResults({ destination, checkIn, checkOut, guests, type, priceMax, amenity, mood, category: categoryParam }: StaySearchResultsProps) {
  const stayType = type ? findStayTypeBySlug(type) : undefined;
  const stayMood = !stayType && mood ? findStayMoodBySlug(mood) : undefined;
  const category: HotelCategory | undefined = stayType?.category ?? stayMood?.category ?? (isHotelCategory(categoryParam) ? categoryParam : undefined);
  const isBoutiqueOnly = type === 'boutique-stays';
  const moodKeyword = stayMood?.keyword?.toLowerCase();
  const priceMaxValue = parseValidPriceMax(priceMax);
  // A `type`/`mood`/`priceMax` value that was provided but doesn't resolve to anything
  // real (a stale or hand-edited link — an unknown type slug, or a priceMax that isn't
  // a real non-negative number) must never fall through to "no filter" below — that
  // would silently show the whole unfiltered catalog instead of a genuine zero-result
  // state for a filter that doesn't exist. A negative/NaN/Infinite priceMax isn't a
  // real price ceiling any more than an unresolved type slug is a real stay type.
  const typeRequestedButUnresolved = Boolean(type) && !stayType;
  const moodRequestedButUnresolved = !stayType && Boolean(mood) && !stayMood;
  const priceRequestedButInvalid = Boolean(priceMax) && priceMaxValue === undefined;
  const shouldForceEmpty = typeRequestedButUnresolved || moodRequestedButUnresolved || priceRequestedButInvalid;

  const allHotels = shouldForceEmpty ? [] : await getHotels({ category, destination });

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

  const hotels: HotelPackage[] = scoped.filter((hotel) => {
    const price = hotel.places?.customPrice ?? hotel.pricePerNight;
    if (priceMaxValue !== undefined && price > priceMaxValue) return false;
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
    // Whether *anything* the visitor chose narrowed the result set — if not, an empty
    // result means the catalog itself has nothing right now, not that their destination/
    // type/price/amenity/mood choice was too narrow. Blaming a search that was never
    // made would be dishonest, so this needs its own message rather than reusing the
    // filtered-empty copy below.
    const hasActiveFilters = Boolean(destination || type || priceMax || amenity || mood || categoryParam);
    return (
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        {filters}
        <div className={cn(FILTER_EMPTY_STATE_CLASS, 'flex-1')}>
          {hasActiveFilters ? (
            <>
              <p className="text-lg font-semibold text-slate-900">No stays match your search.</p>
              <p className="mt-3 text-slate-600">Try a different destination, stay type, or price range.</p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-slate-900">Stays aren&apos;t available right now.</p>
              <p className="mt-3 text-slate-600">Check back soon, or explore our curated Journeys in the meantime.</p>
              <Link
                href="/journeys"
                className="cursor-hover mt-6 inline-flex items-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
              >
                Explore Journeys
              </Link>
            </>
          )}
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
