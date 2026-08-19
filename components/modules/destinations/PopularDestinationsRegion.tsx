import Link from 'next/link';
import DestinationCard from '@/components/modules/DestinationCard';
import { regions } from '@/config/regions.config';
import { cn } from '@/lib/utils';
import type { Destination, DestinationStats, RegionId } from '@/types';

export interface PopularDestinationsRegionProps {
  destinations: Destination[];
  stats: Record<string, DestinationStats>;
  activeRegionId?: RegionId;
}

const DISPLAY_COUNT = 6;

const tabClass = (active: boolean) =>
  cn(
    'cursor-hover rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-300 ease-in-out',
    active ? 'bg-apex-500 text-white shadow-lg shadow-apex-500/30' : 'bg-slate-200 text-slate-600 hover:text-slate-900'
  );

export default function PopularDestinationsRegion({ destinations, stats, activeRegionId }: PopularDestinationsRegionProps) {
  const activeRegion = activeRegionId ? regions.find((region) => region.id === activeRegionId) : undefined;
  const popular = destinations
    .filter((destination) => destination.isPopular)
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  const filtered = activeRegion ? popular.filter((destination) => destination.state === activeRegion.name) : popular;
  const shown = filtered.slice(0, DISPLAY_COUNT);

  return (
    <section className='bg-slate-100 py-12 lg:py-16'>
      <section className="mx-auto max-w-[1440px] px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">Curated by locals</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Where Travelers Go.{' '}
            <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">Where We Go Deeper.</span>
          </h2>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Link href="/destinations" className={tabClass(!activeRegionId)}>
            All
          </Link>
          {regions.map((region) => (
            <Link key={region.id} href={`/destinations?region=${region.id}`} className={tabClass(activeRegionId === region.id)}>
              {region.name}
            </Link>
          ))}
        </div>

        {shown.length ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((destination, index) => (
              <DestinationCard key={destination.slug} destination={destination} stats={stats[destination.slug]} priority={index < 3} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-center text-slate-500">No popular destinations in this region yet.</p>
        )}
      </section>
    </section>
  );
}
