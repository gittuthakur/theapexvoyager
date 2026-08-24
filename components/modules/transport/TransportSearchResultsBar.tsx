import Link from 'next/link';

export interface TransportSearchResultsBarProps {
  serviceLabel: string;
  /** e.g. "Manali → Chandigarh · 12 Oct – 16 Oct" — only the parts actually searched. */
  summary?: string;
  travellers?: string;
  vehicle?: string;
  resultsCount: number;
}

/**
 * Shown only in Search Results Mode (a real Hero search submission — see
 * `?searched=1` in app/transport/page.tsx), right below the Hero. Gives the customer
 * an immediate "here's what you searched" summary plus a way back out — "Modify
 * Search" scrolls to the still-mounted Hero form (`#transport-hero-search`, same
 * anchor NoInventoryActions already uses), "Clear Search" drops every search param
 * and returns to the full Discovery Mode landing page.
 */
export default function TransportSearchResultsBar({ serviceLabel, summary, travellers, vehicle, resultsCount }: TransportSearchResultsBarProps) {
  const travellerCount = travellers ? Number(travellers) : undefined;

  return (
    <section className="mx-auto max-w-[1440px] px-6">
      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-apex-200 bg-apex-50/60 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-apex-600">Your search</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">{serviceLabel}</h2>
          {summary || vehicle || travellerCount ? (
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600">
              {summary ? <span>{summary}</span> : null}
              {vehicle ? <span>{vehicle}</span> : null}
              {travellerCount ? <span>{travellerCount} traveller{travellerCount === 1 ? '' : 's'}</span> : null}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-slate-500">
            {resultsCount} matching option{resultsCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="#transport-hero-search"
            className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
          >
            Modify Search
          </a>
          <Link
            href="/transport"
            className="cursor-hover inline-flex items-center justify-center px-4 py-3 text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-700"
          >
            Clear Search
          </Link>
        </div>
      </div>
    </section>
  );
}
