'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import ExperienceCard from '@/components/modules/experiences/ExperienceCard';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';
import {
  FILTER_EMPTY_STATE_CLASS,
  FILTER_CHIP_CLASS,
  FILTER_CHIP_REMOVE_CLASS,
  filterPillClass,
  filterTriggerClass
} from '@/components/modules/filters/filterStyles';
import {
  bestForOptions,
  budgetBands,
  difficultyOptions,
  durationBands,
  experienceCategoryIcons,
  experienceRegions,
  seasonOptions
} from '@/config/experiences.config';
import { filterExperiences, sortExperiences, type ExperienceSortOption } from '@/lib/experienceFilters';
import { cn } from '@/lib/utils';
import type {
  Experience,
  ExperienceBestFor,
  ExperienceDifficulty,
  ExperienceDurationBand,
  ExperienceRegion,
  ExperienceSeason,
  ExperienceType
} from '@/types/experience';

export interface ExperiencesListingProps {
  experiences: Experience[];
  initialQuery?: string;
  initialRegion?: string;
  initialCategories?: string;
  initialDurations?: string;
  initialBudgets?: string;
  initialBestFor?: string;
  initialSeasons?: string;
  initialDifficulties?: string;
  initialSort?: string;
}

const SORT_LABELS: Record<ExperienceSortOption, string> = {
  recommended: 'Recommended',
  popular: 'Most Popular',
  rating: 'Highest Rated',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  newest: 'Newest'
};

const INITIAL_BATCH = 9;
const LOAD_MORE_STEP = 6;

function splitParam(value?: string): string[] {
  return value
    ? value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((current) => current !== value) : [...values, value];
}

function isSortOption(value?: string): value is ExperienceSortOption {
  return Boolean(value && value in SORT_LABELS);
}

