import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Compass, Mountain, MountainSnow } from 'lucide-react';
import HeroSection, { type HeroSectionData } from '@/components/modules/HeroSection';
import homeHeroStyles from '@/components/modules/home/HomeHeroMobileFix.module.css';
import GlobalSearchFilter from '@/components/GlobalSearchFilter';
import TrustBadges from '@/components/modules/TrustBadges';
import StatsBar from '@/components/modules/StatsBar';
import WhyChooseUs from '@/components/modules/WhyChooseUs';
import NewsletterBanner from '@/components/modules/NewsletterBanner';
import { createLazyModule } from '@/components/layout';
import WhatsAppButton from '@/components/modules/WhatsAppButton';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import { SafeImage } from '@/components/ui/SafeImage';
import { siteConfig } from '@/config/site.config';
import { images } from '@/config/images.config';
import { buildTouristTripSchema } from '@/lib/schema';
import { getTours } from '@/lib/tours';
import { getAllPackages, getPackagesByDestinationSlug } from '@/lib/packages';
import { getHotels } from '@/lib/hotels';
import { formatINR } from '@/lib/pricing';
import { destinations } from '@/config/destinations.config';
import { statsItems } from '@/config/stats.config';
import { getReviewsForDestinationsPage, reviewToTestimonial } from '@/lib/reviews';
import { getHomeHeroRegions } from '@/services/regions/regionHub.service';
import type { StatItem } from '@/types';

// Tours now come live from MongoDB, so this page can't be statically prerendered at build time.
export const dynamic = 'force-dynamic';

const PopularDestinationsSection = createLazyModule<import('@/components/modules/PopularDestinationsSection').PopularDestinationsSectionProps>(
  () => import('@/components/modules/PopularDestinationsSection')
);
const FeatureGrid = createLazyModule<import('@/components/modules/FeatureGrid').FeatureGridProps>(
  () => import('@/components/modules/FeatureGrid')
);
const ExploreStays = createLazyModule<import('@/components/modules/ExploreStays').ExploreStaysProps>(
  () => import('@/components/modules/ExploreStays')
);
const PackageSection = createLazyModule<import('@/components/modules/PackageSection').PackageSectionProps>(
  () => import('@/components/modules/PackageSection')
);
const TestimonialSection = createLazyModule<import('@/components/modules/TestimonialSection').TestimonialSectionProps>(
  () => import('@/components/modules/TestimonialSection'),
  { skeletonCount: 3 }
);
const BeyondTouristTrailSection = createLazyModule<import('@/components/modules/BeyondTouristTrailSection').BeyondTouristTrailSectionProps>(
  () => import('@/components/modules/BeyondTouristTrailSection')
);

// The five named "Featured Journeys" from the brief — Manali Premium Escape stays
// out of this specific homepage section but remains a real package elsewhere.
const FEATURED_JOURNEY_SLUGS = [
  'spiti-valley-adventure',
  'kashmir-signature-journey',
  'sikkim-mountain-escape',
  'dharamshala-dalhousie-escape',
  'himachal-himalayan-explorer'
];

// The Home Hero's "state cards" now come from MongoDB (Region.showOnHomeHero) via
// getHomeHeroRegions() — see services/regions/regionHub.service.ts. Adding a published
// region there makes it appear here with no React change. `href` now points to the
// region's own /regions/[slug] hub instead of a /destinations filter.

