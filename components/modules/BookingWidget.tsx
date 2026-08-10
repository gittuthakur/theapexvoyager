'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search } from 'lucide-react';
import { bookingFilters, bookingTabs, destinationPlaceholder } from '@/config/search.config';
import { DateRangeField, DestinationField, OccupancyField, formatRange, summarizeOccupancy } from '@/components/modules/search';
import { cn } from '@/lib/utils';
import type { DateRange, OccupancyDetails, SearchFilterOption, SearchQuery } from '@/types';

export interface BookingWidgetProps {
  tabs?: string[];
  filters?: SearchFilterOption[];
  destinationPlaceholder?: string;
  searchHref?: string;
  onSearch?: (query: SearchQuery) => void;
  className?: string;
}

const defaultDateRange: DateRange = { checkIn: null, checkOut: null };
const defaultOccupancyDetails: OccupancyDetails = { adults: 2, children: 0, rooms: 1, pets: false };

export default function BookingWidget({
  tabs = bookingTabs,
  filters = bookingFilters,
  destinationPlaceholder: destinationPlaceholderProp = destinationPlaceholder,
  searchHref = '/tours',
  onSearch,
  className
}: BookingWidgetProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [destination, setDestination] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [occupancyDetails, setOccupancyDetails] = useState<OccupancyDetails>(defaultOccupancyDetails);
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(filters.map((filter) => [filter.id, filter.defaultValue]))
  );

  function setFilterValue(id: string, value: string) {
    setFilterValues((previous) => ({ ...previous, [id]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query: SearchQuery = {
      tab: activeTab,
      destination,
      dates: formatRange(dateRange),
      occupancy: summarizeOccupancy(occupancyDetails),
      filters: filterValues,
      dateRange,
      occupancyDetails
    };

    if (onSearch) {
      onSearch(query);
      return;
    }

    const params = new URLSearchParams({
      tab: query.tab,
      destination: query.destination,
      dates: query.dates,
      occupancy: query.occupancy,
      ...query.filters
    });
    router.push(`${searchHref}?${params.toString()}`);
  }

  return (
    <section
      aria-labelledby="booking-search-heading"
      className={cn(
        'w-full rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-glow sm:p-6',
        className
      )}
    >
      <h2 id="booking-search-heading" className="sr-only">
        Search tours, hotels, and homestays
      </h2>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Booking category" className="flex items-center gap-1 rounded-full">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'cursor-hover rounded-full px-6 py-2.5 text-sm font-semibold transition',
                activeTab === tab ? 'bg-apex-500 text-white shadow-lg shadow-apex-500/30' : 'text-slate-300 hover:text-white'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {filters.map((filter) => (
            <div key={filter.id} className="relative">
              <select
                value={filterValues[filter.id]}
                onChange={(event) => setFilterValue(filter.id, event.target.value)}
                aria-label={filter.label}
                className="cursor-hover appearance-none rounded-full border border-white/10 bg-white/5 px-4 py-2 pr-8 text-sm text-slate-200 outline-none transition hover:border-apex-400/60"
              >
                {filter.options.map((option) => (
                  <option key={option} value={option} className="bg-slate-900">
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_1.3fr_1.1fr_auto] lg:items-stretch">
        <DestinationField value={destination} onChange={setDestination} placeholder={destinationPlaceholderProp} />
        <DateRangeField value={dateRange} onChange={setDateRange} />
        <OccupancyField value={occupancyDetails} onChange={setOccupancyDetails} />

        <button
          type="submit"
          className="cursor-hover inline-flex items-center justify-center gap-2 rounded-2xl bg-apex-500 px-8 py-3 text-md font-semibold text-white shadow-lg shadow-apex-500/30 transition hover:bg-apex-400"
        >
          <Search size={22} />
          Explore Tours
        </button>
      </form>
    </section>
  );
}
