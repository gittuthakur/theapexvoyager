import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PackageDetailContent from '@/components/modules/PackageDetailContent';
import { getAllPackages, getPackageBySlug } from '@/lib/packages';
import { getCuratedDestinations } from '@/lib/destinations';
import { getPackageRegionIds } from '@/lib/packageFilters';
import { getAllRegions } from '@/lib/regions';

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

export async function generateMetadata({ params }: JourneyDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) return {};
  // Previously only title/description were set, so canonical and every Open Graph tag
  // silently inherited the root layout's generic homepage defaults (title "The Apex
  // Voyager", the homepage description/URL, no image) — sharing any specific journey's
  // link produced a homepage-branded preview card instead of that journey's own.
  // `alternates.canonical` is relative and carries no query string, so a `?book=1`
  // variant of this same URL canonicalizes back to the bare journey URL automatically.
  const title = `${pkg.name} | The Apex Voyager`;
  const description = pkg.shortDescription;
  const canonicalPath = `/journeys/${pkg.slug}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: { title, description, url: canonicalPath, images: [{ url: pkg.image, alt: pkg.name }] }
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
    <PackageDetailContent
      pkg={pkg}
      autoOpenBooking={book === '1'}
      relatedJourneys={relatedJourneys}
      relatedJourneyRegionLabels={relatedJourneyRegionLabels}
    />
  );
}
