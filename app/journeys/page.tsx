import { Compass } from 'lucide-react';
import HeroSection, { type HeroSectionData } from '@/components/modules/HeroSection';
import JourneysExplorer from '@/components/modules/journeys/JourneysExplorer';
import JourneysHeroSearch from '@/components/modules/journeys/JourneysHeroSearch';
import SignatureJourneys from '@/components/modules/journeys/SignatureJourneys';
import JourneyStorySection from '@/components/modules/journeys/JourneyStorySection';
import JourneysTrustSection from '@/components/modules/journeys/JourneysTrustSection';
import { getAllPackages, getFeaturedPackages } from '@/lib/packages';
import { getCuratedDestinations } from '@/lib/destinations';
import { getDestinationRatingsMap } from '@/lib/reviews';
import { getPackageCategories } from '@/lib/packageFilters';
import { images } from '@/config/images.config';

const journeysHeroData: HeroSectionData = {
  badge: {
    icon: <Compass size={16} className="hidden" />,
    text: 'Curated Himalayan Journeys'
  },
  titleTop: 'Journeys Made for the',
  titleBottomPrefix: 'Way You ',
  titleHighlight: 'Want to Travel',
  subtitle:
    'From romantic mountain escapes and family holidays to adventurous high-altitude expeditions and slow Himalayan getaways, discover journeys curated around the experience you want.',
  media: {
    src: images.toursHero,
    alt: 'Curated Himalayan travel journey hero banner'
  }
};

interface JourneysPageProps {
  searchParams: Promise<{
    destination?: string;
    category?: string;
    region?: string;
    style?: string;
    season?: string;
    priceMin?: string;
    priceMax?: string;
    duration?: string;
    accommodation?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function JourneysPage({ searchParams }: JourneysPageProps) {
  const { destination, category, region, style, season, priceMin, priceMax, duration, accommodation, sort, page } = await searchParams;

  const packages = await getAllPackages();
  const featuredPackages = await getFeaturedPackages(3);
  const destinations = getCuratedDestinations();
  const destinationRatings = await getDestinationRatingsMap();
  const categories = getPackageCategories(packages);

  return (
    <>
      {/* A distinct cinematic identity for Journeys — not the homepage's shared light-wash
          overlay. Left-to-right dark fade (text sits on the left) instead of the default
          light-to-dark-navy-at-the-bottom gradient, paired with light text via `variant="dark"`. */}
      <HeroSection
        data={journeysHeroData}
        searchBar={<JourneysHeroSearch categories={categories} />}
        overlayClassName="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-white/50"
        variant="dark"
      />

      <main className="">
        <JourneysExplorer
          packages={packages}
          destinations={destinations}
          destinationRatings={Object.fromEntries(destinationRatings)}
          initialQuery={destination}
          initialCategory={category}
          initialRegion={region}
          initialStyles={style}
          initialSeasons={season}
          initialPriceMin={priceMin}
          initialPriceMax={priceMax}
          initialDuration={duration}
          initialAccommodation={accommodation}
          initialSort={sort}
          initialPage={page}
        />

        <SignatureJourneys packages={featuredPackages} />
        <JourneyStorySection />
        <JourneysTrustSection />
      </main>
    </>
  );
}
