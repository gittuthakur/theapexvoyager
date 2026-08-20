import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, Car, Compass, MapPin, Users } from 'lucide-react';
import DestinationCard from '@/components/modules/DestinationCard';
import PackageCard from '@/components/modules/PackageCard';
import ExpertCard from '@/components/modules/ExpertCard';
import HotelCard from '@/components/modules/HotelCard';
import ExperienceCard from '@/components/modules/experiences/ExperienceCard';
import { ButtonLink } from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import { SafeImage } from '@/components/ui/SafeImage';
import { getRegionById } from '@/lib/regions';
import { getCuratedDestinations } from '@/lib/destinations';
import { getAllPackages } from '@/lib/packages';
import { getAllExperiences } from '@/lib/experiences';
import { getAllExperts } from '@/lib/experts';
import { getHotels } from '@/lib/hotels';
import { getRoutes } from '@/lib/transport';
import { formatINR } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

interface RegionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const region = getRegionById(slug);
  if (!region) return { title: 'Region Not Found | The Apex Voyager' };

  return {
    title: `${region.name} Travel Guide | The Apex Voyager`,
    description: region.description,
    alternates: { canonical: `/regions/${region.id}` }
  };
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-apex-300">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h2>
    </div>
  );
}

export default async function RegionPage({ params }: RegionPageProps) {
  const { slug } = await params;
  const region = getRegionById(slug);

  if (!region) {
    notFound();
  }

  // Every downstream section below derives from this same region → destination
  // relationship (Destination.state === region.name, the existing relationship
  // already used by /destinations?region= and app/api/destinations/route.ts) —
  // no new region field was added to any other model.
  const regionDestinations = getCuratedDestinations().filter((destination) => destination.state === region.name);
  const regionDestinationSlugs = new Set(regionDestinations.map((destination) => destination.slug));
  const regionDestinationTitles = regionDestinations.map((destination) => destination.title.toLowerCase());

  const [allPackages, allExperts, allHotels, allRoutes] = await Promise.all([
    getAllPackages(),
    getAllExperts(),
    getHotels(),
    getRoutes()
  ]);

  const regionJourneys = allPackages.filter((pkg) => pkg.destinationSlugs?.some((s) => regionDestinationSlugs.has(s)));
  const regionExperiences = getAllExperiences().filter((experience) => experience.region === region.name);
  const regionExperts = allExperts.filter((expert) => expert.destinationSlugs.some((s) => regionDestinationSlugs.has(s)));
  const regionStays = allHotels
    .filter((hotel) => regionDestinationTitles.some((title) => hotel.location.toLowerCase().includes(title)))
    .slice(0, 6);
  const regionRoutes = allRoutes.filter((route) => regionDestinationTitles.some((title) => route.destination.toLowerCase().includes(title)));

  return (
    <main className="min-h-screen px-6 py-14 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-6xl space-y-6">
        <BackButton fallbackHref="/destinations" label="Back to Destinations" />

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.5em] text-apex-500">Explore the region</p>
              <h1 className="mt-3 text-4xl font-bold text-slate-900 sm:text-5xl">{region.name}</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{region.description}</p>
            </div>
          </div>

          <div className="relative mt-8 h-[360px] w-full overflow-hidden rounded-[1.5rem] bg-slate-900">
            <SafeImage src={region.image} alt={region.name} fill priority sizes="(min-width: 1024px) 960px, 100vw" className="object-cover" />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ButtonLink href={`/plan-my-journey?region=${region.id}`} size="lg">
              Plan My {region.shortName} Journey <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </div>

          <section id="destinations" className="py-8">
            <SectionHeading eyebrow="Where to go" title={`Destinations in ${region.name}`} />
            {regionDestinations.length ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {regionDestinations.map((destination, index) => (
                  <DestinationCard key={destination.slug} destination={destination} priority={index < 3} />
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No destinations published for {region.name} yet.
              </p>
            )}
          </section>

          <section id="experiences" className="py-8">
            <SectionHeading eyebrow="Make it yours" title={`Experiences in ${region.name}`} />
            {regionExperiences.length ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regionExperiences.slice(0, 6).map((experience) => (
                  <ExperienceCard key={experience.slug} experience={experience} />
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No {region.name} experiences published yet.
              </p>
            )}
          </section>

          <section id="journeys" className="py-8">
            <SectionHeading eyebrow="Curated journeys" title={`Journeys Through ${region.name}`} />
            {regionJourneys.length ? (
              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {regionJourneys.map((pkg) => (
                  <PackageCard key={pkg.slug} pkg={pkg} regionLabel={region.shortName} />
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                New journeys through {region.name} are being curated. Explore the destinations above and check back soon.
              </p>
            )}
          </section>

          <section id="getting-around" className="py-8">
            <SectionHeading eyebrow="Plan the route" title={`Getting Around ${region.name}`} />
            {regionRoutes.length ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {regionRoutes.map((route) => (
                  <div key={`${route.origin}-${route.destination}`} className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
                    <Car className="text-apex-300" size={20} />
                    <h3 className="mt-3 font-semibold text-slate-900">{route.origin} → {route.destination}</h3>
                    {route.estimatedDuration ? <p className="mt-1 text-xs text-slate-500">{route.estimatedDuration}{route.distanceKm ? ` • ${route.distanceKm} km` : ''}</p> : null}
                    {route.startingFare ? <p className="mt-3 text-sm font-semibold text-apex-600">From {formatINR(route.startingFare)}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No fixed routes into {region.name} listed yet — our team can still arrange private transport.
              </p>
            )}
            <Link href="/transport" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-apex-600 hover:text-apex-700">
              Plan Transport to {region.name} <ArrowRight size={16} />
            </Link>
          </section>

          <section id="experts" className="py-8">
            <SectionHeading eyebrow="Local knowledge" title={`Know ${region.name} Through Locals`} />
            {regionExperts.length ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {regionExperts.map((expert) => (
                  <ExpertCard key={expert.slug} expert={expert} />
                ))}
              </div>
            ) : (
              <div className="mt-6 flex items-center justify-between gap-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8">
                <p className="text-sm text-slate-500">
                  <Users size={16} className="mr-2 inline text-apex-300" />
                  No dedicated {region.name} specialist yet — our broader team can still help you plan.
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
                <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Hotels &amp; Stays in {region.name}</h2>
              </div>
              <Link
                href="/stays"
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-all duration-300 ease-in-out hover:bg-slate-50"
              >
                <MapPin size={16} /> View all stays
              </Link>
            </div>
            {regionStays.length ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {regionStays.map((hotel) => (
                  <HotelCard key={hotel.slug} hotel={hotel} />
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No stays published for {region.name} yet.
              </p>
            )}
          </div>

          <section className="py-8 text-center">
            <Compass className="mx-auto text-apex-300" size={28} />
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Ready to explore {region.name}?</h2>
            <p className="mt-2 text-sm text-slate-500">Tell us your dates and travel style — we'll build a {region.shortName} itinerary around them.</p>
            <ButtonLink href={`/plan-my-journey?region=${region.id}`} size="lg" className="mt-6">
              Plan My {region.shortName} Journey <ArrowRight size={16} />
            </ButtonLink>
          </section>
        </section>
      </main>
  );
}
