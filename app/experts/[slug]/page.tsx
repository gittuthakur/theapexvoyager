import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, Languages, MapPin } from 'lucide-react';
import ExpertTalkButton from '@/components/modules/ExpertTalkButton';
import { PackageCard } from '@/components/modules';
import { SafeImage } from '@/components/ui/SafeImage';
import { getExpertBySlug } from '@/lib/experts';
import { getCuratedDestinationBySlug } from '@/lib/destinations';
import { getPackageBySlug } from '@/lib/packages';

export const dynamic = 'force-dynamic';

interface ExpertDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ExpertDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const expert = await getExpertBySlug(slug);
  return {
    title: expert ? `${expert.name} | Travel Experts | The Apex Voyager` : 'Travel Experts | The Apex Voyager',
    description: expert ? `${expert.bio.slice(0, 155)}` : undefined
  };
}

export default async function ExpertDetailPage({ params }: ExpertDetailPageProps) {
  const { slug } = await params;
  const expert = await getExpertBySlug(slug);

  if (!expert) {
    notFound();
  }

  const destinations = expert.destinationSlugs
    .map((destinationSlug) => getCuratedDestinationBySlug(destinationSlug))
    .filter((destination): destination is NonNullable<typeof destination> => Boolean(destination));

  const recommendedJourneys = (await Promise.all((expert.journeySlugs ?? []).map((journeySlug) => getPackageBySlug(journeySlug)))).filter(
    (journey): journey is NonNullable<typeof journey> => Boolean(journey)
  );

  return (
    <main className="min-h-screen px-6 py-14 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/experts"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors duration-300 ease-in-out hover:text-slate-900"
        >
          <ArrowLeft size={16} /> Back to Travel Experts
        </Link>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-glow">
          <div>
            <span className="rounded-full bg-apex-500 px-3 py-1 text-xs font-semibold uppercase text-white">{expert.role}</span>
            <h1 className="mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl">{expert.name}</h1>
            {destinations.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {destinations.map((destination) => (
                  <Link
                    key={destination.slug}
                    href={`/destinations/${destination.slug}`}
                    className="cursor-hover inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600 transition-colors duration-300 ease-in-out hover:bg-slate-200 hover:text-slate-900"
                  >
                    <MapPin size={14} className="text-apex-600" />
                    {destination.title}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative mt-8 h-[360px] overflow-hidden rounded-[1.5rem] bg-slate-100">
            <SafeImage src={expert.profileImage} alt={expert.name} fill sizes="(min-width: 1024px) 960px, 100vw" className="object-cover" />
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-6">
              <p className="text-lg leading-8 text-slate-600">{expert.bio}</p>

              {expert.travelStyles.length > 0 ? (
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Travel styles</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {expert.travelStyles.map((style) => (
                      <span key={style} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {expert.expertise.length > 0 ? (
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Areas of expertise</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {expert.expertise.map((item) => (
                      <span key={item} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {expert.languages?.length ? (
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Languages</p>
                  <p className="mt-3 inline-flex items-center gap-2 text-slate-600">
                    <Languages size={16} className="text-apex-600" />
                    {expert.languages.join(', ')}
                  </p>
                </div>
              ) : null}
            </div>

            <aside className="space-y-6 rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Plan with {expert.name.split(' ')[0]}</p>
              <p className="text-sm text-slate-600">
                Share your dates and details and this specialist will follow up over WhatsApp.
              </p>
              <ExpertTalkButton expert={expert} className="w-full" />
            </aside>
          </div>
        </div>

        {recommendedJourneys.length > 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-glow">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Recommended Journeys</h2>
            <p className="mt-2 text-slate-600">Real itineraries {expert.name.split(' ')[0]} recommends most often.</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {recommendedJourneys.map((journey) => (
                <PackageCard key={journey.slug} pkg={journey} />
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