export default async function HomePage() {
  // Backend-flag-driven homepage curation — selection and ordering come from each
  // destination's `isPopular`/`priority` fields in config/destinations.config.ts instead
  // of a hardcoded slug list. Price label is computed here (server-side) from the
  // journeys catalog, since the homepage can't take on a live Hotel/MongoDB read for it.
  const popularDestinations = await Promise.all(
    destinations
      .filter((destination) => destination.isPopular)
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
      .slice(0, 8)
      .map(async (destination) => {
        const destinationPackages = await getPackagesByDestinationSlug(destination.slug);
        const minPrice = destinationPackages.length > 0 ? Math.min(...destinationPackages.map((pkg) => pkg.price)) : undefined;
        return {
          ...destination,
          priceLabel: minPrice !== undefined ? `${formatINR(minPrice)}` : undefined
        };
      })
  );

  const allPackages = await getAllPackages();
  const featuredJourneys = FEATURED_JOURNEY_SLUGS.map((slug) => allPackages.find((pkg) => pkg.slug === slug)).filter(
    (pkg): pkg is (typeof allPackages)[number] => Boolean(pkg)
  );

  // "Destinations", "Stays & Properties" and "Curated Journeys" are real catalog counts —
  // compute them from the same data sources the rest of the homepage uses instead of the
  // hardcoded placeholders in stats.config.ts.
  const hotels = await getHotels();
  const homepageStats: StatItem[] = statsItems.map((item) => {
    if (item.label === 'Destinations') return { ...item, value: `${destinations.length}+` };
    if (item.label === 'Stays & Properties') return { ...item, value: `${hotels.length}+` };
    if (item.label === 'Curated Journeys') return { ...item, value: `${allPackages.length}+` };
    return item;
  });

  // Real reviews only — sourced from the Review collection (see lib/reviews.ts). No
  // fallback/demo data: an empty collection means no testimonials render at all.
  const reviews = await getReviewsForDestinationsPage();
  const testimonials = reviews.map((review) => reviewToTestimonial(review));
  const averageRating =
    testimonials.length > 0 ? Number((testimonials.reduce((sum, t) => sum + (t.rating ?? 0), 0) / testimonials.length).toFixed(1)) : undefined;

  const stateLinks = await getHomeHeroRegions();

  const heroData: HeroSectionData = {
    badge: {
      icon: <Compass size={16} className="text-apex-600" />,
      text: 'Real Himalayas. Rarely Found.'
    },
    titleTop: 'Escape to the Quiet ',
    titleBottomPrefix: 'Side of ',
    titleHighlight: 'the Mountains',
    subtitle:
      'Handpicked homestays, remote valleys, and slow mountain living — the Himachal that most travelers never discover.',
    media: {
      src: images.hero,
      alt: 'Luxury Himalayan expedition trek through Spiti Valley and Manali tour packages, Himachal Pradesh, at dusk'
    },
    schema: buildTouristTripSchema({
      name: 'Himalayan Expedition Tours — The Apex Voyager',
      description:
        'Curated destinations, stays, experiences and trusted local experts across Himachal Pradesh, Kashmir and Uttarakhand.',
      image: `${siteConfig.url}${images.hero}`,
      url: siteConfig.url,
      priceFrom: { amount: 12999, currency: 'INR' },
      ratingValue: averageRating,
      reviewCount: testimonials.length > 0 ? testimonials.length : undefined,
      areaServed: destinations.map((destination) => destination.title)
    })
  };

  return (
    <>
      <div className={homeHeroStyles.scope}>
      <HeroSection
        data={heroData}
        searchBar={<GlobalSearchFilter />}
        sidePanel={
          <div className="w-full sm:max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
            <div className='flex gap-2 items-center'>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-apex-100 text-apex-500">
                <MountainSnow size={24} />
              </span>
              <span>
                <h2 className="text-lg font-semibold text-slate-900">Three Himalayan States</h2>
                <p className="text-sm text-slate-500">Unlimited Experiences</p>
              </span>
            </div>
            <ul className="mt-6 space-y-2">
              {stateLinks.map((state) => (
                <li key={state.label}>
                  <Link
                    href={state.href}
                    className="cursor-hover group flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 transition-all duration-300 ease-in-out hover:border-apex-400/50 hover:bg-apex-50"
                  >
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      <SafeImage src={state.avatar} alt={state.label} fill sizes="64px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">{state.label}</span>
                      <span className="block text-xs text-slate-500">{state.description}</span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-apex-600" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        }
      >
        <TrustBadges />
      </HeroSection>
      </div>

      <StatsBar items={homepageStats} />

      <main>
        <PopularDestinationsSection destinations={popularDestinations} />
        <BeyondTouristTrailSection destinations={popularDestinations} />
        {/* Tours come from MongoDB (and, on a miss, an internal fallback fetch) — this
            Suspense boundary keeps that lookup from delaying everything above it
            (hero, destinations grid), which is all static/synchronous data. */}
        <Suspense fallback={<SkeletonGrid count={6} className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16 xl:grid-cols-3" />}>
          <FeaturedToursSection />
        </Suspense>
        <PackageSection
          packages={featuredJourneys}
          eyebrow="Curated Journeys"
          title="The"
          highlight="Journey Edit"
          subtitle="Curated itineraries for unforgettable Himalayan escapes."
          viewAllLabel="View All Journeys"
        />
        <ExploreStays
          eyebrow = "APEX STAYS"
          title="Stay Somewhere "
          highlight="Worth Remembering"
          subtitle="From mountain resorts and local homestays to hidden cabins and unforgettable treehouses, discover stays that make the Himalayas part of the experience."
          viewAllLabel="View All Stays"
          viewAllHref="/stays"
        />
        <WhyChooseUs />
        <TestimonialSection
          testimonials={testimonials}
          ratingLabel={testimonials.length > 0 ? `${averageRating}/5 Rating` : undefined}
          reviewCountLabel={testimonials.length > 0 ? `${testimonials.length} Review${testimonials.length === 1 ? '' : 's'}` : undefined}
        />
        <div className="">
          <NewsletterBanner />
        </div>
        <WhatsAppButton destination="the Himalayas" />
      </main>
    </>
  );
}

async function FeaturedToursSection() {
  const tours = await getTours();
  return <FeatureGrid tours={tours} />;
}