export default function ExperiencesListing({
  experiences,
  initialQuery = '',
  initialRegion,
  initialCategories,
  initialDurations,
  initialBudgets,
  initialBestFor,
  initialSeasons,
  initialDifficulties,
  initialSort
}: ExperiencesListingProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState(initialQuery);
  const [region, setRegion] = useState(initialRegion ?? '');
  const [categories, setCategories] = useState<ExperienceType[]>(splitParam(initialCategories) as ExperienceType[]);
  const [durations, setDurations] = useState<ExperienceDurationBand[]>(splitParam(initialDurations) as ExperienceDurationBand[]);
  const [budgets, setBudgets] = useState<string[]>(splitParam(initialBudgets));
  const [bestFor, setBestFor] = useState<ExperienceBestFor[]>(splitParam(initialBestFor) as ExperienceBestFor[]);
  const [seasons, setSeasons] = useState<ExperienceSeason[]>(splitParam(initialSeasons) as ExperienceSeason[]);
  const [difficulties, setDifficulties] = useState<ExperienceDifficulty[]>(splitParam(initialDifficulties) as ExperienceDifficulty[]);
  const [sort, setSort] = useState<ExperienceSortOption>(isSortOption(initialSort) ? initialSort : 'recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const didMount = useRef(false);

  const activeFilterCount =
    (region ? 1 : 0) + categories.length + durations.length + budgets.length + bestFor.length + seasons.length + difficulties.length;
  const hasAnyFilter = activeFilterCount > 0 || query.trim().length > 0;

  const filtered = useMemo(
    () =>
      filterExperiences(experiences, {
        query,
        region: (region as ExperienceRegion) || undefined,
        categories,
        durations,
        budgets,
        bestFor,
        seasons,
        difficulties
      }),
    [experiences, query, region, categories, durations, budgets, bestFor, seasons, difficulties]
  );

  const sorted = useMemo(() => sortExperiences(filtered, sort), [filtered, sort]);
  const visible = sorted.slice(0, visibleCount);

  // Any change to what's being shown should land the reader back on the first batch —
  // otherwise a narrower filter can strand "Load More" state that no longer matches.
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [query, region, categories, durations, budgets, bestFor, seasons, difficulties, sort]);

  // Keeps the address bar (and therefore back/forward + shareable links) in sync with
  // every facet — debounced so the free-text search box doesn't spam history on every
  // keystroke. Skips the very first render so mounting with pre-set initial values
  // (from the page's own searchParams) never fires a redundant replace.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (region) params.set('region', region);
      if (categories.length) params.set('category', categories.join(','));
      if (durations.length) params.set('duration', durations.join(','));
      if (budgets.length) params.set('budget', budgets.join(','));
      if (bestFor.length) params.set('bestFor', bestFor.join(','));
      if (seasons.length) params.set('season', seasons.join(','));
      if (difficulties.length) params.set('difficulty', difficulties.join(','));
      if (sort !== 'recommended') params.set('sort', sort);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}#listing` : `${pathname}#listing`, { scroll: false });
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, region, categories, durations, budgets, bestFor, seasons, difficulties, sort, pathname, router]);

  function clearFilters() {
    setQuery('');
    setRegion('');
    setCategories([]);
    setDurations([]);
    setBudgets([]);
    setBestFor([]);
    setSeasons([]);
    setDifficulties([]);
    setSort('recommended');
    setFiltersOpen(false);
  }

  const filtersContent = (
    <div className="space-y-6">
      <FilterGroup title="Region">
        <FilterPill active={!region} onClick={() => setRegion('')}>
          All
        </FilterPill>
        {experienceRegions.map((value) => (
          <FilterPill key={value.id} active={region === value.name} onClick={() => setRegion(region === value.name ? '' : value.name)}>
            {value.name}
          </FilterPill>
        ))}
      </FilterGroup>

      <FilterGroup title="Experience Type">
        {experienceCategoryIcons.map(({ label }) => (
          <FilterPill key={label} active={categories.includes(label)} onClick={() => setCategories((current) => toggleValue(current, label))}>
            {label}
          </FilterPill>
        ))}
      </FilterGroup>

      <FilterGroup title="Duration">
        {durationBands.map((band) => (
          <FilterPill key={band.id} active={durations.includes(band.id)} onClick={() => setDurations((current) => toggleValue(current, band.id))}>
            {band.label}
          </FilterPill>
        ))}
      </FilterGroup>

      <FilterGroup title="Budget">
        {budgetBands.map((band) => (
          <FilterPill key={band.id} active={budgets.includes(band.id)} onClick={() => setBudgets((current) => toggleValue(current, band.id))}>
            {band.label}
          </FilterPill>
        ))}
      </FilterGroup>

      <FilterGroup title="Best For">
        {bestForOptions.map((value) => (
          <FilterPill key={value} active={bestFor.includes(value)} onClick={() => setBestFor((current) => toggleValue(current, value))}>
            {value}
          </FilterPill>
        ))}
      </FilterGroup>

      <FilterGroup title="Season">
        {seasonOptions.map((value) => (
          <FilterPill key={value} active={seasons.includes(value)} onClick={() => setSeasons((current) => toggleValue(current, value))}>
            {value}
          </FilterPill>
        ))}
      </FilterGroup>

      <FilterGroup title="Difficulty">
        {difficultyOptions.map((value) => (
          <FilterPill key={value} active={difficulties.includes(value)} onClick={() => setDifficulties((current) => toggleValue(current, value))}>
            {value}
          </FilterPill>
        ))}   
      </FilterGroup>
    </div>
  );

  return (
    <section id="listing" className="py-12 lg:py-16">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Explore All Experiences</h2>
        </div>  

        {/* Compact toolbar — search, sort and a single "Filters" trigger, not a permanent sidebar. */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search experiences…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 outline-none transition-colors duration-300 ease-in-out focus:border-apex-400"
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

          <div className="flex items-center gap-2 sm:ml-auto">
            <label className="flex items-center gap-2 text-sm text-slate-500">
              <span className="hidden sm:inline">Sort by:</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as ExperienceSortOption)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-colors duration-300 ease-in-out focus:border-apex-400"
              >
                {(Object.keys(SORT_LABELS) as ExperienceSortOption[]).map((option) => (
                  <option key={option} value={option}>
                    {SORT_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className={filterTriggerClass(activeFilterCount > 0)}
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-apex-600">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {hasAnyFilter ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {query.trim() ? <FilterChip label={`"${query.trim()}"`} onRemove={() => setQuery('')} /> : null}
            {region ? <FilterChip label={region} onRemove={() => setRegion('')} /> : null}
            {categories.map((value) => (
              <FilterChip key={value} label={value} onRemove={() => setCategories((current) => toggleValue(current, value))} />
            ))}
            {durations.map((value) => (
              <FilterChip
                key={value}
                label={durationBands.find((band) => band.id === value)?.label ?? value}
                onRemove={() => setDurations((current) => toggleValue(current, value))}
              />
            ))}
            {budgets.map((value) => (
              <FilterChip
                key={value}
                label={budgetBands.find((band) => band.id === value)?.label ?? value}
                onRemove={() => setBudgets((current) => toggleValue(current, value))}
              />
            ))}
            {bestFor.map((value) => (
              <FilterChip key={value} label={value} onRemove={() => setBestFor((current) => toggleValue(current, value))} />
            ))}
            {seasons.map((value) => (
              <FilterChip key={value} label={value} onRemove={() => setSeasons((current) => toggleValue(current, value))} />
            ))}
            {difficulties.map((value) => (
              <FilterChip key={value} label={value} onRemove={() => setDifficulties((current) => toggleValue(current, value))} />
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

        <p className="mt-6 text-sm text-slate-500">
          {sorted.length} experience{sorted.length === 1 ? '' : 's'} found
        </p>

        {sorted.length > 0 ? (
          <>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((experience, index) => (
                <ExperienceCard key={experience.slug} experience={experience} priority={index < 3} />
              ))}
            </div>
            {visibleCount < sorted.length ? (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((current) => current + LOAD_MORE_STEP)}
                  className="cursor-hover flex gap-2 rounded-xl bg-apex-500 px-8 py-4 font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
                >
                  Load More Experiences
                  <ArrowRight size={24} />
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className={cn(FILTER_EMPTY_STATE_CLASS, 'mt-6 p-12')}>
            <p className="text-lg font-semibold text-slate-900">No experiences match your filters.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-hover mt-4 inline-flex items-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-apex-400"
            >
              <RotateCcw size={15} />
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* One filters surface for both breakpoints: a centered "expandable panel" on
          desktop, a full-screen sheet on mobile — never a permanent sidebar. */}
      <FloatingOverlay
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        label="Filter experiences"
        overlayClassName="items-end p-0 sm:items-center sm:p-6"
        panelClassName="my-0 w-full max-w-none rounded-t-[2rem] rounded-b-none bg-white p-6 overflow-y-auto sm:my-auto sm:max-w-xl sm:rounded-[2rem]"
      >
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-slate-900">Filters</p>
          <button
            type="button"
            onClick={() => setFiltersOpen(false)}
            aria-label="Close filters"
            className="cursor-hover rounded-full bg-slate-100 p-2 text-slate-600 transition-colors duration-300 ease-in-out hover:text-slate-900"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-5">{filtersContent}</div>
        <div className="mt-6 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
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
            className="cursor-hover flex-1 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-apex-400"
          >
            Show {sorted.length} results
          </button>
        </div>
      </FloatingOverlay>
    </section>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={filterPillClass(active)}>
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
