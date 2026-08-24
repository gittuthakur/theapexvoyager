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
import { getRegionHubData } from '@/services/regions/regionHub.service';

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
  const hub = await getRegionHubData(slug);
  if (!hub) return { title: 'Region Not Found | The Apex Voyager' };

  const { region } = hub;
  const title = region.seo.title;
  const description = region.seo.description;
  return {
    title,
    description,
    alternates: { canonical: `/regions/${region.slug}` },
    openGraph: {
      title,
      description,
      images: region.seo.image ? [{ url: region.seo.image, alt: region.name }] : undefined
    }
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

        <RegionTransport transportServices={transportServices} transportVehicles={transportVehicles} regionName={region.name} />
        <RegionExperts travelExperts={travelExperts} regionName={region.name} />
        <RegionFinalCTA region={region} />
      </DetailPageContainer>

      <WhatsAppButton destination={region.name} />
    </>
  );
}
