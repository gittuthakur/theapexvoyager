import Link from 'next/link';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatINR } from '@/lib/pricing';
import { formatDurationShort } from '@/lib/packageFilters';
import type { TravelPackage } from '@/types';

export interface SignatureJourneysProps {
  packages: TravelPackage[];
}

function JourneyMeta({ pkg }: { pkg: TravelPackage }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        <Clock size={15} className="text-apex-500" />
        {formatDurationShort(pkg.duration)}
      </span>
      <span aria-hidden="true">·</span>
      <span>{pkg.category}</span>
    </p>
  );
}

/**
 * Editorial "1 large + 2 small" featured layout — deliberately not the
 * master-detail pattern used by FeatureGrid/FeaturedTours elsewhere on the site
 * (those operate on TourPackage data and a different interaction model).
 */
export default function SignatureJourneys({ packages }: SignatureJourneysProps) {
  if (!packages.length) return null;
  const [lead, ...rest] = packages;
  const secondary = rest.slice(0, 2);

  return (
    <section className="mx-auto max-w-[1440px] px-6 py-16 lg:py-20">
      <div className="max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">Signature Journeys</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Journeys Worth Taking</h2>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Thoughtfully curated Himalayan journeys designed to turn a trip into a story worth remembering.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-glow relative">
          <div className="relative h-full overflow-hidden bg-slate-900">
            <SafeImage
              src={lead.image}
              alt={lead.name}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover transition duration-700 ease-in-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D1830] via-[#0D1830]/75 to-transparent" />
            <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-apex-700 backdrop-blur-sm">
              {lead.destination}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-7 sm:p-8 absolute w-full bottom-0">
            <div>
              <h3 className="text-2xl font-bold text-white sm:text-3xl">{lead.name}</h3>
              <div className="mt-2">
                <JourneyMeta pkg={lead} />
              </div>
            </div>
            <p className="line-clamp-3 text-base leading-7 text-slate-300">{lead.shortDescription}</p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-4  pt-5">
              <div>
                <p className="text-sm uppercase tracking-[0.1em] text-slate-300">From</p>
                <p className="text-4xl font-extrabold text-white">
                  {formatINR(lead.price)}
                  <span className="ml-1 text-sm font-normal text-slate-400">/ person</span>
                </p>
              </div>
              <Link
                href={`/journeys/${lead.slug}`}
                className="cursor-hover inline-flex items-center gap-2 rounded-xl bg-apex-500 px-5 py-3 font-semibold text-white shadow-sm transition-all duration-300 ease-in-out hover:bg-apex-600"
              >
                View Journey
                <ArrowRight size={20} className="transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </article>

        <div className="flex flex-col gap-6">
          {secondary.map((pkg) => (
            <Link
              key={pkg.slug}
              href={`/journeys/${pkg.slug}`}
              className="cursor-hover group flex flex-1 gap-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg sm:p-5"
            >
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-900 sm:h-36 sm:w-36">
                <SafeImage
                  src={pkg.image}
                  alt={pkg.name}
                  fill
                  sizes="140px"
                  className="object-cover transition duration-700 ease-in-out group-hover:scale-110"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.08em] text-apex-600">
                  <MapPin size={16} />
                  {pkg.destination}
                </p>
                <h3 className="truncate text-base font-bold text-slate-900 sm:text-xl">{pkg.name}</h3>
                <JourneyMeta pkg={pkg} />
                <p className="mt-auto text-3xl font-bold text-slate-900">
                  {formatINR(pkg.price)} <span className="text-sm font-normal text-slate-500">/ person</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
