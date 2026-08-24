import Link from 'next/link';
import { Eye, MapPin } from 'lucide-react';
import ExpertTalkButton from '@/components/modules/ExpertTalkButton';
import { SafeImage } from '@/components/ui/SafeImage';
import { getCuratedDestinationBySlug } from '@/lib/destinations';
import type { TravelExpert } from '@/types/expert';

export interface ExpertCardProps {
  expert: TravelExpert;
}

// Visual convention mirrors PackageCard (rounded image + badge pill top-left,
// padded content below). No rating/review/years-of-experience badge — that data
// isn't real for this catalog (see AGENTS.md's ban on fabricated trust signals).
export default async function ExpertCard({ expert }: ExpertCardProps) {
  const destinationTitles = (
    await Promise.all(expert.destinationSlugs.map(async (slug) => (await getCuratedDestinationBySlug(slug))?.title))
  ).filter((title): title is string => Boolean(title));

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-56 overflow-hidden rounded-t-3xl bg-slate-100">
        <SafeImage
          src={expert.profileImage}
          alt={expert.name}
          fill
          sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-apex-500 px-3 py-1 text-xs font-semibold uppercase text-white">
          {expert.role}
        </span>
      </div>

      <div className="flex flex-1 flex-col space-y-3 p-5">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{expert.name}</h3>
          {destinationTitles.length > 0 ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin size={16} className="text-apex-600" />
              {destinationTitles.join(' • ')}
            </p>
          ) : null}
        </div>

        {expert.expertise.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {expert.expertise.map((item) => (
              <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {item}
              </span>
            ))}
          </div>
        ) : null}

        {expert.languages?.length ? (
          <p className="text-xs text-slate-500">Speaks {expert.languages.join(', ')}</p>
        ) : null}

        <div className="flex-1" />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href={`/experts/${expert.slug}`}
            className="cursor-hover inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-apex-500 px-5 py-3 text-center text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-apex-400"
          >
            <Eye size={20} />
            View Profile
          </Link>
          <ExpertTalkButton expert={expert} className="flex-1" />
        </div>
      </div>
    </article>
  );
}
