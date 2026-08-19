import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { destinations as allDestinations } from '@/config/destinations.config';
import type { Destination } from '@/types/destination';
import type { HotelPackage } from '@/types';

export interface DestinationStayCardProps {
  destinations?: Destination[];
  /** Real stay counts are computed from this list (same location-substring match
   *  `getHotels({ destination })` already uses) — omit it to render without counts. */
  hotels?: HotelPackage[];
}

// Defaults to every `isPopular` destination (same curation flags the homepage's
// Popular Destinations section already uses), sorted the same way — so adding a
// new destination to config/destinations.config.ts (e.g. a future Kashmir or
// Uttarakhand entry) surfaces here automatically, with no UI changes required.
const defaultDestinations = allDestinations
  .filter((destination) => destination.isPopular)
  .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

export default function DestinationStayCard({ destinations = defaultDestinations, hotels }: DestinationStayCardProps) {
  if (destinations.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {destinations.map((destination) => {
        const stayCount = hotels?.filter((hotel) => hotel.location.toLowerCase().includes(destination.title.toLowerCase())).length;
        const description = destination.editorialDescription ?? destination.description;
        return (
          <Link
            key={destination.slug}
            href={`/stays/${destination.slug}`}
            className="group relative block h-64 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 transition-transform duration-300 ease-out hover:-translate-y-1"
          >
            <SafeImage
              src={destination.image}
              alt={`Stays in ${destination.title}`}
              fill
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
              className="object-cover transition duration-300 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D1830] via-[#0D1830]/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xl font-bold text-white">{destination.title}</span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:bg-apex-500">
                  <ArrowUpRight size={16} />
                </span>
              </div>
              {description ? <p className="mt-1 line-clamp-2 text-sm text-slate-300">{description}</p> : null}
              {stayCount !== undefined ? (
                <p className="mt-2 text-md font-semibold uppercase tracking-wide text-apex-300">
                  {stayCount > 0 ? `${stayCount} stay${stayCount === 1 ? '' : 's'}` : 'Coming soon'}
                </p>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
