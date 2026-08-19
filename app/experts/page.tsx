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
import { getAllExperts, getExpertFacets } from '@/lib/experts';
import { getPackageBySlug } from '@/lib/packages';

export const metadata: Metadata = {
  title: 'Travel Experts & Custom Trip Planning | The Apex Voyager',
  description:
    'Connect with The Apex Voyager travel experts for personalised Himalayan journeys, transport, stays, experiences and custom trip planning.'
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

  const normalizedQuery = q?.trim().toLowerCase();
  const experts = allExperts.filter((expert) => {
    const matchesDestination = !destination || expert.destinationSlugs.includes(destination);
    const matchesStyle = !travelStyle || expert.travelStyles.includes(travelStyle);
    const matchesExpertise = !expertise || expert.expertise.includes(expertise);
    const matchesQuery = !normalizedQuery || expert.name.toLowerCase().includes(normalizedQuery) || expert.bio.toLowerCase().includes(normalizedQuery);
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
      </InnerHeroBanner>

      <ExpertHelpOptions />

      <main>
        <section className="mx-auto max-w-7xl space-y-8 px-6 pb-14 sm:px-10 lg:px-16">
          <ExpertFilters facets={facets} destination={destination} travelStyle={travelStyle} expertise={expertise} q={q} />
          <ExpertGrid experts={experts} />
        </section>

        <ExpertProcess />

        <ExpertTripPlanner initialNeedHelpWith={help} />

        {recommendedJourneys.length > 0 ? (
          <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16">
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Expert-Recommended Journeys</h2>
            <p className="mt-3 max-w-2xl text-slate-600">Real itineraries our specialists recommend most often.</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {recommendedJourneys.map((journey) => (
                <PackageCard key={journey.slug} pkg={journey} />
              ))}
            </div>
          </section>
        ) : null}

        <ExpertTravelSupport />

        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Frequently Asked Questions</h2>
            <div className="mt-5 space-y-4">
              {expertFaqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900">{faq.question}</p>
                  <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
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
