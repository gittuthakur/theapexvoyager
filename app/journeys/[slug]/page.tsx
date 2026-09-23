import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PackageDetailContent from '@/components/modules/PackageDetailContent';
import { getAllPackages, getPackageBySlug } from '@/lib/packages';
import { getCuratedDestinations } from '@/lib/destinations';
import { getPackageRegionIds } from '@/lib/packageFilters';
import { getAllRegions } from '@/lib/regions';
import { siteConfig } from '@/config/site.config';
import { buildBreadcrumbListSchema } from '@/lib/schema';
import JsonLd from '@/components/seo/JsonLd';

// The 'sikkim-mountain-escape' → 'uttarakhand-explorer' legacy-slug redirect (this
// journey's content was always Rishikesh/Haridwar/Mussoorie, Uttarakhand —
// 'sikkim-mountain-escape' was a leftover, incorrect slug from an earlier draft) now
// lives in next.config.mjs's redirects(), not here. This route has a loading.tsx, so
// an in-component permanentRedirect() — even one called before any await — was
// observed returning HTTP 200 on the wire: the framework started streaming that
// loading shell before the async page render reached the redirect check. A
// next.config.mjs redirect is resolved by Next's routing layer before this route ever
// renders, so it isn't subject to that race, and it correctly forwards a `?book=1`
// query string that a hand-built old link might still carry.

interface JourneyDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ book?: string }>;
}

const RELATED_JOURNEYS_LIMIT = 3;

const CHANDIGARH_PICKUP_NOTE =
  'Pickup is available from Chandigarh Airport, Chandigarh Railway Station, ISBT Sector 43, or a confirmed hotel/location within Chandigarh. Exact pickup time and additional charges, if applicable, are confirmed at the time of booking.';

interface JourneySeoOverride {
  title: string;
  h1: string;
  description: string;
  pickupNote: string;
}

// SEO copy for the two journeys targeting Chandigarh-origin search intent (Phase 2 of
// the Chandigarh keyword-mapping work — see the Phase 1 audit). Deliberately does NOT
// touch `pkg.name` itself: that field also drives the card title on the homepage,
// /journeys listing and related-journey cards site-wide, and changing it there would
// push this longer SEO text onto every one of those surfaces, not just these two detail
// pages. Every other journey falls through to the existing `${pkg.name} | ...` template
// below, completely unaffected.
const JOURNEY_SEO_OVERRIDES: Record<string, JourneySeoOverride> = {
  'manali-premium-escape': {
    title: 'Manali Tour Package from Chandigarh | 5D/4N',
    h1: 'Manali Tour Package from Chandigarh',
    description:
      'Book a 5D/4N Manali tour package from Chandigarh with Solang Valley adventure, Old Manali cafes, Hadimba Temple and a seasonal Rohtang Pass excursion.',
    pickupNote: CHANDIGARH_PICKUP_NOTE
  },
  'spiti-valley-adventure': {
    // Kinnaur, not just Spiti — Day 1 (Kalpa) and Day 2 (Nako) of this journey's real
    // itinerary are both Kinnaur-district stops, so this reflects the actual route
    // rather than marketing a separate Kinnaur-only product.
    title: 'Kinnaur Spiti Tour from Chandigarh | 7D/6N',
    h1: 'Kinnaur & Spiti Valley Tour from Chandigarh',
    description:
      'Book a 7D/6N Kinnaur & Spiti tour from Chandigarh via Kalpa and Nako to Key Monastery, Kaza, Hikkim and Langza on a real high-altitude circuit.',
    pickupNote: CHANDIGARH_PICKUP_NOTE
  },
  'himachal-himalayan-explorer': {
    // Shimla (Days 1-3) and Manali (Days 3-8) are both genuinely, substantively
    // covered by this journey's real itinerary — not passing mentions — and the
    // content is already couple-framed throughout (category: 'Honeymoon').
    title: 'Himachal Honeymoon Package from Chandigarh | 8D/7N',
    h1: 'Himachal Honeymoon Package from Chandigarh',
    description:
      'Book an 8D/7N Himachal honeymoon package from Chandigarh covering Shimla and Manali, with a candlelight dinner on Mall Road and Manikaran hot springs for two.',
    pickupNote: CHANDIGARH_PICKUP_NOTE
  },
  'kashmir-signature-journey': {
    title: 'Srinagar Gulmarg Pahalgam Tour Package | 6D/5N',
    h1: 'Srinagar Gulmarg Pahalgam Tour Package',
    description:
      'Book a 6D/5N Kashmir tour package to Srinagar, Gulmarg and Pahalgam, with a Dal Lake houseboat stay, Mughal Gardens and a Gulmarg gondola ride.',
    pickupNote:
      'Airport pickup and drop are included for this journey. Share your Srinagar arrival and departure details when booking.'
  },
  'dharamshala-dalhousie-escape': {
    title: 'Dharamshala Dalhousie Khajjiar Tour Package | 5D/4N',
    h1: 'Dharamshala Dalhousie Khajjiar Tour Package',
    description:
      'Book a 5D/4N Dharamshala Dalhousie Khajjiar family tour package with the Dalai Lama Temple, Bhagsu Waterfall, a Dalhousie colonial walk and Khajjiar meadows.',
    pickupNote:
      'Private transfers are included throughout this journey. Exact pickup point and time are confirmed at the time of booking.'
  },
  'uttarakhand-explorer': {
    title: 'Rishikesh Haridwar Mussoorie Tour Package | 6D/5N',
    h1: 'Rishikesh Haridwar Mussoorie Tour Package',
    description:
      'Book a 6D/5N Rishikesh Haridwar Mussoorie tour package with Ganga Aarti, seasonal white-water rafting, ashram yoga and Mussoorie hill views.',
    pickupNote:
      'Private vehicle transfers are included throughout this journey. Exact pickup point and time are confirmed at the time of booking.'
  }
};

