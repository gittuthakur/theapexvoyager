'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { DestinationField, DateRangeField, OccupancyField, SEARCH_PANEL_CLASS } from '@/components/modules/search';
import { trendingDestinations } from '@/config/search.config';
import { cn } from '@/lib/utils';
import type { DateRange, OccupancyDetails } from '@/types';

export interface StaysHeroSearchProps {
  className?: string;
}

/**
 * Pill-styled hero search for the Apex Stays banner — mirrors JourneysHeroSearch's
 * floating-card layout while keeping StaySearch's original query params
 * (destination/checkIn/checkOut/guests) so /stays/search's filtering is unaffected.
 */
export default function StaysHeroSearch({ className }: StaysHeroSearchProps) {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ checkIn: null, checkOut: null });
  const [occupancy, setOccupancy] = useState<OccupancyDetails>({ adults: 2, children: 0, rooms: 1, pets: false });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set('destination', destination.trim());
    if (dateRange.checkIn) params.set('checkIn', format(dateRange.checkIn, 'yyyy-MM-dd'));
    if (dateRange.checkOut) params.set('checkOut', format(dateRange.checkOut, 'yyyy-MM-dd'));
    params.set('guests', String(occupancy.adults + occupancy.children));
    router.push(params.toString() ? `/stays/search?${params}` : '/stays/search');
  }

  return (
    <form onSubmit={handleSubmit} className={cn(SEARCH_PANEL_CLASS, 'flex w-full flex-col gap-2 lg:flex-row lg:items-center lg:gap-3', className)}>
      <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:items-center lg:gap-3">
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <DestinationField
            value={destination}
            onChange={setDestination}
            label="Where do you want to stay?"
            icon={Search}
            placeholder="Manali, Shimla, Kasol..."
            destinations={trendingDestinations}
          />
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <DateRangeField value={dateRange} onChange={setDateRange} label="Dates" placeholder="Select dates" />
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
        Search Stays
      </motion.button>
    </form>
  );
}
