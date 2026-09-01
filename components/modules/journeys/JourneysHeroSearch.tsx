'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { DestinationField, TravelStyleField, DateRangeField, OccupancyField, SEARCH_PANEL_CLASS } from '@/components/modules/search';
import { destinations as curatedDestinations } from '@/config/destinations.config';
import { cn } from '@/lib/utils';
import type { DateRange, OccupancyDetails } from '@/types';

export interface JourneysHeroSearchProps {
  /** Real category values present in the catalog (see getPackageCategories in lib/packageFilters.ts) — never a hardcoded style list. */
  categories: string[];
  className?: string;
}

// The full curated catalog (not the short "trending" shortlist used by other search
// contexts) — this is a genuine destination search, so typing any real destination
// name (not just the handful of trending ones) should surface a match.
const DESTINATION_TITLES = curatedDestinations.map((destination) => destination.title);

/**
 * A compact, single-purpose search bar for the Journeys hero — not the full
 * multi-tab BookingWidget. Dates and travellers are collected for a premium,
 * complete-feeling search (matching the brief's 4-field layout) but only
 * destination/category actually filter /journeys — JourneysExplorer has no
 * date-based inventory to filter against, mirroring BookingWidget's own
 * "Journeys" tab, which has the same two real params. Selecting any field only
 * updates local state; only submitting runs the actual search.
 */
export default function JourneysHeroSearch({ categories, className }: JourneysHeroSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [destination, setDestination] = useState(() => searchParams.get('destination') ?? '');
  const [travelStyle, setTravelStyle] = useState(() => searchParams.get('category') ?? '');
  const [dateRange, setDateRange] = useState<DateRange>({ checkIn: null, checkOut: null });
  const [occupancy, setOccupancy] = useState<OccupancyDetails>({ adults: 2, children: 0, rooms: 1, pets: false });

  // Reconciles the hero's destination/style with the URL on every navigation that
  // changes it — JourneysExplorer's own filters, a shared /journeys?destination=...
  // link, or the browser's Back/Forward buttons — not just on first mount. Unlike
  // JourneysExplorer's own analogous effect, this one always re-syncs rather than
  // skipping a "previously self-pushed" query string: with only two plain fields and
  // no debounce, there's no interim value to protect, and skipping would leave the
  // input stale after Forward navigates back to a query this component pushed before.
  const searchParamsString = searchParams.toString();
  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    setDestination(params.get('destination') ?? '');
    setTravelStyle(params.get('category') ?? '');
  }, [searchParamsString]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new URLSearchParams();
    if (destination.trim()) query.set('destination', destination.trim());
    if (travelStyle.trim()) query.set('category', travelStyle.trim());
    const qs = query.toString();
    // scroll: false — JourneysExplorer's own results section is what should come into
    // view, not the top of the page Next.js would otherwise jump to.
    router.push(qs ? `/journeys?${qs}` : '/journeys', { scroll: false });
    document.getElementById('journeys-listing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(SEARCH_PANEL_CLASS, 'flex w-full flex-col gap-2 lg:flex-row lg:items-center lg:gap-3', className)}
    >
      <div className="grid flex-1 gap-2 lg:grid-cols-4 lg:items-center lg:gap-3">
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <DestinationField
            value={destination}
            onChange={setDestination}
            label="Where do you want to go?"
            icon={Search}
            placeholder="Search destinations"
            destinations={DESTINATION_TITLES}
          />
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <TravelStyleField value={travelStyle} onChange={setTravelStyle} styles={categories} placeholder="Travel style" />
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <DateRangeField value={dateRange} onChange={setDateRange} label="When?" placeholder="Select dates" />
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <OccupancyField value={occupancy} onChange={setOccupancy} />
        </motion.div>
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="cursor-hover inline-flex items-center justify-center gap-2 rounded-xl bg-apex-500 px-6 py-4 font-semibold text-white shadow-lg shadow-apex-500/30 transition-colors duration-300 ease-in-out hover:bg-apex-400 lg:py-5"
      >
        <Search size={18} />
        Search Journeys
      </motion.button>
    </form>
  );
}
