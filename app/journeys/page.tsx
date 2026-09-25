import type { Metadata } from 'next';
import { Compass } from 'lucide-react';
import HeroSection, { type HeroSectionData } from '@/components/modules/HeroSection';
import JourneysExplorer from '@/components/modules/journeys/JourneysExplorer';
import JourneysHeroSearch from '@/components/modules/journeys/JourneysHeroSearch';
import SignatureJourneys from '@/components/modules/journeys/SignatureJourneys';
import JourneyStorySection from '@/components/modules/journeys/JourneyStorySection';
import JourneysTrustSection from '@/components/modules/journeys/JourneysTrustSection';
import { getAllPackages } from '@/lib/packages';
import { getCuratedDestinations } from '@/lib/destinations';
import { getDestinationRatingsMap } from '@/lib/reviews';
import { getPackageCategories } from '@/lib/packageFilters';
import { images } from '@/config/images.config';

// Previously missing entirely, which left this page's canonical unset and its OG tags
// silently inheriting the root layout's generic homepage defaults (title "The Apex
// Voyager", the homepage description/URL) — anyone sharing a /journeys link got a
// homepage-branded preview card instead of this page's own identity. A single static
// export (not generateMetadata) is correct here, matching app/destinations/page.tsx:
// this page's own title/description never vary by query string, since every filter
// combination canonicalizes back to this one URL.
const title = 'Himalayan Tour Packages & Curated Journeys | The Apex Voyager India';
const description =
  'Explore curated Himalayan tour packages across Himachal Pradesh, Jammu & Kashmir and Uttarakhand — personalised itineraries, stays and private transport.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/journeys' },
  openGraph: { type: 'website', title, description, url: '/journeys', images: [{ url: images.toursHero, alt: 'Curated Himalayan travel journeys' }] },
  twitter: { card: 'summary_large_image', title, description, images: [images.toursHero] }
};

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
  const { destination, category, region, season, priceMin, priceMax, duration, accommodation, sort, page } = await searchParams;

  // Phase P2I: getFeaturedPackages() previously called getAllPackages() a second,
  // fully redundant time internally (same query, same data, no request-specific
  // variation) — replaced with the same filter/fallback/slice logic it used
  // internally, applied to the `packages` already fetched below, so the featured set
  // is byte-for-byte identical without a second Mongo round-trip. destinations and
  // destinationRatings are independent of packages and of each other, so all three
  // reads now run concurrently instead of sequentially.
  const [packages, destinations, destinationRatings] = await Promise.all([
    getAllPackages(),
    getCuratedDestinations(),
    getDestinationRatingsMap()
  ]);
  const featuredCandidates = packages.filter((pkg) => pkg.featured);
  const featuredPackages = (featuredCandidates.length > 0 ? featuredCandidates : packages).slice(0, 3);
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

      <main id="main-content" className="">
        <JourneysExplorer
          packages={packages}
          destinations={destinations}
          destinationRatings={Object.fromEntries(destinationRatings)}
          initialQuery={destination}
          initialCategory={category}
          initialRegion={region}
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
