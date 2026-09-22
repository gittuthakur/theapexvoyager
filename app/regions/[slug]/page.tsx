import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BackButton from '@/components/ui/BackButton';
import WhatsAppButton from '@/components/modules/WhatsAppButton';
import DetailPageContainer from '@/components/modules/detail/DetailPageContainer';
import DetailSectionNav from '@/components/modules/detail/DetailSectionNav';
import RegionHero from '@/components/modules/regions/RegionHero';
import RegionOverview from '@/components/modules/regions/RegionOverview';
import RegionDestinations from '@/components/modules/regions/RegionDestinations';
import RegionJourneys from '@/components/modules/regions/RegionJourneys';
import RegionStays from '@/components/modules/regions/RegionStays';
import RegionExperiences from '@/components/modules/regions/RegionExperiences';
import RegionTransport from '@/components/modules/regions/RegionTransport';
import RegionTravelGuide from '@/components/modules/regions/RegionTravelGuide';
import RegionExperts from '@/components/modules/regions/RegionExperts';
import RegionFinalCTA from '@/components/modules/regions/RegionFinalCTA';
import { getRegionHubData, getRegionProfileBySlug } from '@/services/regions/regionHub.service';
import { siteConfig } from '@/config/site.config';
import { buildBreadcrumbListSchema } from '@/lib/schema';
import JsonLd from '@/components/seo/JsonLd';

// Matches every sibling detail route (app/destinations/[slug]/page.tsx,
// app/journeys/[slug]/page.tsx) — Region content is admin-edited in MongoDB and should
// reflect immediately, and `force-dynamic` is incompatible with a `revalidate` window
// on the same segment. The provider layers (Google/Booking) already own their own
// freshness independently of this page (see services/providers/*).
export const dynamic = 'force-dynamic';

interface RegionHubPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RegionHubPageProps): Promise<Metadata> {
  const { slug } = await params;
  // Metadata only needs the Region profile itself, not the full Destinations/Journeys/
  // Tours/Hotels/Experiences/Transport/Experts/Google/Booking.com fan-out getRegionHubData
  // runs for the page body — getRegionProfileBySlug is the same lightweight, React.cache()-
  // memoized lookup lib/bookingContext.ts already uses for exactly this reason.
  const region = await getRegionProfileBySlug(slug);
  if (!region) return { title: 'Region Not Found | The Apex Voyager India', robots: { index: false, follow: false } };

  const title = region.seo.title;
  const description = region.seo.description;
  // region.seo.image is editorial-only and unset for every region today; falling back to
  // the hero image (always set) means every region page gets a real, correct og:image
  // instead of none, without hardcoding any individual region's path here.
  const ogImage = region.seo.image ?? region.hero.image;
  return {
    title,
    description,
    alternates: { canonical: `/regions/${region.slug}` },
    openGraph: {
      title,
      description,
      url: `/regions/${region.slug}`,
      images: ogImage ? [{ url: ogImage, alt: region.name }] : undefined
    },
    twitter: { card: 'summary_large_image', title, description, images: ogImage ? [ogImage] : undefined }
  };
}

export default async function RegionHubPage({ params }: RegionHubPageProps) {
  const { slug } = await params;
  const hub = await getRegionHubData(slug);

  if (!hub) {
    notFound();
  }

  const {
    region,
    destinations,
    journeys,
    tours,
    curatedStays,
    experiences,
    transportServices,
    transportVehicles,
    travelExperts,
    googleContext,
    bookingContext
  } = hub;

  const hasStays = curatedStays.length > 0 || (bookingContext.enabled && bookingContext.accommodations.length > 0);

  const sections = [
    { id: 'overview', label: 'Overview', hasData: Boolean(region.overview.description) },
    { id: 'destinations', label: 'Destinations', hasData: destinations.length > 0 },
    { id: 'journeys', label: 'Journeys & Tours', hasData: journeys.length > 0 || tours.length > 0 },
    { id: 'stays', label: 'Stays', hasData: hasStays },
    { id: 'experiences', label: 'Experiences', hasData: experiences.length > 0 },
    { id: 'travel-guide', label: 'Travel Guide', hasData: googleContext.attractions.length > 0 }
  ].filter((section) => section.hasData);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbListSchema([
          { name: 'Home', url: siteConfig.url },
          { name: region.name, url: `${siteConfig.url}/regions/${region.slug}` }
        ])}
      />
      <DetailPageContainer>
        <BackButton fallbackHref="/destinations" label="Back to Destinations" />

        <RegionHero region={region} />

        <DetailSectionNav sections={sections} />

        {sections.some((s) => s.id === 'overview') ? <RegionOverview region={region} /> : null}
        {sections.some((s) => s.id === 'destinations') ? <RegionDestinations destinations={destinations} regionName={region.name} /> : null}
        {sections.some((s) => s.id === 'journeys') ? <RegionJourneys journeys={journeys} tours={tours} regionLabel={region.name} /> : null}
        {sections.some((s) => s.id === 'stays') ? (
          <RegionStays curatedStays={curatedStays} bookingContext={bookingContext} regionName={region.name} />
        ) : null}
        {sections.some((s) => s.id === 'experiences') ? <RegionExperiences experiences={experiences} regionName={region.name} /> : null}
        {sections.some((s) => s.id === 'travel-guide') ? <RegionTravelGuide region={region} googleContext={googleContext} /> : null}

        <RegionTransport transportServices={transportServices} transportVehicles={transportVehicles} regionName={region.name} regionSlug={region.slug} />
        <RegionExperts travelExperts={travelExperts} regionName={region.name} />
        <RegionFinalCTA region={region} />
      </DetailPageContainer>

      <WhatsAppButton destination={region.name} />
    </>
  );
}
