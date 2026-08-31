'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, Map as MapIcon, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import DestinationCard from '@/components/modules/DestinationCard';
import MapViewPlaceholder from '@/components/modules/destinations/MapViewPlaceholder';
import PriceRangeSlider from '@/components/modules/destinations/PriceRangeSlider';
import { FilterAccordion, FilterCheckbox } from '@/components/modules/destinations/FilterAccordion';
import { FieldPopover } from '@/components/modules/search';
import {
  FILTER_PANEL_CLASS,
  FILTER_EMPTY_STATE_CLASS,
  FILTER_CHIP_CLASS,
  FILTER_CHIP_REMOVE_CLASS,
  filterPillClass,
  filterTriggerClass
} from '@/components/modules/filters/filterStyles';
import { Pagination } from '@/components/ui';
import { filterDestinations, getRealStartingPrices, paginate, sortDestinations } from '@/lib/destinationFilters';
import { getAllRegions } from '@/lib/regions';
import { getAllTravelStyles, resolveTravelStyleFromLabel } from '@/lib/travelStyles';
import { seasons as seasonOptions } from '@/config/seasons.config';
import { cn } from '@/lib/utils';
import type { Destination, DestinationSortOption, DestinationStats, DestinationStyleId, DestinationViewMode, RegionId, SeasonId } from '@/types';

export interface DestinationsExplorerProps {
  destinations: Destination[];
  /** Plain object (not a Map) so this can cross the Server→Client Component boundary as a prop. */
  stats: Record<string, DestinationStats>;
  /** All seed values below come straight from the page's `searchParams` — multi-select facets are comma-separated. */
  initialQuery?: string;
  initialRegion?: string;
  initialStyles?: string;
  initialSeasons?: string;
  initialPriceMin?: string;
  initialPriceMax?: string;
  initialBestFor?: string;
  initialSort?: string;
  initialPage?: string;
  initialView?: string;
}

const PAGE_SIZE = 10;
const BEST_FOR_OPTIONS = ['Couples', 'Families', 'Friends & Groups', 'Solo Travelers'];

const SORT_LABELS: Record<DestinationSortOption, string> = {
  popular: 'Most Popular',
  rating: 'Highest Rated',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low'
};

function splitParam(value?: string): string[] {
  return value
    ? value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
}

function isSortOption(value?: string): value is DestinationSortOption {
  return value === 'popular' || value === 'rating' || value === 'price-asc' || value === 'price-desc';
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((current) => current !== value) : [...values, value];
}

