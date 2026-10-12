import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import StaySearch from '@/components/modules/StaySearch';
import StayFilters from '@/components/modules/StayFilters';
import PropertyCard from '@/components/modules/PropertyCard';
import { StayCard } from '@/components/modules/StaysGrid';
import { hotelToStay } from '@/lib/stayMerge';
import { FILTER_EMPTY_STATE_CLASS } from '@/components/modules/filters/filterStyles';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import BackButton from '@/components/ui/BackButton';
import { cn } from '@/lib/utils';
import { getHotels } from '@/lib/hotels';
import { searchEligibleStays, STAYS_PAGE_SIZE, type EligibleStaysOutcome } from '@/lib/staysSearch';
import { paginate, parsePageParam, scoreStayText, type StayCandidate } from '@/lib/search/staySearch';
import { findStayTypeBySlug } from '@/config/stayTypes.config';
import { findStayMoodBySlug } from '@/config/stayMoods.config';
import { parseValidPriceMax } from '@/components/modules/filters/priceMax';
import { isCategoryRequestedButUnresolved, isHotelCategory } from '@/components/modules/filters/stayCategoryParam';
import { images } from '@/config/images.config';
import { CATEGORY_TO_STAY_TYPE, type Stay } from '@/types/stay';
import type { HotelCategory, HotelPackage } from '@/types';
import { describeStayPreferences, readStayPreferences, STAY_PREFERENCES_DISCLAIMER } from '@/lib/tripPreferences';

export const dynamic = 'force-dynamic';

// A static canonical/OG pair, not per-filter-combination — same pattern as
// app/journeys/page.tsx: every filter combination on this listing canonicalizes
// back to this one URL rather than indexing a separate page per query string.
const title = 'Search Stays | Apex Stays — The Apex Voyager India';
const description = 'Search Himalayan hotels, resorts, homestays and unique stays by destination, dates and stay type.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/stays/search' },
  openGraph: { title, description, url: '/stays/search', images: [{ url: images.experiences.riversideCamp, alt: 'Himalayan mountain-view stay overlooking a river valley' }] },
  twitter: { card: 'summary_large_image', title, description, images: [images.experiences.riversideCamp] },
  // Not indexed — a query-string-driven results page (see app/sitemap.ts's matching
  // note for why it's also absent from the sitemap), never submitted for indexing even
  // though the canonical above already consolidates every filter combination onto this
  // one URL. `follow` keeps every internal link on the page crawlable/discoverable —
  // only indexing this specific URL is opted out, not the destination/property pages
  // it links to.
  robots: { index: false, follow: true }
};

