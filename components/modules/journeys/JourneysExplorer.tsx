'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpDown, MapPin, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import PackageCard from '@/components/modules/PackageCard';
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
import JourneyCategoryGrid from '@/components/modules/journeys/JourneyCategoryGrid';
import RegionDiscovery from '@/components/modules/journeys/RegionDiscovery';
import SeasonalDiscovery from '@/components/modules/journeys/SeasonalDiscovery';
import CompareTray from '@/components/modules/journeys/CompareTray';
import CompareModal from '@/components/modules/journeys/CompareModal';
import FilterDrawer from '@/components/modules/journeys/FilterDrawer';
import {
  DURATION_BUCKETS,
  filterPackages,
  getAccommodationTiers,
  getPackageCategories,
  getPackageRating,
  getPackageRegionIds,
  sortPackages
} from '@/lib/packageFilters';
import { paginate } from '@/lib/destinationFilters';
import { getAllRegions } from '@/lib/regions';
import { seasons as seasonOptions } from '@/config/seasons.config';
import { cn } from '@/lib/utils';
import type { Destination, PackageSortOption, RegionId, SeasonId, TravelPackage } from '@/types';

export interface JourneysExplorerProps {
  packages: TravelPackage[];
  destinations: Destination[];
  /** Plain object (not a Map) so this can cross the Server→Client Component boundary as a prop. */
  destinationRatings?: Record<string, { rating: number; count: number }>;
  /** All seed values below come straight from the page's `searchParams` — multi-select facets are comma-separated. */
  initialQuery?: string;
  initialCategory?: string;
  initialRegion?: string;
  initialSeasons?: string;
  initialPriceMin?: string;
  initialPriceMax?: string;
  initialDuration?: string;
  initialAccommodation?: string;
  initialSort?: string;
  initialPage?: string;
}

const PAGE_SIZE = 9;
const MAX_COMPARE = 3;

const SORT_LABELS: Record<PackageSortOption, string> = {
  popular: 'Most Popular',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low'
};

function splitParam(value?: string | null): string[] {
  return value
    ? value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
}

function isSortOption(value?: string | null): value is PackageSortOption {
  return value === 'popular' || value === 'price-asc' || value === 'price-desc';
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((current) => current !== value) : [...values, value];
}

