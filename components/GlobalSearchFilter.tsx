'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Search } from 'lucide-react';
import {
  DestinationField,
  TravelStyleField,
  DateRangeField,
  OccupancyField,
  CounterField,
  SEARCH_PANEL_CLASS,
  SEARCH_FIELD_CLASS
} from '@/components/modules/search';
import {
  trendingDestinations,
  globalSearchTabs,
  destinationTravelStyles,
  seasonOptions,
  stayTypes,
  journeyCategories as defaultJourneyCategories,
  planningNeeds,
  popularSearchesByTab,
  type GlobalSearchTab
} from '@/config/search.config';
import { experienceTypes } from '@/config/experiences.config';
import { vehicleOptions } from '@/config/transport.config';
import { destinations } from '@/config/destinations.config';
import { cn } from '@/lib/utils';
import type { DateRange, OccupancyDetails } from '@/types';

const VEHICLE_NAMES = vehicleOptions.map((vehicle) => vehicle.name);

/** /experts filters on the real destination slug (expert.destinationSlugs), not the
 *  free-text place name this shared "where" field collects — resolves a typed place
 *  to its real slug via the same curated catalog /destinations itself uses, so the
 *  Travel Experts tab's search actually reaches a destination the page can match
 *  instead of silently filtering nothing. Unresolved text (a place outside the
 *  curated catalog) is simply left off rather than sent as a filter that can never
 *  match a slug. */
function resolveDestinationSlug(value: string): string | undefined {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return undefined;
  return destinations.find((destination) => destination.title.toLowerCase() === trimmed)?.slug;
}

export interface GlobalSearchFilterProps {
  className?: string;
  /** Which tab is active on mount. Defaults to 'Stays' — the Home page's original behavior. */
  defaultTab?: GlobalSearchTab;
  /**
   * Where the Stays tab's search submits to. Defaults to '/stays/search' — the Apex
   * Stays vertical is canonical now; that route reads `destination`/`checkIn`/
   * `checkOut`/`guests`, it just doesn't have a matching `category` filter, so
   * stay-type selection is decorative there.
   */
  staysPath?: string;
  /** Seeds the "where" field on mount — used by pages that deep-link a destination via the URL. */
  initialDestination?: string;
  /** Seeds the Destinations tab's travel-style field on mount (see `destinationStyles`). */
  initialStyle?: string;
  /**
   * Travel-style options for the Destinations tab. Defaults to a general free-text style
   * list; pass the canonical `travelStyles` labels (see config/travelStyles.config.ts) on
   * pages whose results are actually filtered against that fixed vocabulary.
   */
  destinationStyles?: string[];
  /**
   * Travel-style options for the Journeys tab. Defaults to a general category list; pass
   * the real categories present in the packages catalog (see getPackageCategories in
   * lib/packageFilters.ts) on pages that filter against live inventory.
   */
  journeyCategories?: string[];
  /** Seeds the Transport tab's Pickup Location field on mount — used by /transport to deep-link a search. */
  initialPickup?: string;
  /** Seeds the Transport tab's Drop Location field on mount — used by /transport to deep-link a search. */
  initialDrop?: string;
  /** Seeds the Transport tab's Date field on mount. */
  initialDate?: string;
  /** Seeds the Transport tab's Passengers field on mount. */
  initialTravelers?: number;
  /** Seeds the Transport tab's Vehicle type field on mount — should match a name in config/transport.config.ts's vehicleOptions. */
  initialVehicle?: string;
}

function SearchTabs({ active, onChange }: { active: GlobalSearchTab; onChange: (tab: GlobalSearchTab) => void }) {
  return (
    <div className="flex items-center gap-5 overflow-x-auto px-2 sm:gap-7 sm:px-3">
      {globalSearchTabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            'cursor-hover relative shrink-0 whitespace-nowrap pb-3 pt-3 text-sm font-medium transition-colors duration-300 ease-in-out sm:text-base',
            active === tab ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {tab}
          {active === tab ? (
            <motion.span
              layoutId="global-search-tab-underline"
              className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-apex-500"
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
          ) : null}
        </button>
      ))}
    </div>
  );
}

/** A plain native date/time input, styled to match the FieldPopover-based fields around it. */
function InlineDateTimeField({
  icon: Icon,
  label,
  type,
  value,
  onChange
}: {
  icon: typeof Calendar;
  label: string;
  type: 'date' | 'time';
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={SEARCH_FIELD_CLASS}>
      <Icon size={20} className="shrink-0 text-apex-500" />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm text-slate-900 outline-none"
        />
      </span>
    </label>
  );
}

/**
 * The single, shared search-and-filter panel for the whole portal — Home, Apex Stays,
 * Our Journeys, Experiences and any other page that needs the same multi-tab search
 * (Destinations/Stays/Journeys/Experiences/Transport/Travel Experts), Quick Select
 * region popups, Travel Style pills, dual-month date range picker and Travelers/Pets
 * counter, all behaving identically and routing through the same query-param logic.
 */
