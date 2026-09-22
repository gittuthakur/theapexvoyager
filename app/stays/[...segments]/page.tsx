import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, Car, ExternalLink, Globe, MapPin, Sparkles, Users } from 'lucide-react';
import PropertyCard from '@/components/modules/PropertyCard';
import StaysGrid, { StayCard } from '@/components/modules/StaysGrid';
import { PropertyPhotoGallery } from '@/components/modules/stays/PropertyPhotoGallery';
import { hotelToStay, dedupeAgainstCurated } from '@/lib/stayMerge';
import HotelBookingModal from '@/components/modules/HotelBookingModal';
import WhatsAppEnquireButton from '@/components/modules/WhatsAppEnquireButton';
import StayHero from '@/components/modules/stays/StayHero';
import DetailPageContainer from '@/components/modules/detail/DetailPageContainer';
import BackButton from '@/components/ui/BackButton';
import { SafeImage } from '@/components/ui/SafeImage';
import { MediaPlaceholder } from '@/components/ui/MediaPlaceholder';
import { getHotels, getHotelBySlug } from '@/lib/hotels';
import { getPackagesByDestinationSlug } from '@/lib/packages';
import { getCuratedDestinationBySlug } from '@/lib/destinations';
import { getCachedStaysCatalog, getStayByPlaceId } from '@/lib/stays';
import { getStayLocationContext, type StayMode } from '@/lib/stayLocation';
import { primaryDestinationName } from '@/lib/experiences';
import { destinations } from '@/config/destinations.config';
import { findStayTypeBySlug } from '@/config/stayTypes.config';
import { CATEGORY_TO_STAY_TYPE, STAY_TYPE_LABELS, type Stay, type StayType } from '@/types/stay';
import { formatINR } from '@/lib/pricing';
import type { HotelPackage } from '@/types';
import type { Destination } from '@/types/destination';

export const dynamic = 'force-dynamic';

interface StaysCatchAllPageProps {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string; page?: string }>;
}

/**
 * A single dynamic segment can't be a type slug, a destination slug, and a
 * property slug at once, so this resolves by segment count + a fixed lookup
 * order (cheap static lookups first, the one real DB read last):
 *   1 segment  → known stay-type slug → destination slug → else a property slug
 *   2 segments → [destinationSlug, typeSlug] combined listing
 *   3+ segments → not found (no deeper combos yet)
 */
async function resolveSegments(segments: string[]) {
  if (segments.length === 1) {
    const [slug] = segments;
    const stayType = findStayTypeBySlug(slug);
    if (stayType) return { kind: 'type' as const, stayType };

    const destination = await getCuratedDestinationBySlug(slug);
    if (destination) return { kind: 'destination' as const, destination };

    const hotel = await getHotelBySlug(slug);
    if (hotel) return { kind: 'property' as const, hotel };

    return { kind: 'not-found' as const };
  }

  if (segments.length === 2 && segments[0] === 'property') {
    // A Google-backed property's own detail page — keyed by its real, globally
    // unique Place ID (never a slug: the same real place can have several different
    // cached `slug` values, one per destinationSlug it's tagged under — see
    // models/PlaceCache.ts's index comment — so only placeId is a safe, stable
    // identifier for a canonical URL). No `destinationSlug` is ever literally named
    // "property", so this never collides with the combined-listing case below.
    const stay = await getStayByPlaceId(segments[1]);
    if (stay) return { kind: 'google-property' as const, stay };
    return { kind: 'not-found' as const };
  }

  if (segments.length === 2) {
    const [destinationSlug, typeSlug] = segments;
    const destination = await getCuratedDestinationBySlug(destinationSlug);
    const stayType = findStayTypeBySlug(typeSlug);
    if (destination && stayType) return { kind: 'combined' as const, destination, stayType };
    return { kind: 'not-found' as const };
  }

  return { kind: 'not-found' as const };
}

