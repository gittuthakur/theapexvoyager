import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Car, Clock, Compass, Eye, Gem, Mountain, Sparkles, Map, MapPin, Star, Users } from 'lucide-react';
import StaysGrid from '@/components/modules/StaysGrid';
import DestinationCard from '@/components/modules/DestinationCard';
import PackageCard from '@/components/modules/PackageCard';
import ExpertCard from '@/components/modules/ExpertCard';
import WhatsAppEnquireButton from '@/components/modules/WhatsAppEnquireButton';
import DestinationPlanJourneyButton from '@/components/modules/DestinationPlanJourneyButton';
import DestinationSeasonModule from '@/components/modules/DestinationSeasonModule';
import { SafeImage } from '@/components/ui/SafeImage';
import { getCuratedDestinationBySlug } from '@/lib/destinations';
import { getPackagesByDestinationSlug } from '@/lib/packages';
import { getToursByDestinationSlug } from '@/lib/tours';
import { getExperiencesByDestination } from '@/lib/experiences';
import { getExpertsByDestinationSlug } from '@/lib/experts';
import { formatINR } from '@/lib/pricing';
import { vehicleOptions } from '@/config/transport.config';
import type { DestinationMatchScores } from '@/types/destination';

export const dynamic = 'force-dynamic';

interface DestinationDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DestinationDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = getCuratedDestinationBySlug(slug);
  if (!destination) return { title: 'Destination Not Found | The Apex Voyager' };

  const title = destination.seo?.title ?? `${destination.title} Travel Guide | The Apex Voyager`;
  const description = destination.seo?.description ?? destination.description;
  return {
    title,
    description,
    alternates: { canonical: `/destinations/${destination.slug}` },
    openGraph: { title, description, images: [{ url: destination.image, alt: destination.title }] }
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
  const destination = getCuratedDestinationBySlug(slug);

  if (!destination) {
    notFound();
  }

  const journeys = await getPackagesByDestinationSlug(destination.slug);
  const tours = await getToursByDestinationSlug(destination.slug);
  const catalogExperiences = getExperiencesByDestination(destination.title);
  const localExperts = await getExpertsByDestinationSlug(destination.slug);
  const related = (destination.relatedSlugs ?? [])
    .map((relatedSlug) => getCuratedDestinationBySlug(relatedSlug))
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

  return (
    <main className="min-h-screen px-6 py-14 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-6xl space-y-6">
        <Link href="/destinations" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors duration-300 ease-in-out hover:text-slate-900">
          <ArrowLeft size={16} /> Back to Destinations
        </Link>

        <div className="relative isolate min-h-[440px] overflow-hidden rounded-[2rem] bg-slate-950 shadow-glow sm:min-h-[540px]">
          <SafeImage src={destination.image} alt={`${destination.title}, ${destination.state ?? 'Himalayas'}`} fill priority sizes="(min-width: 1024px) 1152px, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
          <div className="relative flex min-h-[440px] flex-col justify-end p-6 sm:min-h-[540px] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-apex-200">{destination.region ?? destination.category}</p>
            <h1 className="mt-3 text-5xl font-bold text-white sm:text-6xl">{destination.title}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-100">{destination.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">{destination.travelStyles?.slice(0, 3).map((style) => <span key={style} className="rounded-full border border-white/20 bg-black/20 px-4 py-2 text-sm text-white">{style}</span>)}</div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <DestinationPlanJourneyButton destinationTitle={destination.title} />
              {destination.rating ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-sm text-white backdrop-blur-sm">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  {destination.rating.toFixed(1)}
                  {destination.userRatingCount ? <span className="text-slate-300"> ({destination.userRatingCount} reviews)</span> : null}
                </span>
              ) : null}
              <WhatsAppEnquireButton selection={{ name: destination.title, type: 'destination' }} label="Enquire on WhatsApp" />
            </div>
          </div>
        </div>

        <nav aria-label="Destination sections" className="sticky top-0 z-20 -mx-6 overflow-x-auto border-y border-slate-200 bg-white/95 px-6 py-3 backdrop-blur sm:-mx-10 sm:px-10 lg:-mx-16 lg:px-16">
          <div className="flex w-max gap-6 text-sm font-semibold text-slate-600">
            {['Overview', 'Apex picks', 'Experiences', 'Tours', 'Packages', 'Getting around', 'Experts', 'Stays'].map((label) => (
              <a key={label} href={`#${label.toLowerCase().replace(/\s+/g, '-')}`} className="whitespace-nowrap transition-colors duration-300 ease-in-out hover:text-apex-600">{label}</a>
            ))}
          </div>
        </nav>

        <section id="overview" className="grid gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-apex-300">The story</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Discover {destination.title}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{destination.editorialDescription ?? destination.description}</p>
          </div>
          {information.length ? <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-200">
            {information.map(([Icon, label, value]) => (
              <div key={label} className="bg-white p-5">
                <Icon className="text-apex-300" size={18} />
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
                <article key={key} className="rounded-[1.5rem] border border-apex-100 bg-apex-50/40 p-6">
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
          {destination.highlights.map((highlight) => <article key={highlight.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-6"><Sparkles className="text-apex-300" size={20} /><h3 className="mt-4 text-lg font-semibold text-slate-900">{highlight.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{highlight.description}</p></article>)}
        </div></section> : null}

        {destination.places?.length ? <section id="places" className="py-8"><SectionHeading eyebrow="Go deeper" title="Places Worth Discovering" /><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {destination.places.map((place, index) => <article key={place.title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6"><span className="text-sm font-semibold text-apex-300">0{index + 1}</span><h3 className="mt-3 text-xl font-semibold text-slate-900">{place.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{place.description}</p></article>)}
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
                    <p className="mt-2 text-sm font-semibold text-apex-600">From {formatINR(experience.price)} / person</p>
                  </Link>
                ))}
              </div>
              <Link href={`/experiences?q=${encodeURIComponent(destination.title)}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-apex-600 hover:text-apex-700">
                Explore all Experiences <ArrowRight size={16} />
              </Link>
            </>
          ) : destination.experiences?.length ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {destination.experiences.map((experience) => <span key={experience} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700"><Compass size={15} className="text-apex-300" />{experience}</span>)}
            </div>
          ) : null}
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
                    <SafeImage src={tour.image} alt={tour.title} fill sizes="(min-width: 1024px) 360px, 45vw" className="object-cover" />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{tour.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{tour.duration}</p>
                  <p className="mt-2 text-sm font-semibold text-apex-600">{tour.price}</p>
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
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {vehicleOptions.map((vehicle) => (
              <div key={vehicle.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
                <Car className="text-apex-300" size={20} />
                <h3 className="mt-3 font-semibold text-slate-900">{vehicle.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{vehicle.seats} seats</p>
                <p className="mt-3 text-sm font-semibold text-apex-600">{formatINR(vehicle.estimatedFromPrice)}</p>
                <p className="text-xs text-slate-500">{vehicle.priceNote}</p>
              </div>
            ))}
          </div>
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
            <div className="mt-6 flex items-center justify-between gap-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8">
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

        <div id="stays" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-apex-300">Where to stay</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Hotels, Homestays &amp; Unique Stays in {destination.title}</h2>
            </div>
            <Link
              href={`/stays/${destination.slug}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-all duration-300 ease-in-out hover:bg-slate-50"
            >
              <Eye size={16} /> View bookable stays
            </Link>
          </div>
          <div className="mt-6">
            <StaysGrid location={destination.title} />
          </div>
        </div>

        {destination.hiddenGems?.length ? (
          <section id="hidden-gems" className="py-8">
            <SectionHeading eyebrow="Off the main road" title="Beyond the Tourist Trail" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {destination.hiddenGems.map((gem) => (
                <article key={gem.title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
                  <Map className="text-apex-300" size={18} />
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">{gem.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{gem.description}</p>
                </article>
              ))}
            </div>
            {destination.travelTips?.length ? (
              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-6">
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
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-apex-300">How {destination.title} compares</p>
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
      </section>
    </main>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div><p className="text-sm font-semibold uppercase tracking-[0.28em] text-apex-300">{eyebrow}</p><h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h2></div>;
}
