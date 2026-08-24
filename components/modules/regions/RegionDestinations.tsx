import DestinationCard from '@/components/modules/DestinationCard';
import type { Destination } from '@/types/destination';

export interface RegionDestinationsProps {
  destinations: Destination[];
  regionName: string;
}

export default function RegionDestinations({ destinations, regionName }: RegionDestinationsProps) {
  return (
    <section id="destinations" className="py-8">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-apex-500">Go deeper</p>
      <h2 className="mt-3 text-3xl font-bold text-slate-900">Destinations in {regionName}</h2>

      {destinations.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination, index) => (
            <DestinationCard key={destination.slug} destination={destination} priority={index < 3} />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No destinations published for {regionName} yet.
        </p>
      )}
    </section>
  );
}
