'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DestinationField, DateRangeField, OccupancyField, SEARCH_PANEL_CLASS } from '@/components/modules/search';
import { trendingDestinations } from '@/config/search.config';
import { cn } from '@/lib/utils';
import type { DateRange, OccupancyDetails } from '@/types';

export interface StaySearchProps {
  defaultDestination?: string;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  defaultGuests?: string;
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function StaySearch({ defaultDestination, defaultCheckIn, defaultCheckOut, defaultGuests }: StaySearchProps) {
  const router = useRouter();
  const [destination, setDestination] = useState(defaultDestination ?? '');
  const [dateRange, setDateRange] = useState<DateRange>({
    checkIn: parseDate(defaultCheckIn),
    checkOut: parseDate(defaultCheckOut)
  });
  const [occupancy, setOccupancy] = useState<OccupancyDetails>({
    adults: Number(defaultGuests) > 0 ? Number(defaultGuests) : 2,
    children: 0,
    rooms: 1,
    pets: false
  });

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
    <form
      onSubmit={handleSubmit}
      className={cn(SEARCH_PANEL_CLASS, 'mx-auto mt-8 flex w-full max-w-[1440px] flex-col gap-2 lg:flex-row lg:items-center lg:gap-3')}
    >
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

      <Button type="submit" size="lg" className="w-full justify-center lg:w-auto">
        <Search size={18} />
        Search
      </Button>
    </form>
  );
}
