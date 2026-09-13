import { Check, Clock, Compass, MapPin, Snowflake } from 'lucide-react';
import type { RegionProfile } from '@/types/regionHub';

export interface RegionOverviewProps {
  region: RegionProfile;
}

export default function RegionOverview({ region }: RegionOverviewProps) {
  const { overview } = region;

  const information: Array<[typeof Clock, string, string]> = [
    [Clock, 'Best season', overview.bestSeason],
    [Compass, 'Ideal duration', overview.idealDuration],
    [MapPin, 'Starting point', overview.startingPoint],
    [Snowflake, 'Climate', overview.climate]
  ];

  return (
    <section id="overview" className="grid grid-cols-1 gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="min-w-0 pr-16 sm:pr-0">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-apex-500">The story</p>
        {/* pr-16 reserves space so a long wrapped region name (e.g. "Uttarakhand") can't
            wrap under the fixed floating WhatsApp button's mobile footprint (bottom-6
            right-6, ~56px wide) — measured overlapping at 390px before this fix. */}
        <h2 className="mt-3 text-3xl font-bold text-slate-900">About {region.name}</h2>
        <p className="mt-5 text-lg leading-8 text-slate-600">{overview.description}</p>

        {overview.whyVisit?.length ? (
          <ul className="mt-6 space-y-3">
            {overview.whyVisit.map((reason) => (
              <li key={reason} className="flex gap-3 text-sm leading-6 text-slate-700">
                <Check className="mt-0.5 shrink-0 text-apex-500" size={16} aria-hidden="true" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {overview.bestFor?.length ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Best for</span>
            {overview.bestFor.map((tag) => (
              <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-200">
        {information.map(([Icon, label, value]) => (
          <div key={label} className="min-w-0 bg-white p-5">
            <Icon className="text-apex-500" size={18} />
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
