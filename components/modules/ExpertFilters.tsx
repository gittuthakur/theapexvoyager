import Link from 'next/link';
import { getCuratedDestinationBySlug } from '@/lib/destinations';
import { FILTER_PANEL_CLASS, FILTER_LABEL_CLASS, filterPillClass } from '@/components/modules/filters/filterStyles';
import { cn } from '@/lib/utils';
import type { ExpertFacets } from '@/types/expert';

export interface ExpertFiltersProps {
  facets: ExpertFacets;
  destination?: string;
  travelStyle?: string;
  expertise?: string;
  q?: string;
}

function buildHref(current: { destination?: string; travelStyle?: string; expertise?: string; q?: string }, overrides: Record<string, string | undefined>) {
  const next = { ...current, ...overrides };
  const params = new URLSearchParams();
  if (next.q) params.set('q', next.q);
  if (next.destination) params.set('destination', next.destination);
  if (next.travelStyle) params.set('travelStyle', next.travelStyle);
  if (next.expertise) params.set('expertise', next.expertise);
  const query = params.toString();
  return query ? `/experts?${query}` : '/experts';
}

function FilterGroup({
  label,
  options,
  activeValue,
  filterKey,
  current
}: {
  label: string;
  options: Array<{ value: string; display: string }>;
  activeValue?: string;
  filterKey: 'destination' | 'travelStyle' | 'expertise';
  current: { destination?: string; travelStyle?: string; expertise?: string; q?: string };
}) {
  if (options.length === 0) return null;

  return (
    <div>
      <p className={FILTER_LABEL_CLASS}>{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={buildHref(current, { [filterKey]: undefined })} className={filterPillClass(!activeValue)}>
          All
        </Link>
        {options.map(({ value, display }) => (
          <Link
            key={value}
            href={buildHref(current, { [filterKey]: activeValue === value ? undefined : value })}
            className={filterPillClass(activeValue === value)}
          >
            {display}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Server-rendered filter chips — real destinations/travel styles/expertise pulled
// from the active experts catalog (see lib/experts.ts's getExpertFacets), not a
// hardcoded list, so a filter option only ever appears if an expert actually covers
// it (spec §6). Plain <Link>s keep this working with JS disabled, same as the
// original prototype's needTabs pattern.
export default async function ExpertFilters({ facets, destination, travelStyle, expertise, q }: ExpertFiltersProps) {
  const current = { destination, travelStyle, expertise, q };

  const destinationOptions = (
    await Promise.all(
      facets.destinations.map(async (slug) => ({ value: slug, display: (await getCuratedDestinationBySlug(slug))?.title ?? slug }))
    )
  ).filter((option) => option.display);

  const travelStyleOptions = facets.travelStyles.map((style) => ({ value: style, display: style }));
  const expertiseOptions = facets.expertise.map((item) => ({ value: item, display: item }));

  return (
    <div className={cn(FILTER_PANEL_CLASS, 'p-10')}>
      <p className="text-sm uppercase tracking-[0.32em] text-apex-600">Find your specialist</p>
      <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Filter by Destination, Style & Expertise</h2>

      <form action="/experts" method="get" className="mt-6 flex flex-wrap gap-3">
        {destination ? <input type="hidden" name="destination" value={destination} /> : null}
        {travelStyle ? <input type="hidden" name="travelStyle" value={travelStyle} /> : null}
        {expertise ? <input type="hidden" name="expertise" value={expertise} /> : null}
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name or specialty — e.g. Spiti, honeymoon, road trips…"
          className="min-w-[240px] flex-1 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm text-slate-900 outline-none transition-colors duration-300 ease-in-out focus:border-apex-400"
        />
        <button
          type="submit"
          className="cursor-hover rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
        >
          Search
        </button>
      </form>

      <div className="mt-8 space-y-6">
        <FilterGroup label="Destination" options={destinationOptions} activeValue={destination} filterKey="destination" current={current} />
        <FilterGroup label="Travel Style" options={travelStyleOptions} activeValue={travelStyle} filterKey="travelStyle" current={current} />
        <FilterGroup label="Expertise" options={expertiseOptions} activeValue={expertise} filterKey="expertise" current={current} />
      </div>
    </div>
  );
}