export default function DestinationsExplorer({
  destinations,
  stats,
  initialQuery = '',
  initialRegion,
  initialStyles,
  initialSeasons,
  initialPriceMin,
  initialPriceMax,
  initialBestFor,
  initialSort,
  initialPage,
  initialView
}: DestinationsExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const statsMap = useMemo(() => new Map(Object.entries(stats)), [stats]);
  const regions = getAllRegions();
  const travelStyleOptions = getAllTravelStyles();

  // The full real price range across the current destination set — the slider/
  // histogram's bounds. Never fabricated: destinations with no real journey price
  // simply aren't part of this range.
  const priceBounds = useMemo(() => {
    const prices = getRealStartingPrices(destinations, statsMap);
    return prices.length ? { min: Math.min(...prices), max: Math.max(...prices), prices } : null;
  }, [destinations, statsMap]);

  const [query, setQuery] = useState(initialQuery);
  const [activeRegion, setActiveRegion] = useState<RegionId | 'all'>((initialRegion as RegionId) || 'all');
  const [activeStyles, setActiveStyles] = useState<string[]>(splitParam(initialStyles));
  const [activeSeasons, setActiveSeasons] = useState<string[]>(splitParam(initialSeasons));
  const [activeBestFor, setActiveBestFor] = useState<string[]>(splitParam(initialBestFor));
  const [sortBy, setSortBy] = useState<DestinationSortOption>(isSortOption(initialSort) ? initialSort : 'popular');
  const [page, setPage] = useState(Number(initialPage) > 0 ? Number(initialPage) : 1);
  const [view, setView] = useState<DestinationViewMode>(initialView === 'map' ? 'map' : 'cards');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersAnchorRef = useRef<HTMLDivElement>(null);

  // `null` means "not narrowed" — the slider sits at the full real bounds and
  // priceless destinations are never excluded. Only becomes a concrete [min,max]
  // once the visitor actually drags a handle (or a ?priceMin=&priceMax= deep link).
  const [priceRange, setPriceRange] = useState<[number, number] | null>(
    initialPriceMin && initialPriceMax ? [Number(initialPriceMin), Number(initialPriceMax)] : null
  );
  const isPriceNarrowed = priceRange !== null && priceBounds !== null && (priceRange[0] > priceBounds.min || priceRange[1] < priceBounds.max);
  // Memoized so this stays referentially stable across renders when nothing about the
  // price filter actually changed — otherwise (a fresh [min, max] array literal every
  // render whenever priceRange is null) every effect and useMemo below that lists it as
  // a dependency would re-fire on every unrelated re-render, not just real filter changes.
  const displayedPriceRange: [number, number] = useMemo(
    () => priceRange ?? (priceBounds ? [priceBounds.min, priceBounds.max] : [0, 0]),
    [priceRange, priceBounds]
  );

  // A label that doesn't resolve to a canonical style (a stale/hand-edited `?style=`
  // value) falls back to itself rather than being dropped — matchesStyle/getTravelStyleById
  // safely treat an unrecognized id as "no destination has this style" (see lib/travelStyles.ts),
  // so an unresolvable style still narrows results to genuinely zero instead of silently
  // being ignored and falling back to the full unfiltered catalog.
  const activeStyleIds = useMemo(
    () => activeStyles.map((label) => resolveTravelStyleFromLabel(label)?.id ?? (label as DestinationStyleId)),
    [activeStyles]
  );
  // Same fallback-to-itself shape as activeStyleIds above — an unresolvable season label
  // must still reach filterDestinations as a non-empty request (so it narrows to zero),
  // not be silently dropped into an empty array that behaves as "no season filter".
  const activeSeasonIds = useMemo(
    () => activeSeasons.map((label) => seasonOptions.find((season) => season.label === label)?.id ?? (label as SeasonId)),
    [activeSeasons]
  );

  const filtered = useMemo(
    () =>
      filterDestinations(
        destinations,
        {
          query,
          region: activeRegion === 'all' ? undefined : activeRegion,
          styles: activeStyleIds,
          seasons: activeSeasonIds,
          priceMin: isPriceNarrowed ? displayedPriceRange[0] : undefined,
          priceMax: isPriceNarrowed ? displayedPriceRange[1] : undefined,
          bestFor: activeBestFor.length ? activeBestFor : undefined
        },
        statsMap
      ),
    [destinations, query, activeRegion, activeStyleIds, activeSeasonIds, isPriceNarrowed, displayedPriceRange, activeBestFor, statsMap]
  );

  const sorted = useMemo(() => sortDestinations(filtered, sortBy, statsMap), [filtered, sortBy, statsMap]);
  const { items: paginated, totalPages, page: safePage } = useMemo(() => paginate(sorted, page, PAGE_SIZE), [sorted, page]);

  const activeFilterCount =
    (activeRegion !== 'all' ? 1 : 0) + activeStyles.length + activeSeasons.length + (isPriceNarrowed ? 1 : 0) + activeBestFor.length;

  // Any change to what's being shown should land the reader back on page 1 —
  // otherwise a narrower filter can strand them on a now-nonexistent page. Skipped
  // on the initial mount — otherwise this fires immediately after `page` was just
  // seeded from `initialPage` (e.g. a `?page=2` deep link or an explorerKey remount
  // from the URL-sync effect below) and stomps it straight back to 1, making any
  // page beyond 1 unreachable.
  const skipNextPageReset = useRef(true);
  useEffect(() => {
    if (skipNextPageReset.current) {
      skipNextPageReset.current = false;
      return;
    }
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeRegion, activeStyles.join(','), activeSeasons.join(','), isPriceNarrowed, displayedPriceRange.join(','), activeBestFor.join(','), sortBy]);

  // Keeps the address bar (and therefore back/forward + shareable links) in sync with
  // every facet — debounced so the free-text search box doesn't spam history on every
  // keystroke. router.replace (not push) + { scroll: false } so this never adds a
  // history entry per filter click or jumps the viewport.
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set('destination', query.trim());
      if (activeRegion !== 'all') params.set('region', activeRegion);
      if (activeStyles.length) params.set('style', activeStyles.join(','));
      if (activeSeasons.length) params.set('season', activeSeasons.join(','));
      if (isPriceNarrowed) {
        params.set('priceMin', String(displayedPriceRange[0]));
        params.set('priceMax', String(displayedPriceRange[1]));
      }
      if (activeBestFor.length) params.set('bestFor', activeBestFor.join(','));
      if (sortBy !== 'popular') params.set('sort', sortBy);
      if (safePage > 1) params.set('page', String(safePage));
      if (view !== 'cards') params.set('view', view);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeRegion, activeStyles, activeSeasons, isPriceNarrowed, displayedPriceRange.join(','), activeBestFor, sortBy, safePage, view, pathname, router]);

  function clearFilters() {
    setQuery('');
    setActiveRegion('all');
    setActiveStyles([]);
    setActiveSeasons([]);
    setPriceRange(null);
    setActiveBestFor([]);
    setSortBy('popular');
    setFiltersOpen(false);
  }

  const sidebarContent = (
    <>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search destinations…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-sm text-slate-900 outline-none transition-colors duration-300 ease-in-out focus:border-apex-400 focus:bg-white"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="cursor-hover absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 ease-in-out hover:text-slate-900"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Region</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterPill active={activeRegion === 'all'} onClick={() => setActiveRegion('all')}>
            All
          </FilterPill>
          {regions.map((region) => (
            <FilterPill key={region.id} active={activeRegion === region.id} onClick={() => setActiveRegion(region.id)}>
              {region.name}
            </FilterPill>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Price range</p>
        <div className="mt-3">
          <PriceRangeSlider prices={priceBounds?.prices ?? []} value={displayedPriceRange} onChange={setPriceRange} />
        </div>
      </div>

      <div className="mt-5">
        <FilterAccordion title="Travel style" count={activeStyles.length} defaultOpen>
          {travelStyleOptions.map((style) => (
            <FilterCheckbox
              key={style.id}
              checked={activeStyles.includes(style.label)}
              onChange={() => setActiveStyles((current) => toggleValue(current, style.label))}
            >
              {style.label}
            </FilterCheckbox>
          ))}
        </FilterAccordion>

        <FilterAccordion title="Best for" count={activeBestFor.length} defaultOpen={false}>
          {BEST_FOR_OPTIONS.map((option) => (
            <FilterCheckbox key={option} checked={activeBestFor.includes(option)} onChange={() => setActiveBestFor((current) => toggleValue(current, option))}>
              {option}
            </FilterCheckbox>
          ))}
        </FilterAccordion>

        <FilterAccordion title="Season" count={activeSeasons.length} defaultOpen={false}>
          {seasonOptions.map((season) => (
            <FilterCheckbox
              key={season.id}
              checked={activeSeasons.includes(season.label)}
              onChange={() => setActiveSeasons((current) => toggleValue(current, season.label))}
            >
              {season.label}
            </FilterCheckbox>
          ))}
        </FilterAccordion>
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
      {/* Desktop: always-visible, sticky left sidebar */}
      <aside className="hidden w-full shrink-0 xl:block xl:w-80 xl:sticky xl:top-24 xl:bottom-0">
        <div className={cn(FILTER_PANEL_CLASS, 'p-6')}>
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-slate-900">Filter by</p>
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="cursor-hover inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors duration-300 ease-in-out hover:text-slate-900"
              >
                <RotateCcw size={12} />
                Reset all
              </button>
            ) : null}
          </div>
          {sidebarContent}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile filter trigger + view toggle */}
        <div className="flex items-center justify-between gap-2 xl:hidden">
          <div ref={filtersAnchorRef} className="relative">
            <button
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
              aria-haspopup="dialog"
              aria-expanded={filtersOpen}
              className={filterTriggerClass(activeFilterCount > 0)}
            >
              <SlidersHorizontal size={16} />
              Filter by
              {activeFilterCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-apex-600">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            <FieldPopover open={filtersOpen} onClose={() => setFiltersOpen(false)} anchorRef={filtersAnchorRef} width={340} align="left" className="z-50">
              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-bold text-slate-900">Filter by</p>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close filters"
                  className="cursor-hover text-slate-400 transition-colors duration-300 ease-in-out hover:text-slate-900"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="px-1">{sidebarContent}</div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 px-1 pt-4">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="cursor-hover inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors duration-300 ease-in-out hover:text-slate-900"
                >
                  <RotateCcw size={14} />
                  Reset all
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="cursor-hover rounded-xl bg-apex-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-apex-400"
                >
                  Show {sorted.length} results
                </button>
              </div>
            </FieldPopover>
          </div>

          <div className="ml-auto inline-flex items-center rounded-full bg-slate-200">
            {/* Cards Button */} 
            <button
              type="button"
              onClick={() => setView('cards')}
              aria-pressed={view === 'cards'}
              className={cn(
                'cursor-hover inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-300 ease-in-out',
                view === 'cards' ? 'bg-apex-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <LayoutGrid size={14} />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              title="Map view — coming soon"
              className={cn(
                'cursor-hover inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-300 ease-in-out',
                view === 'map' ? 'bg-slate-300 text-slate-700' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <MapIcon size={14} />
              Map
              <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">Soon</span>
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeRegion !== 'all' ? (
              <FilterChip
                label={regions.find((region) => region.id === activeRegion)?.shortName ?? activeRegion}
                onRemove={() => setActiveRegion('all')}
              />
            ) : null}
            {activeStyles.map((style) => (
              <FilterChip key={style} label={style} onRemove={() => setActiveStyles((current) => toggleValue(current, style))} />
            ))}
            {isPriceNarrowed ? (
              <FilterChip
                label={`₹${displayedPriceRange[0].toLocaleString('en-IN')} – ₹${displayedPriceRange[1].toLocaleString('en-IN')}`}
                onRemove={() => setPriceRange(null)}
              />
            ) : null}
            {activeBestFor.map((option) => (
              <FilterChip key={option} label={option} onRemove={() => setActiveBestFor((current) => toggleValue(current, option))} />
            ))}
            {activeSeasons.map((season) => (
              <FilterChip key={season} label={season} onRemove={() => setActiveSeasons((current) => toggleValue(current, season))} />
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-hover text-sm font-semibold text-slate-500 underline-offset-2 transition-colors duration-300 ease-in-out hover:text-apex-600 hover:underline"
            >
              Clear all
            </button>
          </div>
        ) : null}

        <div className="mt-6 lg:mt-0 flex flex-wrap items-center justify-between gap-4">
          <p className="flex flex-1 text-sm text-slate-500">
            {sorted.length} destination{sorted.length === 1 ? '' : 's'} found
          </p>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            Sort by:
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as DestinationSortOption)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition-colors duration-300 ease-in-out focus:border-apex-400"
            >
              {(Object.keys(SORT_LABELS) as DestinationSortOption[]).map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <div className="ml-auto inline-flex items-center rounded-full bg-white shadow-sm shadow-slate-200">
            {/* Cards Button */} 
            <button
              type="button"
              onClick={() => setView('cards')}
              aria-pressed={view === 'cards'}
              className={cn(
                'cursor-hover inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300 ease-in-out',
                view === 'cards' ? 'bg-apex-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <LayoutGrid size={18} />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              title="Map view — coming soon"
              className={cn(
                'cursor-hover inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300 ease-in-out',
                view === 'map' ? 'bg-slate-300 text-slate-700' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <MapIcon size={18} />
              Map
              <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">Soon</span>
            </button>
          </div>
        </div>

        {view === 'map' ? (
          <MapViewPlaceholder destinations={sorted} />
        ) : paginated.length > 0 ? (
          <motion.div layout className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {paginated.map((destination, index) => (
                <motion.div key={destination.slug} layout exit={{ opacity: 0, scale: 0.95 }}>
                  <DestinationCard destination={destination} stats={statsMap.get(destination.slug)} priority={index < 3} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className={cn(FILTER_EMPTY_STATE_CLASS, 'mt-10')}>
            <p className="text-lg font-semibold text-slate-900">No destinations match your search.</p>
            <p className="mt-3">Try a different keyword, or loosen a filter.</p>
          </div>
        )}

        {view === 'cards' ? <Pagination page={safePage} totalPages={totalPages} onChange={setPage} className="mt-10" /> : null}
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={filterPillClass(active)}>
      {children}
    </button>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className={FILTER_CHIP_CLASS}>
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label} filter`} className={FILTER_CHIP_REMOVE_CLASS}>
        <X size={13} />
      </button>
    </span>
  );
}