interface StaySearchPageProps {
  searchParams: Promise<{
    destination?: string;
    /** Free-text property name / locality search over the publicly eligible cached stays. */
    q?: string;
    page?: string;
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
  const { destination, q, page, checkIn: rawCheckIn, checkOut: rawCheckOut, guests: rawGuests, type, priceMax, amenity, mood, category } = await searchParams;
  // Dates and guests are PREFERENCES carried to a stay's detail page — nothing here checks
  // availability. Validated so a malformed or past value is never shown or passed on.
  const { checkIn, checkOut, guests } = readStayPreferences({ checkIn: rawCheckIn, checkOut: rawCheckOut, guests: rawGuests });
  const preferenceParts = describeStayPreferences({ checkIn, checkOut, guests });
  const query = q?.trim();

  return (
    <main id="main-content" className="px-6 py-10 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-[1440px] space-y-6">
        <BackButton fallbackHref="/stays" label="Back to Apex Stays" />

        <div className="">
          <p className="text-md font-semibold uppercase tracking-[0.16em] text-apex-600">Apex Stays</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            {query ? `Stays matching “${query}”${destination ? ` in ${destination}` : ''}` : destination ? `Stays in ${destination}` : 'All Himalayan Stays'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {preferenceParts.length > 0 ? `Your preferences: ${preferenceParts.join(' · ')}` : 'No dates or guest count set'}
          </p>
          {preferenceParts.length > 0 ? <p className="mt-1 text-xs text-slate-500">{STAY_PREFERENCES_DISCLAIMER}</p> : null}
          <StaySearch
            defaultDestination={destination}
            defaultQuery={query}
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
          key={`${destination ?? ''}:${query ?? ''}:${page ?? ''}:${type ?? ''}:${priceMax ?? ''}:${amenity ?? ''}:${mood ?? ''}:${category ?? ''}`}
          fallback={<SkeletonGrid count={4} className="md:grid-cols-2 lg:grid-cols-3" />}
        >
          <StaySearchResults
            destination={destination}
            query={query}
            page={page}
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
  query?: string;
  page?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  type?: string;
  priceMax?: string;
  amenity?: string;
  mood?: string;
  category?: string;
}

/** A curated (publicly listed) hotel as a search candidate, so q is matched with the same rules as cached stays. */
function curatedCandidate(hotel: HotelPackage): StayCandidate {
  return { placeId: `curated:${hotel.slug}`, name: hotel.title, formattedAddress: hotel.location, tags: [{ destinationSlug: '', searchLocation: hotel.location }] };
}

function pageHref(params: Record<string, string | undefined>, page: number): string {
  const search = new URLSearchParams();
  Object.entries({ ...params, page: page > 1 ? String(page) : undefined }).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `/stays/search?${qs}` : '/stays/search';
}

function formatCacheDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

async function StaySearchResults({ destination, query, page: pageParam, checkIn, checkOut, guests, type, priceMax, amenity, mood, category: categoryParam }: StaySearchResultsProps) {
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
  const categoryRequestedButUnresolved = isCategoryRequestedButUnresolved(categoryParam, Boolean(stayType || stayMood));
  const shouldForceEmpty = typeRequestedButUnresolved || moodRequestedButUnresolved || priceRequestedButInvalid || categoryRequestedButUnresolved;

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

  const noTitles = new Map<string, string>();
  const hotels: HotelPackage[] = scoped.filter((hotel) => {
    const price = hotel.places?.customPrice ?? hotel.pricePerNight;
    if (priceMaxValue !== undefined && price > priceMaxValue) return false;
    if (amenity && !hotel.amenities?.includes(amenity)) return false;
    if (query && scoreStayText(curatedCandidate(hotel), query, noTitles) === 0) return false;
    return true;
  });

  // Google-sourced stays carry no price/amenity/description data, so a price ceiling,
  // amenity, mood-keyword or boutique(`featured`)-only filter can never be honestly
  // verified against them — rather than silently dropping them (invisible) or silently
  // including them (implying they satisfy a filter that was never checked), cached Google
  // stays are simply not included while any such filter is active. "Heritage" is
  // also excluded — Google's cache has no heritage-specific category (see
  // app/stays/[...segments]/page.tsx's identical exclusion for the same reason).
  // A forced-empty search (an unresolved type/mood/category or an invalid priceMax) must
  // also skip the cached Google stays — otherwise they would still render for a filter
  // that matched nothing, the same silent full-catalog fall-through shouldForceEmpty
  // exists to prevent for the curated hotels.
  const includeGoogleData = !shouldForceEmpty && !isBoutiqueOnly && !moodKeyword && priceMaxValue === undefined && !amenity && category !== 'Heritage';
  const googleStayType = includeGoogleData && category ? CATEGORY_TO_STAY_TYPE[category] : undefined;

  const requestedPage = parsePageParam(pageParam);
  const start = (requestedPage - 1) * STAYS_PAGE_SIZE;
  // Curated (publicly listed) stays lead the list, ranked by the same text rules when q is set.
  const rankedHotels = query
    ? hotels
        .map((hotel, index) => ({ hotel, index, score: scoreStayText(curatedCandidate(hotel), query, noTitles) }))
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map((entry) => entry.hotel)
    : hotels;
  const curatedAsStays = rankedHotels.map((hotel) => hotelToStay(hotel));

  // Cache-only (never Google). Eligibility, exclusions AND the curated-duplicate removal all happen inside
  // searchEligibleStays BEFORE counting and paging, so totals and pages are exact. The destination text and
  // q are both honoured: a destination that is not a published destination must name a stay-base locality
  // that is really stored, otherwise nothing matches.
  let google: EligibleStaysOutcome = { status: 'ok', stays: [], totalCount: 0 };
  if (includeGoogleData) {
    google = await searchEligibleStays({ q: query, destination, stayType: googleStayType, curated: curatedAsStays, offset: start, limit: STAYS_PAGE_SIZE });
  }

  const unavailable = google.status === 'unavailable';
  // Curated-only listing (a filter that cached Google stays cannot satisfy, or the cached list is unavailable).
  const curatedStaysPage = paginate(curatedAsStays, requestedPage, STAYS_PAGE_SIZE);
  const googleOk = includeGoogleData && google.status === 'ok' ? google : null;
  const finalStays: Stay[] | null = includeGoogleData ? (googleOk ? googleOk.stays : curatedStaysPage.items) : null;
  const resultCount = googleOk ? googleOk.totalCount : includeGoogleData ? curatedAsStays.length : hotels.length;
  const totalPages = Math.max(1, Math.ceil(resultCount / STAYS_PAGE_SIZE));
  const outOfRange = resultCount > 0 && requestedPage > totalPages;
  const pagedHotels = includeGoogleData ? [] : paginate(rankedHotels, requestedPage, STAYS_PAGE_SIZE).items;

  const currentParams: Record<string, string | undefined> = { destination, q: query, checkIn, checkOut, guests, type, priceMax, amenity, mood };
  const pagerParams: Record<string, string | undefined> = { ...currentParams, category: categoryParam };

  const filters = (
    <StayFilters
      currentParams={currentParams}
      amenityOptions={amenityOptions}
      activePriceMax={priceMax}
      activeType={type}
      activeAmenity={amenity}
      resultCount={resultCount}
      priceBounds={priceBounds}
    />
  );

  if (google.status === 'ambiguous' && curatedAsStays.length === 0) {
    return (
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        {filters}
        <div className={cn(FILTER_EMPTY_STATE_CLASS, 'flex-1')}>
          <p className="text-lg font-semibold text-slate-900">Which place did you mean?</p>
          <p className="mt-3 text-slate-600">“{destination}” matches places in more than one region. Pick one to see its stays.</p>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {google.destinations.map((option) => (
              <li key={option.slug}>
                <Link href={pageHref({ ...pagerParams, destination: option.title }, 1)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                  {option.title}
                  {option.state ? `, ${option.state}` : ''}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (unavailable && curatedAsStays.length === 0) {
    // The exclusion list (or the published-destination list) could not be read: Google-sourced
    // stays are withheld entirely instead of being shown unfiltered.
    return (
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        {filters}
        <div className={cn(FILTER_EMPTY_STATE_CLASS, 'flex-1')} role="status">
          <p className="text-lg font-semibold text-slate-900">Stays are temporarily unavailable.</p>
          <p className="mt-3 text-slate-600">We couldn&apos;t load stay listings just now. Please try again in a moment, or explore our curated Journeys.</p>
          <Link
            href="/journeys"
            className="cursor-hover mt-6 inline-flex items-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
          >
            Explore Journeys
          </Link>
        </div>
      </div>
    );
  }

  if (resultCount === 0) {
    // Whether *anything* the visitor chose narrowed the result set — if not, an empty
    // result means the catalog itself has nothing right now, not that their destination/
    // type/price/amenity/mood choice was too narrow. Blaming a search that was never
    // made would be dishonest, so this needs its own message rather than reusing the
    // filtered-empty copy below.
    const hasActiveFilters = Boolean(destination || query || type || priceMax || amenity || mood || categoryParam);
    return (
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        {filters}
        <div className={cn(FILTER_EMPTY_STATE_CLASS, 'flex-1')}>
          {hasActiveFilters ? (
            <>
              <p className="text-lg font-semibold text-slate-900">No stays match your search.</p>
              <p className="mt-3 text-slate-600">Try a different property name, destination, stay type, or price range.</p>
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

  const cacheAge = google.status === 'ok' ? google.cacheAge : undefined;

  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
      {filters}
      <div className="min-w-0 flex-1 space-y-4">
        {unavailable ? (
          <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Some stay listings are temporarily unavailable right now, so only part of the results are shown.
          </p>
        ) : null}
        {outOfRange ? (
          <div className={cn(FILTER_EMPTY_STATE_CLASS)}>
            <p className="text-lg font-semibold text-slate-900">That page doesn&apos;t exist.</p>
            <p className="mt-3 text-slate-600">
              This search has {resultCount} {resultCount === 1 ? 'stay' : 'stays'} across {totalPages} {totalPages === 1 ? 'page' : 'pages'}.
            </p>
            <Link href={pageHref(pagerParams, 1)} className="mt-4 inline-block text-sm font-semibold text-apex-600 hover:text-apex-700">
              Go to the first page
            </Link>
          </div>
        ) : finalStays ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {finalStays.map((stay, index) => (
              <StayCard key={`${stay.placeId}-${index}`} stay={stay} priority={index < 4} />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pagedHotels.map((hotel, index) => (
              <PropertyCard key={hotel.slug} hotel={hotel} checkIn={checkIn} checkOut={checkOut} guests={guests} priority={index < 4} />
            ))}
          </div>
        )}

        {totalPages > 1 && !outOfRange ? (
          <nav aria-label="Stay results pages" className="flex items-center justify-center gap-4 pt-2 text-sm">
            {requestedPage > 1 ? (
              <Link href={pageHref(pagerParams, requestedPage - 1)} rel="prev" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">
                Previous
              </Link>
            ) : null}
            <span className="text-slate-600">
              Page {requestedPage} of {totalPages}
            </span>
            {requestedPage < totalPages ? (
              <Link href={pageHref(pagerParams, requestedPage + 1)} rel="next" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">
                Next
              </Link>
            ) : null}
          </nav>
        ) : null}

        {cacheAge && !outOfRange ? (
          <p className="text-center text-xs text-slate-500">
            Listing details come from cached provider data (last updated {formatCacheDate(cacheAge.oldest)}
            {cacheAge.newest.slice(0, 10) !== cacheAge.oldest.slice(0, 10) ? ` – ${formatCacheDate(cacheAge.newest)}` : ''}). Live availability and prices are not shown.
          </p>
        ) : null}
      </div>
    </div>
  );
}