export async function generateMetadata({ params }: StaysCatchAllPageProps): Promise<Metadata> {
  const { segments } = await params;
  const resolved = await resolveSegments(segments);

  switch (resolved.kind) {
    case 'type': {
      const typeTitle = `${resolved.stayType.label} in the Himalayas | Apex Stays`;
      return {
        title: typeTitle,
        description: resolved.stayType.description,
        alternates: { canonical: `/stays/${resolved.stayType.slug}` },
        openGraph: { title: typeTitle, description: resolved.stayType.description, url: `/stays/${resolved.stayType.slug}` },
        twitter: { card: 'summary', title: typeTitle, description: resolved.stayType.description }
      };
    }
    case 'destination': {
      const destinationTitle = `Stays in ${resolved.destination.title} | Apex Stays`;
      const destinationDescription = `Hotels, homestays, resorts and unique stays in ${resolved.destination.title}.`;
      return {
        title: destinationTitle,
        description: destinationDescription,
        alternates: { canonical: `/stays/${resolved.destination.slug}` },
        openGraph: { title: destinationTitle, description: destinationDescription, url: `/stays/${resolved.destination.slug}` },
        twitter: { card: 'summary', title: destinationTitle, description: destinationDescription },
        // Not indexed — a pre-commit audit found these pages are template-identical
        // once the destination name is normalized out (thin/duplicate content), and
        // the stay listings they show are unstable Google-Places-cache results, not
        // stable curated content. Still `follow`ed (and still fully linked/functional
        // for visitors) so internal link equity and normal browsing are unaffected —
        // only search-engine indexing is opted out. See app/sitemap.ts's matching note.
        robots: { index: false, follow: true }
      };
    }
    case 'combined': {
      const combinedTitle = `${resolved.stayType.label} in ${resolved.destination.title} | Apex Stays`;
      const combinedDescription = `${resolved.stayType.label} and other verified stays in ${resolved.destination.title}.`;
      return {
        title: combinedTitle,
        description: combinedDescription,
        alternates: { canonical: `/stays/${resolved.destination.slug}/${resolved.stayType.slug}` },
        openGraph: { title: combinedTitle, description: combinedDescription, url: `/stays/${resolved.destination.slug}/${resolved.stayType.slug}` },
        twitter: { card: 'summary', title: combinedTitle, description: combinedDescription },
        // Not indexed — same thin-content/unstable-Google-Places reasoning as the
        // `destination` case above, plus many combinations render an honest empty
        // "no stays match" state. `follow`ed so it stays fully linked/functional.
        robots: { index: false, follow: true }
      };
    }
    case 'property': {
      const propertyTitle = `${resolved.hotel.title} | Apex Stays`;
      const propertyImage = resolved.hotel.images[0];
      return {
        title: propertyTitle,
        description: resolved.hotel.description,
        alternates: { canonical: `/stays/${resolved.hotel.slug}` },
        openGraph: propertyImage ? { title: propertyTitle, description: resolved.hotel.description, images: [{ url: propertyImage, alt: resolved.hotel.title }] } : undefined,
        twitter: { card: propertyImage ? 'summary_large_image' : 'summary', title: propertyTitle, description: resolved.hotel.description, images: propertyImage ? [propertyImage] : undefined }
      };
    }
    case 'google-property': {
      const googlePropertyTitle = `${resolved.stay.name} | Apex Stays`;
      const googlePropertyDescription = resolved.stay.formattedAddress
        ? `${STAY_TYPE_LABELS[resolved.stay.stayType]} in ${resolved.stay.formattedAddress}.`
        : `${STAY_TYPE_LABELS[resolved.stay.stayType]} on Apex Stays.`;
      const googlePropertyImage = resolved.stay.photos[0];
      return {
        title: googlePropertyTitle,
        description: googlePropertyDescription,
        alternates: { canonical: `/stays/property/${resolved.stay.placeId}` },
        openGraph: googlePropertyImage ? { title: googlePropertyTitle, description: googlePropertyDescription, images: [{ url: googlePropertyImage, alt: resolved.stay.name }] } : undefined,
        twitter: { card: googlePropertyImage ? 'summary_large_image' : 'summary', title: googlePropertyTitle, description: googlePropertyDescription, images: googlePropertyImage ? [googlePropertyImage] : undefined },
        // Not indexed — ephemeral Google-Places-backed data with no live pricing/
        // availability (see resolveSegments's 'google-property' case), never stable
        // curated content. `follow`ed so it stays fully linked/functional for visitors.
        robots: { index: false, follow: true }
      };
    }
    default:
      return { title: 'Stay Not Found | Apex Stays', robots: { index: false, follow: false } };
  }
}

