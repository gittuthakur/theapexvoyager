import Link from 'next/link';
import type { Metadata } from 'next';
import InnerHeroBanner from '@/components/modules/InnerHeroBanner';
import ExpertHelpOptions from '@/components/modules/ExpertHelpOptions';
import ExpertFilters from '@/components/modules/ExpertFilters';
import ExpertGrid from '@/components/modules/ExpertGrid';
import ExpertProcess from '@/components/modules/ExpertProcess';
import ExpertTripPlanner from '@/components/modules/ExpertTripPlanner';
import ExpertTravelSupport from '@/components/modules/ExpertTravelSupport';
import TalkToTravelTeamButton from '@/components/modules/TalkToTravelTeamButton';
import { PackageCard, FinalCta } from '@/components/modules';
import { images } from '@/config/images.config';
import { getAllExperts, getExpertFacets, matchesExpertQuery } from '@/lib/experts';
import { getPackageBySlug } from '@/lib/packages';

// Previously missing entirely, which left this page's canonical unset and its OG tags
// silently inheriting the root layout's generic homepage defaults — anyone sharing an
// /experts link got a homepage-branded preview card instead of this page's own identity.
// A single static export (not generateMetadata) is correct here, matching
// app/journeys/page.tsx and app/experiences/page.tsx: this page's own title/description
// never vary by query string, since every filter combination canonicalizes back to this
// one URL. `images.hero` is reused as-is rather than invented — it's the same image this
// page's own InnerHeroBanner already renders (see `bgImage={images.hero}` below).
const title = 'Travel Experts & Custom Trip Planning | The Apex Voyager';
const description =
  'Connect with The Apex Voyager travel experts for personalised Himalayan journeys, transport, stays, experiences and custom trip planning.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/experts' },
  openGraph: { type: 'website', title, description, url: '/experts', images: [{ url: images.hero, alt: 'Himalayan peaks at first light' }] }
};

const expertFaqs = [
  {
    question: 'Is talking to a travel expert free?',
    answer: 'Yes — sharing your trip details and speaking with a specialist costs nothing and comes with no obligation to book.'
  },
  {
    question: 'What if no expert matches my destination?',
    answer: "You'll always be offered a path to our general travel team, who can help plan your trip even if it falls outside a specific specialist's focus area."
  },
  {
    question: 'How do I continue the conversation after submitting my details?',
    answer: 'Once you request an expert, you get a reference ID and a prefilled WhatsApp message so you can continue the conversation directly with our team.'
  }
];

interface ExpertsPageProps {
  searchParams: Promise<{ destination?: string; travelStyle?: string; expertise?: string; q?: string; help?: string }>;
}

export default async function ExpertsPage({ searchParams }: ExpertsPageProps) {
  const { destination, travelStyle, expertise, q, help } = await searchParams;

  const [allExperts, facets] = await Promise.all([getAllExperts(), getExpertFacets()]);

  const experts = allExperts.filter((expert) => {
    const matchesDestination = !destination || expert.destinationSlugs.includes(destination);
    const matchesStyle = !travelStyle || expert.travelStyles.includes(travelStyle);
    const matchesExpertise = !expertise || expert.expertise.includes(expertise);
    const matchesQuery = !q || matchesExpertQuery(expert, q);
    return matchesDestination && matchesStyle && matchesExpertise && matchesQuery;
  });

  // Expert-recommended journeys: real Journey records referenced by featured
  // experts (expert.journeySlugs), deduplicated — no duplicated itinerary content.
  const featuredExperts = allExperts.filter((expert) => expert.featured);
  const recommendedJourneySlugs = Array.from(new Set(featuredExperts.flatMap((expert) => expert.journeySlugs ?? [])));
  const recommendedJourneys = (await Promise.all(recommendedJourneySlugs.map((slug) => getPackageBySlug(slug)))).filter(
    (journey): journey is NonNullable<typeof journey> => Boolean(journey)
  );

  return (
    <>
      <InnerHeroBanner eyebrow="Travel Experts" title="Your Journey, " highlite="Planned Around You." bgImage={images.hero}>
        <p className="max-w-2xl text-lg text-slate-600">
          Tell us where you want to go, how you like to travel and what matters most. Our travel experts help shape the
          journey around you.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <TalkToTravelTeamButton label="Talk to an Expert" />
          <Link
            href="/plan-my-journey"
            className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-300 ease-in-out hover:bg-slate-50"
          >
            Plan My Journey
          </Link>
        </div>

        <div className="mt-8">
          <ExpertFilters facets={facets} destination={destination} travelStyle={travelStyle} expertise={expertise} q={q} />
        </div>
      </InnerHeroBanner>

      <ExpertHelpOptions />

      <main>
        <section className="mx-auto max-w-[1440px] px-6 pb-16">
          <ExpertGrid experts={experts} />
        </section>

        <ExpertProcess />

        <ExpertTripPlanner initialNeedHelpWith={help} />

        {recommendedJourneys.length > 0 ? (
          <section className="bg-slate-100 py-16">
            <section className="mx-auto max-w-[1440px] px-6">
              <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Expert-Recommended Journeys</h2>
              <p className="mt-3 max-w-2xl text-slate-600">Real itineraries our specialists recommend most often.</p>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {recommendedJourneys.map((journey) => (
                  <PackageCard key={journey.slug} pkg={journey} />
                ))}
              </div>
            </section>
          </section>
        ) : null}

        <ExpertTravelSupport />
        <section className="bg-slate-100 py-16">
          <section className="mx-auto max-w-[1440px] px-6">
            <div className="">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Frequently Asked Questions</h2>
              <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {expertFaqs.map((faq) => (
                  <div key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md transition-all duration-300 ease-in-out motion-safe:hover:-translate-y-1.5 hover:shadow-xl">
                    <p className="font-semibold text-slate-900">{faq.question}</p>
                    <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>
        <FinalCta
          eyebrow="Still deciding?"
          title="Need Help "
          highlight="Planning Your Journey?"
          subtitle="Share your destination and preferences and a real travel expert will help you shape the trip."
          primaryLabel="Plan My Journey"
          primaryHref="/plan-my-journey"
          secondaryLabel="Talk to an Expert"
        />
      </main>
    </>
  );
}
