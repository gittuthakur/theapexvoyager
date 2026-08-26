import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, Car, Clock, Compass, Eye, Gem, Mountain, Sparkles, Map, MapPin, Users } from 'lucide-react';
import StaysGrid from '@/components/modules/StaysGrid';
import DestinationCard from '@/components/modules/DestinationCard';
import PackageCard from '@/components/modules/PackageCard';
import ExpertCard from '@/components/modules/ExpertCard';
import DestinationSeasonModule from '@/components/modules/DestinationSeasonModule';
import DestinationHero from '@/components/modules/destinations/DestinationHero';
import DetailPageContainer from '@/components/modules/detail/DetailPageContainer';
import DetailSectionNav from '@/components/modules/detail/DetailSectionNav';
import BackButton from '@/components/ui/BackButton';
import { SafeImage } from '@/components/ui/SafeImage';
import { getCuratedDestinationBySlug } from '@/lib/destinations';
import { getPackagesByDestinationSlug } from '@/lib/packages';
import { getToursByDestinationSlug } from '@/lib/tours';
import { getExperiencesByDestination } from '@/lib/experiences';
import { getExpertsByDestinationSlug } from '@/lib/experts';
import { getRoutes } from '@/lib/transport';
import { getDestinationRatingsMap } from '@/lib/reviews';
import { getRegionForState, getRegionHubSlug } from '@/lib/regions';
import { formatINR } from '@/lib/pricing';
import type { DestinationMatchScores } from '@/types/destination';

export const dynamic = 'force-dynamic';

interface DestinationDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DestinationDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getCuratedDestinationBySlug(slug);
  if (!destination) return { title: 'Destination Not Found | The Apex Voyager' };

  const title = destination.seo?.title ?? `${destination.title} Travel Guide | The Apex Voyager`;
  const description = destination.seo?.description ?? destination.description;
  return {
    title,
    description,
    alternates: { canonical: `/destinations/${destination.slug}` },
    openGraph: { title, description, url: `/destinations/${destination.slug}`, images: [{ url: destination.image, alt: destination.title }] }
  };
}

const MATCH_SCORE_LABELS: Array<{ key: keyof DestinationMatchScores; label: string }> = [
  { key: 'adventure', label: 'Adventure' },
  { key: 'nature', label: 'Nature' },
  { key: 'luxury', label: 'Luxury' },
  { key: 'crowds', label: 'Crowds' },
  { key: 'slowTravel', label: 'Slow Travel' }
];

const APEX_PICK_ORDER = ['view', 'stay', 'experience', 'taste', 'moment'] as const;
const APEX_PICK_LABELS: Record<(typeof APEX_PICK_ORDER)[number], string> = {
  view: 'Apex View',
  stay: 'Apex Stay',
  experience: 'Apex Experience',
  taste: 'Apex Taste',
  moment: 'Apex Moment'
};