export default async function StaysCatchAllPage({ params, searchParams }: StaysCatchAllPageProps) {
  const { segments } = await params;
  const { checkIn, checkOut, guests, page: pageParam } = await searchParams;
  const resolved = await resolveSegments(segments);

  if (resolved.kind === 'not-found') {
    notFound();
  }

  if (resolved.kind === 'type') {
    const hotels = await getHotels(resolved.stayType.category ? { category: resolved.stayType.category } : undefined);
    const scoped = resolved.stayType.category ? hotels : hotels.filter((hotel) => hotel.featured);

    // Google Places' cache only ever has the 6 real categories in types/stay.ts's
    // StayType — "Heritage" (a curated-only, colonial-character concept Google's text
    // search never specifically verifies) and "boutique-stays" (no category at all,
    // purely a curated `featured` flag) have no faithful Google equivalent. Forcing
    // generic Google hotel results under a "Heritage Stays" heading would present
    // unverified properties as having heritage character they were never checked for
    // — an honest curated-only (today: honestly empty) page beats a fake one.
    const googleStayType =
      resolved.stayType.category && resolved.stayType.category !== 'Heritage' ? CATEGORY_TO_STAY_TYPE[resolved.stayType.category] : undefined;

    if (!googleStayType) {
      return <StayListing eyebrow="Apex Stays" title={resolved.stayType.label} subtitle={resolved.stayType.description} hotels={scoped} />;
    }

    const requestedPage = Number(pageParam) > 0 ? Math.floor(Number(pageParam)) : 1;
    const catalogPage = await getCachedStaysCatalog({ stayType: googleStayType, page: requestedPage });
    // Curated stays are only prepended on page 1 — they're a small, fixed set, not
    // something to re-show (or paginate) on every subsequent Google-backed page.
    const curatedAsStays = requestedPage === 1 ? scoped.map((hotel) => hotelToStay(hotel)) : [];
    const combinedStays: Stay[] = [...curatedAsStays, ...dedupeAgainstCurated(curatedAsStays, catalogPage.stays)];

    return (
      <StayListing
        eyebrow="Apex Stays"
        title={resolved.stayType.label}
        subtitle={resolved.stayType.description}
        hotels={[]}
        catalog={{
          stays: combinedStays,
          page: catalogPage.page,
          totalPages: catalogPage.totalPages,
          basePath: `/stays/${resolved.stayType.slug}`
        }}
      />
    );
  }

  if (resolved.kind === 'destination') {
    const stayContext = getStayLocationContext(resolved.destination);
    const hotels = await getHotels({ locations: stayContext.searchLocations, destinationSlug: resolved.destination.slug });
    return (
      <StayListing
        eyebrow="Apex Stays"
        title={stayContext.headingLabel}
        subtitle={stayContext.helperText ?? `Hotels, homestays, resorts and unique stays in ${stayContext.destinationName}.`}
        hotels={hotels}
        emptyMessage={stayContext.emptyStateMessage}
        googleSection={{
          location: stayContext.primaryStayLocation,
          state: resolved.destination.state,
          destinationSlug: resolved.destination.slug,
          stayMode: toStayGridMode(stayContext.stayMode),
          emptyStateMessage: stayContext.emptyStateMessage
        }}
      />
    );
  }

  if (resolved.kind === 'combined') {
    const stayContext = getStayLocationContext(resolved.destination);
    const hotels = await getHotels({
      category: resolved.stayType.category,
      locations: stayContext.searchLocations,
      destinationSlug: resolved.destination.slug
    });
    // Google Places has no equivalent of the curated-only "boutique-stays" (`featured`
    // flag) category — a combined page for a slug with no real HotelCategory mapping
    // (only "boutique-stays" today) stays curated-only, same as before this fix.
    const stayTypeFilter = resolved.stayType.category ? CATEGORY_TO_STAY_TYPE[resolved.stayType.category] : undefined;
    return (
      <StayListing
        eyebrow="Apex Stays"
        title={`${resolved.stayType.label} in ${stayContext.destinationName}`}
        subtitle={stayContext.helperText ?? `${resolved.stayType.label} available in ${stayContext.destinationName}.`}
        hotels={hotels}
        emptyMessage={stayContext.emptyStateMessage}
        googleSection={
          stayTypeFilter
            ? {
                location: stayContext.primaryStayLocation,
                state: resolved.destination.state,
                destinationSlug: resolved.destination.slug,
                stayMode: toStayGridMode(stayContext.stayMode),
                stayTypeFilter,
                emptyStateMessage: stayContext.emptyStateMessage
              }
            : undefined
        }
      />
    );
  }

  if (resolved.kind === 'google-property') {
    return <GooglePropertyDetail stay={resolved.stay} />;
  }

  return <PropertyDetail hotel={resolved.hotel} checkIn={checkIn} checkOut={checkOut} guests={guests} />;
}