export async function generateMetadata({ params }: JourneyDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  // The page body's own notFound() call (below) determines the actual HTTP status —
  // this can't call notFound() itself (metadata resolution and the page body are
  // independent; tested directly, having generateMetadata also call notFound() here
  // doesn't change the response's HTTP status, a framework streaming characteristic
  // this fix doesn't attempt to correct). What this can honestly do is keep an invalid
  // slug's page out of the index even while its status stays 200 on the wire.
  if (!pkg) return { robots: { index: false, follow: false } };
  // Previously only title/description were set, so canonical and every Open Graph tag
  // silently inherited the root layout's generic homepage defaults (title "The Apex
  // Voyager", the homepage description/URL, no image) — sharing any specific journey's
  // link produced a homepage-branded preview card instead of that journey's own.
  // `alternates.canonical` is relative and carries no query string, so a `?book=1`
  // variant of this same URL canonicalizes back to the bare journey URL automatically.
  const seoOverride = JOURNEY_SEO_OVERRIDES[pkg.slug];
  const title = seoOverride ? `${seoOverride.title} | The Apex Voyager India` : `${pkg.name} | The Apex Voyager India`;
  const description = seoOverride ? seoOverride.description : pkg.shortDescription;
  const canonicalPath = `/journeys/${pkg.slug}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: { type: 'website', title, description, url: canonicalPath, images: [{ url: pkg.image, alt: pkg.name }] },
    twitter: { card: 'summary_large_image', title, description, images: [pkg.image] }
  };
}

export default async function JourneyDetailPage({ params, searchParams }: JourneyDetailPageProps) {
  const { slug } = await params;
  const { book } = await searchParams;
  const pkg = await getPackageBySlug(slug);

  if (!pkg) {
    notFound();
  }

  // Real catalog data only — same category first, then any other journey, excluding
  // this one. With only a handful of journeys in the catalog this is effectively "the
  // rest of the catalog," which is fine: it's real, not invented.
  const allPackages = await getAllPackages();
  const others = allPackages.filter((candidate) => candidate.slug !== pkg.slug);
  const sameCategory = others.filter((candidate) => candidate.category === pkg.category);
  const relatedJourneys = [...sameCategory, ...others.filter((candidate) => !sameCategory.includes(candidate))].slice(
    0,
    RELATED_JOURNEYS_LIMIT
  );

  // Same region-derivation the /journeys listing already uses for its own PackageCard
  // (getPackageRegionIds → regions.find().shortName) — reused here rather than a second
  // mapping system, so related-journey cards on this page carry the same region badge.
  const destinations = await getCuratedDestinations();
  const destinationsBySlug = new Map(destinations.map((destination) => [destination.slug, destination]));
  const regions = getAllRegions();
  const relatedJourneyRegionLabels: Record<string, string> = {};
  for (const journey of relatedJourneys) {
    const regionId = getPackageRegionIds(journey, destinationsBySlug)[0];
    const label = regionId ? regions.find((region) => region.id === regionId)?.shortName : undefined;
    if (label) relatedJourneyRegionLabels[journey.slug] = label;
  }

  return (
    <>
      <JsonLd
        data={buildBreadcrumbListSchema([
          { name: 'Home', url: siteConfig.url },
          { name: 'Journeys', url: `${siteConfig.url}/journeys` },
          { name: pkg.name, url: `${siteConfig.url}/journeys/${pkg.slug}` }
        ])}
      />
      <PackageDetailContent
        pkg={pkg}
        autoOpenBooking={book === '1'}
        heroTitleOverride={JOURNEY_SEO_OVERRIDES[pkg.slug]?.h1}
        pickupNote={JOURNEY_SEO_OVERRIDES[pkg.slug]?.pickupNote}
        relatedJourneys={relatedJourneys}
        relatedJourneyRegionLabels={relatedJourneyRegionLabels}
      />
    </>
  );
}
