import ExperienceMoodDiscovery from '@/components/modules/experiences/ExperienceMoodDiscovery';
import ExperienceTrust from '@/components/modules/experiences/ExperienceTrust';
import ExperiencesHero from '@/components/modules/experiences/ExperiencesHero';
import ExperiencesListing from '@/components/modules/experiences/ExperiencesListing';
import FeaturedExperiences from '@/components/modules/experiences/FeaturedExperiences';
import LocalStories from '@/components/modules/experiences/LocalStories';
import RegionShowcase from '@/components/modules/experiences/RegionShowcase';
import { getAllExperiences } from '@/lib/experiences';
import { images } from '@/config/images.config';
import type { Metadata } from 'next';

// Previously missing entirely, which left this page's canonical unset and its OG tags
// silently inheriting the root layout's generic homepage defaults (title "The Apex
// Voyager", the homepage description/URL, no image) — anyone sharing an /experiences
// link got a homepage-branded preview card instead of this page's own identity. A
// single static export (not generateMetadata) is correct here, matching
// app/journeys/page.tsx and app/destinations/page.tsx: this page's own title/
// description never vary by query string, since every filter combination
// canonicalizes back to this one URL. `images.hero` is reused as-is rather than
// invented — it's the same image ExperiencesHero already renders atop this exact page.
const title = 'Curated Himalayan Experiences | The Apex Voyager';
const description =
  'Bookable Himalayan experiences — treks, village stays, food, wellness and offbeat adventures across Himachal Pradesh, Jammu & Kashmir and Uttarakhand.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/experiences' },
  openGraph: { type: 'website', title, description, url: '/experiences', images: [{ url: images.hero, alt: 'Himalayan peaks at first light' }] }
};

interface ExperiencesPageProps {
  searchParams: Promise<{
    q?: string;
    region?: string;
    category?: string;
    duration?: string;
    budget?: string;
    bestFor?: string;
    season?: string;
    difficulty?: string;
    sort?: string;
  }>;
}

export default async function ExperiencesPage({ searchParams }: ExperiencesPageProps) {
  const { q, region, category, duration, budget, bestFor, season, difficulty, sort } = await searchParams;
  const experiences = await getAllExperiences();

  // ExperiencesHero, ExperienceMoodDiscovery and RegionShowcase all navigate here with
  // new query params from *outside* ExperiencesListing, but the listing only seeds its
  // filter state from these props on mount (useState(initialX)) — a later prop change
  // alone wouldn't reach already-mounted state. Keying on the full query string forces
  // a fresh, correctly-seeded instance whenever an external link changes it.
  const listingKey = JSON.stringify({ q, region, category, duration, budget, bestFor, season, difficulty, sort });

  return (
    <>
      <ExperiencesHero />
      <ExperienceMoodDiscovery />
      <FeaturedExperiences />
      <main>
        <ExperiencesListing
          key={listingKey}
          experiences={experiences}
          initialQuery={q}
          initialRegion={region}
          initialCategories={category}
          initialDurations={duration}
          initialBudgets={budget}
          initialBestFor={bestFor}
          initialSeasons={season}
          initialDifficulties={difficulty}
          initialSort={sort}
        />
      </main>
      <RegionShowcase />
      <LocalStories />
      <ExperienceTrust />
    </>
  );
}
