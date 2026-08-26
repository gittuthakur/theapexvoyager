import type { Metadata } from 'next';
import InnerHeroBanner from '@/components/modules/InnerHeroBanner';
import DestinationsHeroSearch from '@/components/modules/destinations/DestinationsHeroSearch';
import RegionShowcase from '@/components/modules/destinations/RegionShowcase';
import PopularDestinationsRegion from '@/components/modules/destinations/PopularDestinationsRegion';
import DestinationStyleGrid from '@/components/modules/destinations/DestinationStyleGrid';
import SeasonalDiscovery from '@/components/modules/destinations/SeasonalDiscovery';
import WhyTheApexSection from '@/components/modules/destinations/WhyTheApexSection';
import BeyondTouristTrailSection from '@/components/modules/BeyondTouristTrailSection';
import DestinationsExplorer from '@/components/modules/DestinationsExplorer';
import TestimonialSection from '@/components/modules/TestimonialSection';
import NewsletterBanner from '@/components/modules/NewsletterBanner';
import { images } from '@/config/images.config';
import { getCuratedDestinations } from '@/lib/destinations';
import { getDestinationStatsMap } from '@/lib/destinationStats';
import { getReviewsForDestinationsPage, reviewToTestimonial } from '@/lib/reviews';
import { getRegionById } from '@/lib/regions';
import type { RegionId } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Explore the Himalayas | The Apex Voyager',
  description:
    'Discover handpicked destinations across Himachal Pradesh, Jammu & Kashmir and Uttarakhand — from iconic valleys to places most travelers never find.'
};

// The editorial "beyond the trail" picks — deliberately a fixed, curated slug list
// rather than the full catalog, since BeyondTouristTrailSection just takes the first
// 3 destinations with apexPicks/hiddenGems in whatever order it's given, and the
// enriched "marquee" destinations (Manali, Kinnaur, Spiti) would otherwise crowd out
// the actually-offbeat picks this section is meant to showcase.
const BEYOND_THE_TRAIL_SLUGS = ['tirthan-valley', 'jibhi', 'chitkul'];

interface DestinationsPageProps {
  searchParams: Promise<{
    destination?: string;
    style?: string;
    season?: string;
    region?: string;
    priceMin?: string;
    priceMax?: string;
    bestFor?: string;
    sort?: string;
    page?: string;
    view?: string;
  }>;
}

export default async function DestinationsPage({ searchParams }: DestinationsPageProps) {
  const { destination, style, season, region, priceMin, priceMax, bestFor, sort, page, view } = await searchParams;

  const destinations = await getCuratedDestinations();
  const [statsMap, reviews] = await Promise.all([getDestinationStatsMap(destinations), getReviewsForDestinationsPage()]);
  const stats = Object.fromEntries(statsMap);

  const activeRegionId = region ? getRegionById(region)?.id : undefined;
  // Real reviews only — no fallback/demo data. An empty Review collection means this
  // page's testimonial section simply doesn't render (see the conditional below).
  const destinationsBySlug = new Map(destinations.map((item) => [item.slug, item]));
  const testimonials = reviews.map((review) => reviewToTestimonial(review, destinationsBySlug));
  const averageRating =
    testimonials.length > 0 ? Number((testimonials.reduce((sum, t) => sum + (t.rating ?? 0), 0) / testimonials.length).toFixed(1)) : undefined;
  const beyondTheTrail = destinations.filter((item) => BEYOND_THE_TRAIL_SLUGS.includes(item.slug));

  // PopularDestinationsRegion and DestinationStyleGrid both navigate here with new
  // ?region=/?style= query params from *outside* DestinationsExplorer, but the explorer
  // only seeds its filter state from these props on mount (useState(initialX)) — a later
  // prop change alone wouldn't reach already-mounted state, leaving the results grid
  // showing the previous (or unfiltered) set while the URL and page's own region/style
  // tabs already claim the new filter is active. Keying on the full query string forces a
  // fresh, correctly-seeded instance whenever an external link changes it — same fix as
  // app/experiences/page.tsx's `listingKey`.
  const explorerKey = JSON.stringify({ destination, style, season, region, priceMin, priceMax, bestFor, sort, page, view });

  return (
    <>
      <InnerHeroBanner
        eyebrow="Explore the Himalayas"
        title="Places Worth"
        highlite="Travelling For."
        subtitle="From iconic mountain towns to remote valleys, discover Himalayan destinations shaped by landscapes, culture and unforgettable journeys."
        bgImage={images.destinationsHero}
        imageClassName="object-[62%_center] sm:object-[60%_center]"
        className="min-h-[620px] sm:min-h-[520px]"
      >
        <DestinationsHeroSearch initialDestination={destination} initialStyle={style} />
      </InnerHeroBanner>

      <RegionShowcase destinations={destinations} />
      <PopularDestinationsRegion destinations={destinations} stats={stats} activeRegionId={activeRegionId as RegionId | undefined} />
      <DestinationStyleGrid />
      <BeyondTouristTrailSection destinations={beyondTheTrail} />

      <main className="py-14 lg:py-16">
        <section className="mx-auto max-w-[1440px] px-6">
          <DestinationsExplorer
            key={explorerKey}
            destinations={destinations}
            stats={stats}
            initialQuery={destination}
            initialRegion={region}
            initialStyles={style}
            initialSeasons={season}
            initialPriceMin={priceMin}
            initialPriceMax={priceMax}
            initialBestFor={bestFor}
            initialSort={sort}
            initialPage={page}
            initialView={view}
          />
        </section>
      </main>

      <SeasonalDiscovery destinations={destinations} />

      <WhyTheApexSection />

      <TestimonialSection
        testimonials={testimonials}
        ratingLabel={testimonials.length > 0 ? `${averageRating}/5 Rating` : undefined}
        reviewCountLabel={testimonials.length > 0 ? `${testimonials.length} Review${testimonials.length === 1 ? '' : 's'}` : undefined}
      />

      <NewsletterBanner
        heading="Get Closer to the Himalayas"
        subtitle="Hidden places, new journeys and handpicked stays — delivered occasionally, never spammed."
      />
    </>
  );
}