export default function JourneysExplorer({
  packages,
  destinations,
  destinationRatings,
  initialQuery = '',
  initialCategory,
  initialRegion,
  initialSeasons,
  initialPriceMin,
  initialPriceMax,
  initialDuration,
  initialAccommodation,
  initialSort,
  initialPage
}: JourneysExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const destinationsBySlug = useMemo(() => new Map(destinations.map((destination) => [destination.slug, destination])), [destinations]);
  const ratingsBySlug = useMemo(() => new Map(Object.entries(destinationRatings ?? {})), [destinationRatings]);
  const regions = getAllRegions();
  // The single "kind of journey" vocabulary, shared by the hero search, the category
  // grid, this toolbar and the drawer — TravelPackage's own `category` field, not a
  // separate style taxonomy (see PackageFilter.category's comment for why the two used
  // to be kept apart, and why that split is exactly the "disconnected filters" problem).
  const categories = useMemo(() => getPackageCategories(packages), [packages]);
  const accommodationTiers = useMemo(() => getAccommodationTiers(packages), [packages]);

  const priceBounds = useMemo(() => {
    if (!packages.length) return null;
    const prices = packages.map((pkg) => pkg.price);
    return { min: Math.min(...prices), max: Math.max(...prices), prices };
  }, [packages]);

  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialCategory ?? 'all');
  const [activeRegion, setActiveRegion] = useState<RegionId | 'all'>((initialRegion as RegionId) || 'all');
  const [activeSeasons, setActiveSeasons] = useState<string[]>(splitParam(initialSeasons));
  const [activeDuration, setActiveDuration] = useState(initialDuration ?? '');
  const [activeAccommodation, setActiveAccommodation] = useState(initialAccommodation ?? '');
  const [sortBy, setSortBy] = useState<PackageSortOption>(isSortOption(initialSort) ? initialSort : 'popular');
  const [page, setPage] = useState(Number(initialPage) > 0 ? Number(initialPage) : 1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const budgetAnchorRef = useRef<HTMLDivElement>(null);
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const [priceRange, setPriceRange] = useState<[number, number] | null>(
    initialPriceMin && initialPriceMax ? [Number(initialPriceMin), Number(initialPriceMax)] : null
  );
  const isPriceNarrowed = priceRange !== null && priceBounds !== null && (priceRange[0] > priceBounds.min || priceRange[1] < priceBounds.max);
  // Memoized so this stays referentially stable across renders when nothing about the
  // price filter actually changed — otherwise (a fresh [min, max] array literal every
  // render whenever priceRange is null) the URL-sync effect below would re-fire (and
  // re-call router.replace) on every unrelated re-render, not just real filter changes.
  const displayedPriceRange: [number, number] = useMemo(
    () => priceRange ?? (priceBounds ? [priceBounds.min, priceBounds.max] : [0, 0]),
    [priceRange, priceBounds]
  );

  // Gated on the caller's raw request (activeSeasons), not on how many of those labels
  // actually resolved to a real season id — an unresolvable/mis-cased label (a stale or
  // hand-edited `?season=` value) must still reach filterPackages as a non-empty request
  // (falling back to the raw label itself, same shape as DestinationsExplorer's identical
  // activeSeasonIds/activeStyleIds), so it narrows results to genuinely zero instead of
  // being silently dropped into an empty array that filterPackages treats as "no filter".
  const activeSeasonIds = useMemo(
    () => activeSeasons.map((label) => seasonOptions.find((season) => season.label === label)?.id ?? (label as SeasonId)),
    [activeSeasons]
  );

  const filtered = useMemo(
    () =>
      filterPackages(
        packages,
        {
          query,
          category: activeCategory === 'all' ? undefined : activeCategory,
          region: activeRegion === 'all' ? undefined : activeRegion,
          seasons: activeSeasonIds,
          priceMin: isPriceNarrowed ? displayedPriceRange[0] : undefined,
          priceMax: isPriceNarrowed ? displayedPriceRange[1] : undefined,
          duration: activeDuration || undefined,
          accommodation: activeAccommodation || undefined
        },
        destinationsBySlug
      ),
    [
      packages,
      query,
      activeCategory,
      activeRegion,
      activeSeasonIds,
      isPriceNarrowed,
      displayedPriceRange,
      activeDuration,
      activeAccommodation,
      destinationsBySlug
    ]
  );

  const sorted = useMemo(() => sortPackages(filtered, sortBy), [filtered, sortBy]);
  const { items: paginated, totalPages, page: safePage } = useMemo(() => paginate(sorted, page, PAGE_SIZE), [sorted, page]);

  const activeFilterCount =
    (activeCategory !== 'all' ? 1 : 0) +
    (activeRegion !== 'all' ? 1 : 0) +
    activeSeasons.length +
    (isPriceNarrowed ? 1 : 0) +
    (activeDuration ? 1 : 0) +
    (activeAccommodation ? 1 : 0);

  // Any change to what's being shown should land the reader back on page 1 —
  // otherwise a narrower filter can strand them on a now-nonexistent page.
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query,
    activeCategory,
    activeRegion,
    activeSeasons.join(','),
    isPriceNarrowed,
    displayedPriceRange.join(','),
    activeDuration,
    activeAccommodation,
    sortBy
  ]);

  // Tracks the exact query string this component last wrote out itself, so the
  // reconciliation effect below can ignore the round-trip it causes and only react
  // to navigations that actually originated elsewhere (hero search, category tiles,
  // region/season discovery, browser Back/Forward, or any external link into /journeys).
  const lastPushedParamsRef = useRef<string | null>(null);

  // Keeps the address bar (and therefore back/forward + shareable links) in sync with
  // every facet — debounced so the free-text search box doesn't spam history on every
  // keystroke. router.replace (not push) + { scroll: false } so this never adds a
  // history entry per filter click or jumps the viewport.
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set('destination', query.trim());
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (activeRegion !== 'all') params.set('region', activeRegion);
      if (activeSeasons.length) params.set('season', activeSeasons.join(','));
      if (isPriceNarrowed) {
        params.set('priceMin', String(displayedPriceRange[0]));
        params.set('priceMax', String(displayedPriceRange[1]));
      }
      if (activeDuration) params.set('duration', activeDuration);
      if (activeAccommodation) params.set('accommodation', activeAccommodation);
      if (sortBy !== 'popular') params.set('sort', sortBy);
      if (safePage > 1) params.set('page', String(safePage));
      const qs = params.toString();
      lastPushedParamsRef.current = qs;
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(timeout);
    // displayedPriceRange is joined to a primitive on purpose — see the page-reset effect
    // above; `packages` is a fresh array from the server on every navigation (even when
    // the data is identical), so a raw-array dependency here would re-fire this effect
    // (and re-call router.replace) on every navigation it itself just caused.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query,
    activeCategory,
    activeRegion,
    activeSeasons,
    isPriceNarrowed,
    displayedPriceRange.join(','),
    activeDuration,
    activeAccommodation,
    sortBy,
    safePage,
    pathname,
    router
  ]);

  // Reconciles filter state from the URL whenever it changes from *outside* this
  // component's own debounced write above — e.g. the hero search bar, a quick
  // category tile, a region/season discovery panel, or the browser's Back/Forward
  // buttons. Without this, JourneysExplorer's useState only ever reads its initial*
  // props once on mount and silently ignores every later navigation that doesn't
  // remount it.
  const searchParamsString = searchParams.toString();
  useEffect(() => {
    if (lastPushedParamsRef.current === searchParamsString) return;
    const params = new URLSearchParams(searchParamsString);
    setQuery(params.get('destination') ?? '');
    setActiveCategory(params.get('category') ?? 'all');
    setActiveRegion(((params.get('region') as RegionId) || 'all') as RegionId | 'all');
    setActiveSeasons(splitParam(params.get('season')));
    const priceMinParam = params.get('priceMin');
    const priceMaxParam = params.get('priceMax');
    setPriceRange(priceMinParam && priceMaxParam ? [Number(priceMinParam), Number(priceMaxParam)] : null);
    setActiveDuration(params.get('duration') ?? '');
    setActiveAccommodation(params.get('accommodation') ?? '');
    setSortBy(isSortOption(params.get('sort')) ? (params.get('sort') as PackageSortOption) : 'popular');
    const pageParam = params.get('page');
    setPage(Number(pageParam) > 0 ? Number(pageParam) : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsString]);

  function clearFilters() {
    setQuery('');
    setActiveCategory('all');
    setActiveRegion('all');
    setActiveSeasons([]);
    setPriceRange(null);
    setActiveDuration('');
    setActiveAccommodation('');
    setSortBy('popular');
    setDrawerOpen(false);
  }

  // RegionDiscovery/SeasonalDiscovery sit below the results grid, so selecting from
  // them would otherwise silently change results the user can no longer see.
  function scrollToResults() {
    document.getElementById('journeys-listing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function toggleCompare(slug: string) {
    setCompareSlugs((current) => {
      if (current.includes(slug)) return current.filter((entry) => entry !== slug);
      if (current.length >= MAX_COMPARE) return current;
      return [...current, slug];
    });
  }

  const comparePackages = compareSlugs.map((slug) => packages.find((pkg) => pkg.slug === slug)).filter((pkg): pkg is TravelPackage => Boolean(pkg));

  const clearAllButton = activeFilterCount > 0 ? (
    <button
      type="button"
      onClick={clearFilters}
      className="cursor-hover inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors duration-300 ease-in-out hover:border-red-200 hover:bg-red-50 hover:text-red-600"
    >
      <RotateCcw size={12} />
      Clear All Filters
    </button>
  ) : null;

  const advancedFilters = (
    <div className="space-y-1">
      <FilterAccordion title="Destination" defaultOpen>
        <label className="col-span-2 flex items-center gap-2 text-sm text-slate-600">
          <MapPin size={15} className="text-apex-600" />
          <select
            value={activeRegion}
            onChange={(event) => setActiveRegion(event.target.value as RegionId | 'all')}
            className="cursor-hover w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none"
          >
            <option value="all">All Destinations</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </label>
      </FilterAccordion>

      <FilterAccordion title="Travel style" count={activeCategory !== 'all' ? 1 : 0} defaultOpen>
        <div className="col-span-2 flex flex-wrap gap-2">
          <FilterPill active={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>
            Any
          </FilterPill>
          {categories.map((category) => (
            <FilterPill key={category} active={activeCategory === category} onClick={() => setActiveCategory(category)}>
              {category}
            </FilterPill>
          ))}
        </div>
      </FilterAccordion>

      <FilterAccordion title="Duration" count={activeDuration ? 1 : 0} defaultOpen>
        <div className="col-span-2 flex flex-wrap gap-2">
          <FilterPill active={activeDuration === ''} onClick={() => setActiveDuration('')}>
            Any
          </FilterPill>
          {DURATION_BUCKETS.map((bucket) => (
            <FilterPill key={bucket.id} active={activeDuration === bucket.id} onClick={() => setActiveDuration(bucket.id)}>
              {bucket.label}
            </FilterPill>
          ))}
        </div>
      </FilterAccordion>

      <FilterAccordion title="Budget" defaultOpen>
        <div className="col-span-2">
          <PriceRangeSlider prices={priceBounds?.prices ?? []} value={displayedPriceRange} onChange={setPriceRange} />
        </div>
      </FilterAccordion>

      {accommodationTiers.length > 0 ? (
        <FilterAccordion title="Accommodation" count={activeAccommodation ? 1 : 0} defaultOpen>
          <div className="col-span-2 flex flex-wrap gap-2">
            <FilterPill active={activeAccommodation === ''} onClick={() => setActiveAccommodation('')}>
              Any
            </FilterPill>
            {accommodationTiers.map((tier) => (
              <FilterPill key={tier.id} active={activeAccommodation === tier.id} onClick={() => setActiveAccommodation(tier.id)}>
                {tier.label}
              </FilterPill>
            ))}
          </div>
        </FilterAccordion>
      ) : null}

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
  );

  return (
    <div className="mx-auto max-w-[1440px] px-6 space-y-10">
      <JourneyCategoryGrid packages={packages} activeCategory={activeCategory} onSelect={setActiveCategory} />

      <div id="journeys-listing" className="scroll-mt-24">
        {/* Compact filter toolbar — quick access to the most-used facets; everything
            (including these same facets) is also reachable from the "+ More Filters" drawer. */}
        <div className={cn(FILTER_PANEL_CLASS, 'flex flex-wrap items-center gap-3 px-4 py-3.5 sm:gap-4')}>
          <div className="relative min-w-[180px] flex-1 sm:flex-none sm:basis-56">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search journeys or places…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-8 text-sm text-slate-900 outline-none transition-colors duration-300 ease-in-out focus:border-apex-400 focus:bg-white"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="cursor-hover absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 ease-in-out hover:text-slate-900"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>

          {/* Region/Travel Style/Duration/Budget are quick-access duplicates of facets already
              inside "More Filters" — on mobile that's too many inline controls at once ("a wall
              of filters"), so they're hidden there and reachable through the drawer instead;
              `sm:contents` un-wraps this group at sm+ so it lays out exactly as before. */}
          <div className="hidden sm:contents">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin size={15} className="text-apex-600" />
              <select
                value={activeRegion}
                onChange={(event) => setActiveRegion(event.target.value as RegionId | 'all')}
                className="cursor-hover rounded-lg border-none bg-transparent py-1 text-sm font-medium text-slate-700 outline-none"
              >
                <option value="all">All Destinations</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </label>

            <select
              value={activeCategory === 'all' ? '' : activeCategory}
              onChange={(event) => setActiveCategory(event.target.value || 'all')}
              className="cursor-hover rounded-lg border-none bg-transparent py-1 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="">Travel Style</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={activeDuration}
              onChange={(event) => setActiveDuration(event.target.value)}
              className="cursor-hover rounded-lg border-none bg-transparent py-1 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="">Duration</option>
              {DURATION_BUCKETS.map((bucket) => (
                <option key={bucket.id} value={bucket.id}>
                  {bucket.label}
                </option>
              ))}
            </select>

            <div ref={budgetAnchorRef} className="relative">
              <button
                type="button"
                onClick={() => setBudgetOpen((current) => !current)}
                aria-haspopup="dialog"
                aria-expanded={budgetOpen}
                className={cn(
                  'cursor-hover rounded-lg px-2 py-1 text-sm font-medium transition-colors duration-300 ease-in-out',
                  isPriceNarrowed ? 'text-apex-600' : 'text-slate-700 hover:text-slate-900'
                )}
              >
                Budget
              </button>
              <FieldPopover open={budgetOpen} onClose={() => setBudgetOpen(false)} anchorRef={budgetAnchorRef} width={320} align="left">
                <p className="px-1 text-sm font-bold text-slate-900">Budget</p>
                <div className="mt-3 px-1">
                  <PriceRangeSlider prices={priceBounds?.prices ?? []} value={displayedPriceRange} onChange={setPriceRange} />
                </div>
              </FieldPopover>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            className={filterTriggerClass(activeFilterCount > 0)}
          >
            <SlidersHorizontal size={15} />
            More Filters
            {activeFilterCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-apex-600">
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
            <ArrowUpDown size={15} className="text-apex-600" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as PackageSortOption)}
              className="cursor-hover rounded-lg border-none bg-transparent py-1 text-sm font-medium text-slate-700 outline-none"
            >
              {(Object.keys(SORT_LABELS) as PackageSortOption[]).map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          {sorted.length} journey{sorted.length === 1 ? '' : 's'} found
        </p>

        {/* Active filter chips */}
        {activeFilterCount > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeCategory !== 'all' ? <FilterChip label={activeCategory} onRemove={() => setActiveCategory('all')} /> : null}
            {activeRegion !== 'all' ? (
              <FilterChip label={regions.find((region) => region.id === activeRegion)?.name ?? activeRegion} onRemove={() => setActiveRegion('all')} />
            ) : null}
            {isPriceNarrowed ? (
              <FilterChip
                label={`₹${displayedPriceRange[0].toLocaleString('en-IN')} – ₹${displayedPriceRange[1].toLocaleString('en-IN')}`}
                onRemove={() => setPriceRange(null)}
              />
            ) : null}
            {activeDuration ? (
              <FilterChip
                label={DURATION_BUCKETS.find((bucket) => bucket.id === activeDuration)?.label ?? activeDuration}
                onRemove={() => setActiveDuration('')}
              />
            ) : null}
            {activeAccommodation ? (
              <FilterChip
                label={accommodationTiers.find((tier) => tier.id === activeAccommodation)?.label ?? activeAccommodation}
                onRemove={() => setActiveAccommodation('')}
              />
            ) : null}
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

        {paginated.length > 0 ? (
          <motion.div layout className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {paginated.map((pkg) => {
                const regionId = getPackageRegionIds(pkg, destinationsBySlug)[0];
                const regionLabel = regionId ? regions.find((region) => region.id === regionId)?.shortName : undefined;
                return (
                  <motion.div key={pkg.slug} layout exit={{ opacity: 0, scale: 0.95 }}>
                    <PackageCard
                      pkg={pkg}
                      rating={getPackageRating(pkg, destinationsBySlug, ratingsBySlug)}
                      regionLabel={regionLabel}
                      isComparing={compareSlugs.includes(pkg.slug)}
                      compareDisabled={compareSlugs.length >= MAX_COMPARE && !compareSlugs.includes(pkg.slug)}
                      onToggleCompare={toggleCompare}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : packages.length === 0 ? (
          // Genuinely nothing in the catalog (vs. a filter narrowing it to zero, below) —
          // "match your filters" / "Clear All Filters" is nonsensical here since there are
          // no filters to clear and clearing them wouldn't produce any results either.
          <div className={cn(FILTER_EMPTY_STATE_CLASS, 'mt-10')}>
            <p className="text-lg font-semibold text-slate-900">Journeys aren&apos;t available right now.</p>
            <p className="mt-3">Please check back soon, or explore our destinations in the meantime.</p>
            <Link
              href="/destinations"
              className="cursor-hover mt-5 inline-flex items-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
            >
              Explore Destinations
            </Link>
          </div>
        ) : (
          <div className={cn(FILTER_EMPTY_STATE_CLASS, 'mt-10')}>
            <p className="text-lg font-semibold text-slate-900">No journeys match your filters.</p>
            <p className="mt-3">Try changing your destination, budget or travel style.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-hover mt-5 inline-flex items-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
            >
              <RotateCcw size={14} />
              Clear All Filters
            </button>
          </div>
        )}

        <Pagination page={safePage} totalPages={totalPages} onChange={setPage} className="mt-10" />
      </div>

      <RegionDiscovery
        packages={packages}
        regions={regions}
        destinationsBySlug={destinationsBySlug}
        onSelect={(regionId) => {
          setActiveRegion(regionId);
          scrollToResults();
        }}
      />

      <SeasonalDiscovery
        packages={packages}
        seasons={seasonOptions}
        destinationsBySlug={destinationsBySlug}
        activeSeasons={activeSeasons}
        onSelect={(seasonLabel) => {
          setActiveSeasons((current) => toggleValue(current, seasonLabel));
          scrollToResults();
        }}
      />

      <FilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} resultCount={sorted.length} onClear={clearFilters}>
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-500">Refine every filter in one place.</p>
          {clearAllButton}
        </div>
        <div className="mt-2">{advancedFilters}</div>
      </FilterDrawer>

      <CompareTray
        packages={comparePackages}
        onRemove={(slug) => setCompareSlugs((current) => current.filter((entry) => entry !== slug))}
        onClear={() => setCompareSlugs([])}
        onCompare={() => setCompareOpen(true)}
      />
      <CompareModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        packages={comparePackages}
        destinationsBySlug={destinationsBySlug}
        destinationRatings={ratingsBySlug}
      />
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={filterPillClass(active, 'inline-flex items-center gap-1.5 whitespace-nowrap')}
    >
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