export default function GlobalSearchFilter({
  className,
  defaultTab = 'Stays',
  staysPath = '/stays/search',
  initialDestination = '',
  initialStyle = '',
  destinationStyles = destinationTravelStyles,
  journeyCategories = defaultJourneyCategories,
  initialPickup = '',
  initialDrop = '',
  initialDate = '',
  initialTravelers = 2,
  initialVehicle = ''
}: GlobalSearchFilterProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<GlobalSearchTab>(defaultTab);

  // Shared "where" field — every tab except Transport (which needs two distinct
  // locations) treats this as its single place input.
  const [destination, setDestination] = useState(initialDestination);
  const [pickup, setPickup] = useState(defaultTab === 'Transport' ? initialPickup : '');
  const [drop, setDrop] = useState(defaultTab === 'Transport' ? initialDrop : '');
  const [travelStyle, setTravelStyle] = useState(() => {
    if (defaultTab === 'Destinations') return initialStyle;
    if (defaultTab === 'Transport') return initialVehicle;
    return '';
  });
  const [season, setSeason] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ checkIn: null, checkOut: null });
  const [occupancy, setOccupancy] = useState<OccupancyDetails>({ adults: 2, children: 0, rooms: 1, pets: false });
  const [date, setDate] = useState(defaultTab === 'Transport' ? initialDate : '');
  const [time, setTime] = useState('');
  const [participants, setParticipants] = useState(2);
  const [passengers, setPassengers] = useState(defaultTab === 'Transport' ? initialTravelers : 2);
  const [travelers, setTravelers] = useState(2);

  function resetFields() {
    setDestination('');
    setPickup('');
    setDrop('');
    setTravelStyle('');
    setSeason('');
    setDateRange({ checkIn: null, checkOut: null });
    setDate('');
    setTime('');
  }

  function selectTab(tab: GlobalSearchTab) {
    setActiveTab(tab);
    resetFields();
  }

  function goTo(path: string, params: Record<string, string | undefined>, hash?: string) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && value.trim()) query.set(key, value.trim());
    }
    const qs = query.toString();
    const suffix = hash ? `#${hash}` : '';
    router.push(`${path}${qs ? `?${qs}` : ''}${suffix}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    switch (activeTab) {
      case 'Destinations':
        goTo('/destinations', { destination, style: travelStyle, season });
        return;

      case 'Stays':
        goTo(staysPath, {
          destination,
          category: travelStyle,
          checkIn: dateRange.checkIn ? format(dateRange.checkIn, 'yyyy-MM-dd') : undefined,
          checkOut: dateRange.checkOut ? format(dateRange.checkOut, 'yyyy-MM-dd') : undefined,
          guests: String(occupancy.adults + occupancy.children)
        });
        return;

      case 'Journeys':
        goTo('/journeys', { destination, category: travelStyle });
        return;

      case 'Experiences':
        // /experiences reads q/category (see ExperiencesListing), not where/type — date and
        // participants have no matching filter there, so they stay UI-only.
        goTo('/experiences', { q: destination, category: travelStyle }, 'listing');
        return;

      case 'Transport':
        // A real form submission (as opposed to a Popular Searches shortcut, see
        // handlePopularSearch below) is an intentional Transport search — flag it so
        // /transport opens in focused Search Results Mode instead of the full
        // Discovery page (see app/transport/page.tsx's `searched` param).
        goTo('/transport', {
          pickup,
          destination: drop,
          date,
          time,
          travellers: String(passengers),
          vehicle: travelStyle,
          searched: '1'
        });
        return;

      case 'Travel Experts':
        // /experts reads `destination` (a real slug) and `travelStyle` (see
        // ExpertFilters/ExpertsHeroSearch) — not `where`/`need`, which it never read at
        // all, so every homepage Travel Experts search was previously silently ignored.
        goTo('/experts', { destination: resolveDestinationSlug(destination), travelStyle });
    }
  }

  function handlePopularSearch(place: string) {
    setDestination(place);
    if (activeTab === 'Travel Experts') {
      goTo('/experts', { destination: resolveDestinationSlug(place) });
      return;
    }
    if (activeTab === 'Transport') {
      goTo('/transport', { destination: place });
      return;
    }
    if (activeTab === 'Destinations') {
      goTo('/destinations', { destination: place });
      return;
    }
    if (activeTab === 'Journeys') {
      goTo('/journeys', { destination: place });
      return;
    }
    if (activeTab === 'Experiences') {
      goTo('/experiences', { q: place }, 'listing');
      return;
    }
    goTo(staysPath, { destination: place });
  }

  return (
    <div className={cn(SEARCH_PANEL_CLASS, 'w-full', className)}>
      <SearchTabs active={activeTab} onChange={selectTab} />

      <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 px-2 pt-2 lg:flex-row lg:items-end lg:gap-3">
        <div className="grid flex-1 gap-2 lg:grid-cols-4 lg:items-center lg:gap-3">
          {activeTab === 'Destinations' && (
            <>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <DestinationField
                  value={destination}
                  onChange={setDestination}
                  label="Where do you want to go?"
                  icon={Search}
                  placeholder="Search places or destinations"
                  destinations={trendingDestinations}
                />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <TravelStyleField value={travelStyle} onChange={setTravelStyle} styles={destinationStyles} placeholder="Travel style / interest" />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <TravelStyleField value={season} onChange={setSeason} styles={seasonOptions} placeholder="Season" />
              </motion.div>
            </>
          )}

          {activeTab === 'Stays' && (
            <>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <DestinationField
                  value={destination}
                  onChange={setDestination}
                  label="Where do you want to go?"
                  icon={Search}
                  placeholder="Search places or destinations"
                  destinations={trendingDestinations}
                />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <TravelStyleField value={travelStyle} onChange={setTravelStyle} styles={stayTypes} placeholder="Stay type" />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <DateRangeField value={dateRange} onChange={setDateRange} label="Dates" placeholder="Select dates" />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <OccupancyField value={occupancy} onChange={setOccupancy} />
              </motion.div>
            </>
          )}

          {activeTab === 'Journeys' && (
            <>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <DestinationField
                  value={destination}
                  onChange={setDestination}
                  label="Where do you want to go?"
                  icon={Search}
                  placeholder="Search places or destinations"
                  destinations={trendingDestinations}
                />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <TravelStyleField value={travelStyle} onChange={setTravelStyle} styles={journeyCategories} placeholder="Travel style" />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <DateRangeField value={dateRange} onChange={setDateRange} label="Travel dates" placeholder="Select dates" />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <OccupancyField value={occupancy} onChange={setOccupancy} />
              </motion.div>
            </>
          )}

          {activeTab === 'Experiences' && (
            <>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <DestinationField
                  value={destination}
                  onChange={setDestination}
                  label="Where?"
                  icon={MapPin}
                  placeholder="Search places or destinations"
                  destinations={trendingDestinations}
                />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <TravelStyleField value={travelStyle} onChange={setTravelStyle} styles={experienceTypes} placeholder="Experience type" />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <InlineDateTimeField icon={Calendar} label="Date" type="date" value={date} onChange={setDate} />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <CounterField label="Participants" value={participants} onChange={setParticipants} min={1} max={20} stepperLabel="Participant" />
              </motion.div>
            </>
          )}

          {activeTab === 'Transport' && (
            <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-6 lg:gap-3">
              <motion.div className="lg:col-span-2" whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <DestinationField
                  value={pickup}
                  onChange={setPickup}
                  label="Pickup Location"
                  icon={MapPin}
                  placeholder="e.g., Manali Bus Stand"
                  destinations={trendingDestinations}
                />
              </motion.div>
              <motion.div className="lg:col-span-2" whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <DestinationField
                  value={drop}
                  onChange={setDrop}
                  label="Drop Location"
                  icon={MapPin}
                  placeholder="e.g., Chandigarh Airport"
                  destinations={trendingDestinations}
                />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <InlineDateTimeField icon={Calendar} label="Date" type="date" value={date} onChange={setDate} />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <InlineDateTimeField icon={Clock} label="Time" type="time" value={time} onChange={setTime} />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <CounterField label="Passengers" value={passengers} onChange={setPassengers} min={1} max={30} stepperLabel="Passenger" />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <TravelStyleField value={travelStyle} onChange={setTravelStyle} styles={VEHICLE_NAMES} placeholder="Vehicle type" />
              </motion.div>
            </div>
          )}

          {activeTab === 'Travel Experts' && (
            <>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <DestinationField
                  value={destination}
                  onChange={setDestination}
                  label="Where are you going?"
                  icon={MapPin}
                  placeholder="Search places or destinations"
                  destinations={trendingDestinations}
                />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <TravelStyleField value={travelStyle} onChange={setTravelStyle} styles={planningNeeds} placeholder="Planning need" />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <InlineDateTimeField icon={Calendar} label="When?" type="date" value={date} onChange={setDate} />
              </motion.div>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <CounterField label="Travelers" value={travelers} onChange={setTravelers} min={1} max={20} stepperLabel="Traveler" />
              </motion.div>
            </>
          )}
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="cursor-hover inline-flex items-center justify-center gap-2 rounded-xl bg-apex-500 px-6 py-5 font-semibold text-white shadow-lg shadow-apex-500/30 transition-colors duration-300 ease-in-out hover:bg-apex-400"
        >
          <Search size={20} />
          Explore
        </motion.button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 px-1 pb-1 ms-2">
        <span className="text-xs font-medium text-slate-500">Popular Searches:</span>
        {popularSearchesByTab[activeTab].map((place) => (
          <button
            key={place}
            type="button"
            onClick={() => handlePopularSearch(place)}
            className="cursor-hover rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-all duration-300 ease-in-out hover:border-apex-400/50 hover:bg-apex-50 hover:text-apex-700"
          >
            {place}
          </button>
        ))}
      </div>
    </div>
  );
}