export default async function DestinationDetailPage({ params }: DestinationDetailPageProps) {
  const { slug } = await params;
  const destination = await getCuratedDestinationBySlug(slug);

  if (!destination) {
    notFound();
  }

  const journeys = await getPackagesByDestinationSlug(destination.slug);
  const tours = await getToursByDestinationSlug(destination.slug);
  const catalogExperiences = await getExperiencesByDestination(destination.title);
  const localExperts = await getExpertsByDestinationSlug(destination.slug);
  const routesToDestination = await getRoutes({ destination: destination.title });
  // Real rating computed from actual Review documents — takes precedence over the static
  // config rating so this never disagrees with the rating shown on journey cards
  // elsewhere on the site (both of which read from the same getDestinationRatingsMap).
  const destinationRating = (await getDestinationRatingsMap()).get(destination.slug);
  const parentRegion = getRegionForState(destination.state);
  const related = (
    await Promise.all((destination.relatedSlugs ?? []).map((relatedSlug) => getCuratedDestinationBySlug(relatedSlug)))
  )
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 3);

  const information = [
    [Clock, 'Best time', destination.bestTime],
    [Compass, 'Ideal duration', destination.idealDuration],
    [Mountain, 'Altitude', destination.altitude],
    [Sparkles, 'Travel style', destination.travelStyles?.join(' • ')]
  ].filter((item): item is [typeof Clock, string, string] => Boolean(item[2]));

  const apexPickEntries = APEX_PICK_ORDER
    .map((key) => ({ key, label: APEX_PICK_LABELS[key], pick: destination.apexPicks?.[key] }))
    .filter((entry): entry is { key: (typeof APEX_PICK_ORDER)[number]; label: string; pick: { title: string; description: string } } =>
      Boolean(entry.pick)
    );

  const destinationSections = [
    { id: 'overview', label: 'Overview' },
    { id: 'apex-picks', label: 'Apex picks' },
    { id: 'experiences', label: 'Experiences' },
    { id: 'tours', label: 'Tours' },
    { id: 'packages', label: 'Packages' },
    { id: 'getting-around', label: 'Getting around' },
    { id: 'experts', label: 'Experts' },
    { id: 'stays', label: 'Stays' }
  ];

  return (
    <DetailPageContainer>
      <BackButton fallbackHref={parentRegion ? `/regions/${getRegionHubSlug(parentRegion.id)}` : '/destinations'} label="Back to Destinations" />

      <DestinationHero destination={destination} rating={destinationRating} />

      <DetailSectionNav sections={destinationSections} />

      <section id="overview" className="grid gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-apex-500">The story</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Discover {destination.title}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{destination.editorialDescription ?? destination.description}</p>
          </div>
          {information.length ? <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-200">
            {information.map(([Icon, label, value]) => (
              <div key={label} className="bg-white p-5">
                <Icon className="text-apex-500" size={18} />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">{value}</p>
              </div>
            ))}
            {destination.apexScore ? (
              <div className="col-span-2 flex items-center justify-between bg-slate-50 p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Apex Score</span>
                <span className="text-lg font-bold text-apex-600">{destination.apexScore}/100</span>
              </div>
            ) : null}
          </div> : null}
        </section>

        {apexPickEntries.length ? (
          <section id="apex-picks" className="py-8">
            <SectionHeading eyebrow="Signature picks" title="Apex Picks" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {apexPickEntries.map(({ key, label, pick }) => (
                <article key={key} className="rounded-2xl border border-apex-200 bg-apex-50 p-6">
                  <Gem className="text-apex-500" size={20} />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-apex-600">{label}</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{pick.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{pick.description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {destination.highlights?.length ? <section className="py-8"><SectionHeading eyebrow="Why visit" title={`Why You’ll Love ${destination.title}`} /><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {destination.highlights.map((highlight) => <article key={highlight.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-6"><Sparkles className="text-apex-500" size={20} /><h3 className="mt-4 text-lg font-semibold text-slate-900">{highlight.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{highlight.description}</p></article>)}
        </div></section> : null}

        {destination.places?.length ? <section id="places" className="py-8"><SectionHeading eyebrow="Go deeper" title="Places Worth Discovering" /><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {destination.places.map((place, index) => <article key={place.title} className="rounded-2xl border border-slate-300 bg-slate-100 p-6"><span className="text-sm font-semibold text-apex-500">0{index + 1}</span><h3 className="mt-3 text-xl font-semibold text-slate-900">{place.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{place.description}</p></article>)}
        </div></section> : null}

        <section id="experiences" className="py-8">
          <SectionHeading eyebrow="Make it yours" title="Experiences" />
          {catalogExperiences.length ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {catalogExperiences.slice(0, 3).map((experience) => (
                  <Link
                    key={experience.slug}
                    href={`/experiences/${experience.slug}`}
                    className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative h-36 w-full overflow-hidden rounded-xl bg-slate-100">
                      <SafeImage src={experience.image} alt={experience.title} fill sizes="(min-width: 1024px) 360px, 45vw" className="object-cover" />
                    </div>
                    <h3 className="mt-4 font-semibold text-slate-900">{experience.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{experience.shortDescription}</p>
                    <p className="mt-2 text-lg font-semibold text-apex-600">From {formatINR(experience.price)} <span className="text-sm font-medium text-slate-500">/ person</span></p>
                  </Link>
                ))}
              </div>
              <Link href={`/experiences?q=${encodeURIComponent(destination.title)}`} className="mt-6 inline-flex items-center gap-2 text-md font-semibold text-apex-600 hover:text-apex-700">
                Explore all Experiences <ArrowRight size={18} />
              </Link>
            </>
          ) : destination.experiences?.length ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {destination.experiences.map((experience) => <span key={experience} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700"><Compass size={15} className="text-apex-300" />{experience}</span>)}
            </div>
          ) : (
            <p className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No bookable experiences in {destination.title} yet — our team can still tailor one for you.
            </p>
          )}
        </section>

        <section id="tours" className="py-8">
          <SectionHeading eyebrow="Ready to book" title={`Featured Tours in ${destination.title}`} />
          {tours.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tours.map((tour) => (
                <Link
                  key={tour.slug}
                  href="/journeys"
                  className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-36 w-full overflow-hidden rounded-xl bg-slate-100">
                    {tour.image ? (
                      <SafeImage src={tour.image} alt={tour.title} fill sizes="(min-width: 1024px) 360px, 45vw" className="object-cover" />
                    ) : null}
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{tour.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{tour.duration}</p>
                  <p className="mt-2 text-2xl font-bold text-apex-600">{tour.price}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No fixed-departure tours in {destination.title} yet — a curated journey below can be tailored instead.
            </p>
          )}
        </section>

        <section id="packages" className="py-8"><SectionHeading eyebrow="Curated journeys" title={`Journeys Through ${destination.title}`} />
          {journeys.length ? <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{journeys.map((pkg) => <PackageCard key={pkg.slug} pkg={pkg} />)}</div> : <p className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">New journeys through {destination.title} are being curated. Explore the destination story now and check back soon.</p>}
        </section>

        <section id="getting-around" className="py-8">
          <SectionHeading eyebrow="Plan the route" title={`Getting Around ${destination.title}`} />
          {routesToDestination.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {routesToDestination.map((route) => (
                <div key={`${route.origin}-${route.destination}`} className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
                  <Car className="text-apex-400" size={24} />
                  <h3 className="mt-3 font-semibold text-slate-900">{route.origin} → {route.destination}</h3>
                  {route.estimatedDuration ? <p className="mt-1 text-sm text-slate-500">{route.estimatedDuration}{route.distanceKm ? ` • ${route.distanceKm} km` : ''}</p> : null}
                  {route.startingFare ? <p className="mt-3 text-lg font-semibold text-apex-600">From {formatINR(route.startingFare)}</p> : null}
                  {route.seasonalStatus ? <p className="text-sm text-slate-500">{route.seasonalStatus}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No fixed routes to {destination.title} listed yet — our team can still arrange private transport.
            </p>
          )}
          <Link href="/transport" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-apex-600 hover:text-apex-700">
            Plan Transport to {destination.title} <ArrowRight size={16} />
          </Link>
        </section>

        <section id="experts" className="py-8">
          <SectionHeading eyebrow="Local knowledge" title={`Know ${destination.title} Through Locals`} />
          {localExperts.length ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {localExperts.map((expert) => <ExpertCard key={expert.slug} expert={expert} />)}
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8">
              <p className="text-sm text-slate-500">
                <Users size={16} className="mr-2 inline text-apex-300" />
                No dedicated {destination.title} specialist yet — our broader team can still help you plan.
              </p>
              <Link href="/experts" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-apex-600 hover:text-apex-700">
                Browse all Travel Experts <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>

        <div id="stays" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">Where to stay</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Hotels, Homestays &amp; Unique Stays in {destination.title}</h2>
            </div>
            <Link
              href={`/stays/${destination.slug}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-apex-500 px-5 py-3 text-sm font-medium text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
            >
              <Eye size={18} /> View bookable stays
            </Link>
          </div>
          <div className="mt-6">
            <StaysGrid location={destination.title} state={destination.state} />
          </div>
        </div>

        {destination.hiddenGems?.length ? (
          <section id="hidden-gems" className="py-8">
            <SectionHeading eyebrow="Off the main road" title="Beyond the Tourist Trail" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {destination.hiddenGems.map((gem) => (
                <article key={gem.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <Map className="text-apex-500" size={20} />
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">{gem.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{gem.description}</p>
                </article>
              ))}
            </div>
            {destination.travelTips?.length ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Travel tips</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {destination.travelTips.map((tip) => <li key={tip}>• {tip}</li>)}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {destination.seasons?.length ? (
          <section className="py-8">
            <SectionHeading eyebrow="Time it right" title="When Does It Feel Right?" />
            <div className="mt-6">
              <DestinationSeasonModule destinationTitle={destination.title} seasons={destination.seasons} seasonalNotes={destination.seasonalNotes} />
            </div>
          </section>
        ) : null}

        {destination.matchScores ? (
          <section className="py-8">
            <p className="text-sm font-semibold uppercase tracking-[0.20em] text-apex-500">How {destination.title} compares</p>
            <div className="mt-4 space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-6">
              {MATCH_SCORE_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-4">
                  <span className="w-28 shrink-0 text-sm text-slate-600">{label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-apex-500" style={{ width: `${destination.matchScores![key]}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs text-slate-500">{destination.matchScores![key]}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

      {related.length ? <section><SectionHeading eyebrow="Keep exploring" title="You May Also Like" /><div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <DestinationCard key={item.slug} destination={item} />)}</div></section> : null}
    </DetailPageContainer>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div><p className="text-sm font-semibold uppercase tracking-[0.28em] text-apex-500">{eyebrow}</p><h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h2></div>;
}
