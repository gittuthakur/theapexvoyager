import ExperienceMoodDiscovery from '@/components/modules/experiences/ExperienceMoodDiscovery';
import ExperienceTrust from '@/components/modules/experiences/ExperienceTrust';
import ExperiencesHero from '@/components/modules/experiences/ExperiencesHero';
import ExperiencesListing from '@/components/modules/experiences/ExperiencesListing';
import FeaturedExperiences from '@/components/modules/experiences/FeaturedExperiences';
import LocalStories from '@/components/modules/experiences/LocalStories';
import RegionShowcase from '@/components/modules/experiences/RegionShowcase';
import { getAllExperiences } from '@/lib/experiences';
import { getCuratedDestinations } from '@/lib/destinations';
import { images } from '@/config/images.config';
import type { Metadata } from 'next';
import TripPreferencesNote from '@/components/modules/TripPreferencesNote';
import { readTripPreferences } from '@/lib/tripPreferences';

// Previously missing entirely, which left this page's canonical unset and its OG tags
// silently inheriting the root layout's generic homepage defaults (title "The Apex
// Voyager", the homepage description/URL, no image) — anyone sharing an /experiences
// link got a homepage-branded preview card instead of this page's own identity. A
// single static export (not generateMetadata) is correct here, matching
// app/journeys/page.tsx and app/destinations/page.tsx: this page's own title/
// description never vary by query string, since every filter combination
// canonicalizes back to this one URL. `images.hero` is reused as-is rather than
// invented — it's the same image ExperiencesHero already renders atop this exact page.
const title = 'Curated Himalayan Experiences | The Apex Voyager India';
const description =
  'Bookable Himalayan experiences — treks, village stays, food, wellness and offbeat adventures across Himachal Pradesh, Jammu & Kashmir and Uttarakhand.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/experiences' },
  openGraph: { type: 'website', title, description, url: '/experiences', images: [{ url: images.hero, alt: 'Himalayan peaks at first light' }] },
  twitter: { card: 'summary_large_image', title, description, images: [images.hero] }
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
  const resolvedSearchParams = await searchParams;
  const { q, region, category, duration, budget, bestFor, season, difficulty, sort } = resolvedSearchParams;
  // Preferred date / participants from the search panels — saved preferences only. No capacity
  // or availability constraint is applied to the listing.
  const preferences = readTripPreferences(resolvedSearchParams);
  // Published destinations (slug/title/state only) let keyword search resolve REAL
  // location→destination relationships (e.g. an alternate title like "Jyotirmath"); if that read
  // fails the listing still works from the experiences' own fields.
  const [experiences, relatedDestinations] = await Promise.all([
    getAllExperiences(),
    getCuratedDestinations()
      .then((list) => list.map(({ slug, title, state }) => ({ slug, title, state })))
      .catch(() => [])
  ]);

  // ExperiencesHero, ExperienceMoodDiscovery, RegionShowcase and the homepage search all
  // navigate here with new query params from *outside* ExperiencesListing while it stays
  // mounted; the listing re-seeds its own filter state from the URL (see its reconciliation
  // block). It must NOT be remounted by keying on the query string — that remount stole focus
  // and dropped keystrokes while a visitor was typing in the search box.

  return (
    <>
      <ExperiencesHero />
      <ExperienceMoodDiscovery />
      <FeaturedExperiences />
      <main id="main-content">
        {Object.keys(preferences).length > 0 ? (
          <div className="mx-auto max-w-[1400px] px-6 pt-6">
            <TripPreferencesNote preferences={preferences} />
          </div>
        ) : null}
        <ExperiencesListing
          experiences={experiences}
          relatedDestinations={relatedDestinations}
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