// getStayLocationContext's `stayMode` also carries 'unavailable' (no authored rule for
// this destination) — StaysGrid only understands the three real modes, so 'unavailable'
// becomes "no mode" rather than a fourth, unhandled value.
function toStayGridMode(mode: StayMode | 'unavailable'): StayMode | undefined {
  return mode === 'unavailable' ? undefined : mode;
}

interface GoogleStaysSection {
  location: string;
  state?: string;
  destinationSlug: string;
  stayMode?: StayMode;
  stayTypeFilter?: StayType;
  emptyStateMessage?: string;
}

interface CatalogSection {
  /** Already merged (curated + deduped Google), already paginated server-side —
   *  see lib/stays.ts's getCachedStaysCatalog. Never the full cache in one response. */
  stays: Stay[];
  page: number;
  totalPages: number;
  /** Used to build `?page=N` links — no client JS needed for pagination. */
  basePath: string;
}

function StayListing({
  eyebrow,
  title,
  subtitle,
  hotels,
  emptyMessage,
  googleSection,
  catalog
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  hotels: HotelPackage[];
  emptyMessage?: string;
  /** When set, this listing also merges in real, cache-backed Google Places stays for
   *  this one destination (via StaysGrid — the exact same component and merge/dedupe/
   *  honest-empty-state logic already proven on the destination detail page's own
   *  "Where to stay" section) instead of showing curated Hotel documents only. Curated
   *  stays here published nothing before this fix — the ~14 seed Hotel records are all
   *  `publiclyListed: false` (models/Hotel.ts), and no code path had ever connected this
   *  route to the real Google-backed Stay discovery that already existed in PlaceCache. */
  googleSection?: GoogleStaysSection;
  /** Cross-destination category browsing (e.g. /stays/hotels) — a server-computed,
   *  already-paginated, placeId-deduped page of PlaceCache-backed stays spanning every
   *  cached destination. Takes priority over `googleSection`/`hotels` when present. */
  catalog?: CatalogSection;
}) {
  return (
    <main id="main-content" className="px-6 py-10 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-[1440px] space-y-5">
        <BackButton fallbackHref="/stays" label="Back to Apex Stays" />

        <div className="">
          <p className="text-md font-semibold uppercase tracking-[0.16em] text-apex-600">{eyebrow}</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>
        </div>

        {catalog ? (
          <CatalogListing {...catalog} emptyMessage={emptyMessage} />
        ) : googleSection ? (
          <StaysGrid
            location={googleSection.location}
            state={googleSection.state}
            destinationSlug={googleSection.destinationSlug}
            curatedStays={hotels}
            stayMode={googleSection.stayMode}
            stayTypeFilter={googleSection.stayTypeFilter}
            emptyStateMessage={emptyMessage ?? googleSection.emptyStateMessage}
          />
        ) : hotels.length === 0 ? (
          <div className="rounded-2xl border border-slate-300 bg-white p-10 text-center text-slate-600 shadow-glow">
            <p className="text-lg font-semibold text-slate-900">{emptyMessage ?? 'No stays match this yet.'}</p>
            <p className="mt-3">Try browsing all stays instead.</p>
            <Link href="/stays" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-apex-600 hover:text-apex-700">
              Back to Apex Stays <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {hotels.map((hotel, index) => (
              <PropertyCard key={hotel.slug} hotel={hotel} priority={index < 4} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

// Pure server-rendered grid + Prev/Next links for a cross-destination catalog page —
// no client JS, no fetch: the data arrives already merged, deduped and paginated
// (lib/stays.ts's getCachedStaysCatalog). Distinct from StaysGrid, which is a client
// component that fetches one destination's stays and offers a type-filter toggle —
// neither applies here, since this page already covers every destination for one type.
function CatalogListing({ stays, page, totalPages, basePath, emptyMessage }: CatalogSection & { emptyMessage?: string }) {
  if (stays.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage ?? 'No stays match this yet.'}</p>;
  }

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {stays.map((stay, index) => (
          <StayCard key={`${stay.placeId}-${index}`} stay={stay} priority={index < 4} />
        ))}
      </div>

      {totalPages > 1 ? (
        <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Pagination">
          {page > 1 ? (
            <Link
              href={`${basePath}?page=${page - 1}`}
              className="cursor-hover rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-apex-400 hover:text-slate-900"
            >
              Previous
            </Link>
          ) : null}
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`${basePath}?page=${page + 1}`}
              className="cursor-hover rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-apex-400 hover:text-slate-900"
            >
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

interface PropertyDetailProps {
  hotel: HotelPackage;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}

async function PropertyDetail({ hotel, checkIn, checkOut, guests }: PropertyDetailProps) {
  // Best-effort match against the curated destinations directory, purely for the
  // honest cross-sell modules below (nearby experiences, similar journeys) — the
  // Hotel model itself has no destinationSlug foreign key today.
  const matchedDestination: Destination | undefined = destinations.find((destination) =>
    hotel.location.toLowerCase().includes(primaryDestinationName(destination.title).toLowerCase())
  );

  const [similarStays, nearbyJourneys] = await Promise.all([
    getHotels({ category: hotel.category }),
    matchedDestination ? getPackagesByDestinationSlug(matchedDestination.slug) : Promise.resolve([])
  ]);
  const otherStays = similarStays.filter((stay) => stay.slug !== hotel.slug).slice(0, 3);
  const journeys = nearbyJourneys.slice(0, 2);

  const price = hotel.places?.customPrice ?? hotel.pricePerNight;
  const galleryImages = hotel.images;

  return (
    <DetailPageContainer>
      <BackButton
        fallbackHref={matchedDestination ? `/destinations/${matchedDestination.slug}` : '/stays'}
        label="Back to Apex Stays"
      />

      <StayHero
        hotel={hotel}
        image={galleryImages[0] ?? ''}
        imagePlaceholderLabel={galleryImages[0] ? undefined : 'Photo not available yet'}
      />

      {galleryImages.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {galleryImages.slice(1).map((image, index) => (
            <div key={image} className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              <SafeImage src={image} alt={`${hotel.title} photo ${index + 2}`} fill sizes="112px" className="object-cover" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-glow">
        <div className="grid gap-8 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-8">
              {/* 1. About the Stay */}
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">About the Stay</p>
                <p className="mt-3 text-lg leading-8 text-slate-600">{hotel.description}</p>
              </div>

              {/* 2. Rooms — reserved: no rooms/inventory model exists yet (Phase 2) */}

              {/* 3. Amenities */}
              {hotel.amenities?.length ? (
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Amenities</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hotel.amenities.map((amenity) => (
                      <span key={amenity} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* 4-5. Location / Map — reserved: real map/marker experience is Phase 3 */}
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Location</p>
                <p className="mt-3 flex items-center gap-2 text-slate-600">
                  <MapPin size={16} className="text-apex-600" /> {hotel.location}
                </p>
              </div>

              {/* 6-7. House Rules / Cancellation Policy */}
              {hotel.cancellationPolicy || hotel.mealPlan ? (
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Good to Know</p>
                  <ul className="mt-3 space-y-1 text-slate-600">
                    {hotel.cancellationPolicy ? <li>• {hotel.cancellationPolicy}</li> : null}
                    {hotel.mealPlan ? <li>• {hotel.mealPlan}</li> : null}
                  </ul>
                </div>
              ) : null}

              {/* 8. Guest Reviews — reserved: no reviews collection yet (Phase 3) */}

              {/* 9. Nearby Experiences */}
              {matchedDestination?.experiences?.length ? (
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Make Your Stay Memorable</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {matchedDestination.experiences.slice(0, 5).map((experience) => (
                      <span key={experience} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600">
                        <Sparkles size={13} className="text-apex-600" /> {experience}
                      </span>
                    ))}
                  </div>
                  <Link href="/experiences" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-apex-600 hover:text-apex-700">
                    Add Experience <ArrowRight size={14} />
                  </Link>
                </div>
              ) : null}

              {/* 10. Nearby Attractions */}
              {matchedDestination?.places?.length ? (
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Nearby Attractions</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {matchedDestination.places.slice(0, 4).map((place) => (
                      <li key={place.title}>
                        <span className="font-semibold text-slate-900">{place.title}</span> — {place.description}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* 11. Nearby Transport */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Need a ride?</p>
                <p className="mt-1 text-sm text-slate-600">Airport transfers, sightseeing cabs, and private vehicles.</p>
                <Link href="/transport" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-apex-600 hover:text-apex-700">
                  <Car size={14} /> Add Transport
                </Link>
              </div>

              {/* Talk to a Travel Expert */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Need help choosing your stay?</p>
                <p className="mt-1 text-sm text-slate-600">Local destination knowledge, stay recommendations, and custom itinerary support.</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Link href="/experts" className="inline-flex items-center gap-1 text-sm font-semibold text-apex-600 hover:text-apex-700">
                    <Users size={14} /> Browse Travel Experts
                  </Link>
                  <WhatsAppEnquireButton
                    selection={{
                      name: hotel.title,
                      type: 'stay',
                      stayType: CATEGORY_TO_STAY_TYPE[hotel.category],
                      slug: hotel.slug,
                      destinationSlug: matchedDestination?.slug
                    }}
                    label="Ask on WhatsApp"
                  />
                </div>
              </div>

              {/* 20. Stay + Journey cross-sell */}
              {journeys.length > 0 ? (
                <div className="rounded-2xl border border-apex-100 bg-apex-50/40 p-5">
                  <p className="text-sm font-semibold text-slate-900">Complete Your Himalayan Escape</p>
                  <div className="mt-3 space-y-2">
                    {journeys.map((journey) => (
                      <Link
                        key={journey.slug}
                        href={`/journeys/${journey.slug}`}
                        className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition hover:text-slate-900"
                      >
                        <span>{journey.name}</span>
                        <span className="font-semibold text-slate-900">{formatINR(journey.price)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Availability CTA */}
            <aside className="h-fit space-y-6 rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center xl:sticky xl:top-24">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                {hotel.places?.customPrice ? 'Starting from' : 'Per night'}
              </p>
              <p className="text-3xl font-semibold text-slate-900">₹{price.toLocaleString('en-IN')}</p>
              <HotelBookingModal
                hotelName={hotel.title}
                hotelSlug={hotel.slug}
                destination={hotel.location}
                defaultCheckIn={checkIn}
                defaultCheckOut={checkOut}
                defaultGuests={guests ? Number(guests) : undefined}
              />
            </aside>
          </div>
        </div>

        {/* 12. Similar Stays */}
        {otherStays.length > 0 ? (
          <div>
            <h2 className="text-xl font-bold text-slate-900">Similar Stays</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {otherStays.map((stay) => (
                <PropertyCard key={stay.slug} hotel={stay} />
              ))}
            </div>
          </div>
        ) : null}
    </DetailPageContainer>
  );
}

// The detail page for a Google-backed Stay (/stays/property/<placeId>). Reads
// nothing but the same PlaceCache row every other Stay card already shows — no new
// Google call of any kind (see lib/stays.ts's getStayByPlaceId). Deliberately shows
// no room inventory or hotel-class star rating: no trusted source for either exists
// anywhere in this app today (audited 2026-09 — see types/stay.ts's HotelClass and
// types/stayInventory.ts's StayRoom doc comments), so this honestly says rooms will
// be confirmed on enquiry rather than fabricating cards, and never renders a star-
// class badge at all rather than inventing one from the Google guest rating.
async function GooglePropertyDetail({ stay }: { stay: Stay }) {
  const matchedDestination = await getCuratedDestinationBySlug(stay.destinationSlug);
  const locationLabel = matchedDestination?.title ?? stay.formattedAddress ?? stay.destinationSlug;

  return (
    <DetailPageContainer>
      <BackButton fallbackHref={matchedDestination ? `/destinations/${matchedDestination.slug}` : '/stays'} label="Back to Apex Stays" />

      <PropertyPhotoGallery photos={stay.photos} propertyName={stay.name} />

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
        <div className="grid gap-8 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-8">
            <div>
              <span className="inline-flex items-center rounded-full bg-apex-500 px-3 py-1 text-xs font-semibold text-white">
                {STAY_TYPE_LABELS[stay.stayType]}
              </span>
              <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{stay.name}</h1>
              <p className="mt-2 flex items-center gap-2 text-slate-600">
                <MapPin size={16} className="shrink-0 text-apex-600" /> {stay.formattedAddress ?? locationLabel}
              </p>

              {/* Google Guest Rating — deliberately NOT labeled "Hotel Class"/stars-only.
                  See this component's top comment: no trusted hotel-class source exists,
                  so no star-class badge is ever rendered, on this page or anywhere else. */}
              {stay.rating ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">{stay.rating.toFixed(1)} ★</span>
                  <span>Google Guest Rating{stay.userRatingCount ? ` · ${stay.userRatingCount.toLocaleString('en-IN')} reviews` : ''}</span>
                </div>
              ) : null}
            </div>

            {/* Room section — honest placeholder only. See this component's top
                comment: no verified room-inventory source is connected today. */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Rooms &amp; Rates</p>
              <p className="mt-1 text-sm text-slate-600">
                Exact room options, occupancy and pricing for this property will be confirmed with you directly when you enquire.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {stay.googleMapsUri ? (
                <a
                  href={stay.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-hover inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-apex-400 hover:text-slate-900"
                >
                  <MapPin size={14} /> View on Google Maps
                </a>
              ) : null}
              {stay.websiteUri ? (
                <a
                  href={stay.websiteUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-hover inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-apex-400 hover:text-slate-900"
                >
                  <Globe size={14} /> Visit Website <ExternalLink size={12} />
                </a>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Need a ride?</p>
              <p className="mt-1 text-sm text-slate-600">Airport transfers, sightseeing cabs, and private vehicles.</p>
              <Link href="/transport" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-apex-600 hover:text-apex-700">
                <Car size={14} /> Add Transport
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Need help choosing your stay?</p>
              <p className="mt-1 text-sm text-slate-600">Local destination knowledge, stay recommendations, and custom itinerary support.</p>
              <Link href="/experts" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-apex-600 hover:text-apex-700">
                <Users size={14} /> Browse Travel Experts
              </Link>
            </div>
          </div>

          <aside className="h-fit space-y-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center xl:sticky xl:top-24">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Starting from</p>
            <p className="text-2xl font-semibold text-slate-900">Contact for pricing</p>
            <p className="text-xs text-slate-500">
              Property and rating data from Google. No live availability or pricing is connected yet — our team will confirm current rates.
            </p>
            <WhatsAppEnquireButton
              className="w-full"
              label="Plan This Stay"
              selection={{ name: stay.name, type: 'stay', stayType: stay.stayType, slug: stay.slug, destinationSlug: stay.destinationSlug }}
            />
          </aside>
        </div>
      </div>
    </DetailPageContainer>
  );
}
