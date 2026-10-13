import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SafeImage } from '@/components/ui/SafeImage';
import {
  GLOBAL_SEARCH_SECTIONS,
  POPULAR_SEARCHES,
  failedSections,
  seeAllHref,
  type GlobalSearchView,
  type SearchErrorKind
} from '@/lib/globalSearchClient';
import { GLOBAL_SEARCH_LIMITS, type GlobalSearchItem, type GlobalSearchSectionKey } from '@/lib/search/globalSearch';

/** One keyboard/pointer target in display order: a result, or a "See all" link after a capped section. */
export interface NavItem {
  key: string;
  href: string;
  kind: 'result' | 'see-all';
}

/** The ordered list keyboard navigation walks (results of each section, then its "See all" link when it has one). */
export function buildNavItems(view: GlobalSearchView): NavItem[] {
  if (view.phase !== 'results') return [];
  const items: NavItem[] = [];
  for (const { key } of GLOBAL_SEARCH_SECTIONS) {
    const section = view.response.sections[key];
    if (!section || section.items.length === 0) continue;
    for (const item of section.items) items.push({ key: item.id, href: item.href, kind: 'result' });
    const all = seeAllHref(key, view.query, section.items.length, GLOBAL_SEARCH_LIMITS.perSection);
    if (all) items.push({ key: `see-all:${key}`, href: all, kind: 'see-all' });
  }
  return items;
}

export const optionId = (listboxId: string, key: string) => `${listboxId}-opt-${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

const TYPE_ICON: Record<GlobalSearchItem['type'], string> = { destination: '📍', region: '🗺️', journey: '🏔️', experience: '✨', expert: '🧭' };
const TYPE_BADGE: Record<GlobalSearchItem['type'], string> = {
  destination: 'bg-blue-50 text-blue-600',
  region: 'bg-emerald-50 text-emerald-600',
  journey: 'bg-purple-50 text-purple-600',
  experience: 'bg-amber-50 text-amber-600',
  expert: 'bg-indigo-50 text-indigo-600'
};

/** What a screen reader hears when the state changes (rendered in an aria-live region). */
export function describeView(view: GlobalSearchView): string {
  switch (view.phase) {
    case 'idle':
      return '';
    case 'loading':
      return 'Searching';
    case 'empty':
      return `No results for ${view.query}`;
    case 'error':
      return errorCopy(view.kind, view.retryAfterSeconds).title;
    case 'results': {
      const count = Object.values(view.response.sections).reduce((n, s) => n + s.items.length, 0);
      return `${count} ${count === 1 ? 'result' : 'results'}${view.response.partial ? ', some results could not be loaded' : ''}`;
    }
  }
}

function errorCopy(kind: SearchErrorKind, retryAfterSeconds?: number): { title: string; detail: string; retry: boolean } {
  switch (kind) {
    case 'network':
      return { title: 'Search could not connect', detail: 'Check your connection and try again.', retry: true };
    case 'timeout':
      return { title: 'Search is taking too long', detail: 'The server did not answer in time. Try again in a moment.', retry: true };
    case 'rate-limited':
      return { title: 'Too many searches', detail: `Please wait ${retryAfterSeconds ?? 30} seconds before searching again.`, retry: true };
    case 'invalid':
      return { title: 'That search can’t be processed', detail: 'Try different words.', retry: false };
    default:
      return { title: 'Search is temporarily unavailable', detail: 'Please try again in a moment.', retry: true };
  }
}

export interface GlobalSearchResultsProps {
  view: GlobalSearchView;
  listboxId: string;
  /** Key of the highlighted NavItem, if any. */
  activeKey?: string;
  onHover(key: string): void;
  onNavigate(): void;
  onRetry(): void;
  onPopular(text: string): void;
}

function PopularChips({ onPopular }: { onPopular(text: string): void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {POPULAR_SEARCHES.map((text) => (
        <button
          key={text}
          type="button"
          onClick={() => onPopular(text)}
          className="cursor-hover rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-all duration-300 ease-in-out hover:border-apex-400/50 hover:bg-apex-50 hover:text-apex-700"
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/**
 * The results area of the Header search (presentation only: no state, no fetching). Every message here is driven by the
 * controller's view, so "no results" can only appear after the API answered completely and found nothing.
 */
export function GlobalSearchResults({ view, listboxId, activeKey, onHover, onNavigate, onRetry, onPopular }: GlobalSearchResultsProps) {
  if (view.phase === 'idle') {
    return (
      <div className="space-y-6 px-6 py-8">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Popular Searches</p>
          <PopularChips onPopular={onPopular} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Tip:</span> Type at least 2 letters to search destinations, regions, journeys, experiences and travel experts.
          </p>
        </div>
      </div>
    );
  }

  if (view.phase === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-12 text-center" aria-hidden="true">
        <Loader2 className="animate-spin text-apex-500" size={24} />
        <p className="text-sm font-medium text-slate-700">Searching…</p>
        {view.slow ? <p className="max-w-xs text-xs text-slate-500">Still searching — the first search can take a few seconds.</p> : null}
      </div>
    );
  }

  if (view.phase === 'empty') {
    return (
      <div className="space-y-6 px-6 py-12 text-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">No results found</h3>
          <p className="mt-2 text-sm text-slate-500">
            We couldn&apos;t find anything matching &quot;<span className="font-medium">{view.query}</span>&quot;. Try another destination, journey or experience.
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Popular Searches</p>
          <div className="flex justify-center">
            <PopularChips onPopular={onPopular} />
          </div>
        </div>
      </div>
    );
  }

  if (view.phase === 'error') {
    const copy = errorCopy(view.kind, view.retryAfterSeconds);
    return (
      <div className="space-y-3 px-6 py-10 text-center" role="alert">
        <h3 className="text-lg font-semibold text-slate-900">{copy.title}</h3>
        <p className="text-sm text-slate-500">{copy.detail}</p>
        {copy.retry ? (
          <button
            type="button"
            onClick={onRetry}
            className="cursor-hover mt-2 rounded-full bg-apex-500 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  const failed = failedSections(view.response);
  const total = GLOBAL_SEARCH_SECTIONS.reduce((n, { key }) => n + (view.response.sections[key]?.items.length ?? 0), 0);
  return (
    <div className="space-y-6 px-6 py-6">
      {view.response.partial ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span>
            {total === 0
              ? 'We couldn’t finish searching, so this is not a complete answer.'
              : `Some results couldn’t be loaded (${failed.map((key) => GLOBAL_SEARCH_SECTIONS.find((s) => s.key === key)?.label ?? key).join(', ')}), so this list may be incomplete.`}
          </span>
          <button type="button" onClick={onRetry} className="cursor-hover font-semibold underline underline-offset-2 hover:text-amber-950">
            Try again
          </button>
        </div>
      ) : null}
      <div id={listboxId} role="listbox" aria-label="Search results" className="space-y-6">
        {GLOBAL_SEARCH_SECTIONS.map(({ key, label }) => {
          const section = view.response.sections[key];
          if (!section || section.items.length === 0) return null;
          const all = seeAllHref(key as GlobalSearchSectionKey, view.query, section.items.length, GLOBAL_SEARCH_LIMITS.perSection);
          const headingId = `${listboxId}-h-${key}`;
          return (
            <div key={key} role="group" aria-labelledby={headingId}>
              <p id={headingId} className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {label}
              </p>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <ResultRow key={item.id} item={item} id={optionId(listboxId, item.id)} active={activeKey === item.id} onHover={() => onHover(item.id)} onNavigate={onNavigate} />
                ))}
                {all ? (
                  <Link
                    href={all}
                    id={optionId(listboxId, `see-all:${key}`)}
                    role="option"
                    aria-selected={activeKey === `see-all:${key}`}
                    onClick={onNavigate}
                    onMouseEnter={() => onHover(`see-all:${key}`)}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-lg border border-dashed px-4 py-2 text-sm font-medium transition',
                      activeKey === `see-all:${key}` ? 'border-apex-400/50 bg-apex-50 text-apex-700' : 'border-slate-300 text-slate-600 hover:border-apex-400/50 hover:bg-apex-50 hover:text-apex-700'
                    )}
                  >
                    <span>See all {label.toLowerCase()} for “{view.query}”</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultRow({ item, id, active, onHover, onNavigate }: { item: GlobalSearchItem; id: string; active: boolean; onHover(): void; onNavigate(): void }) {
  return (
    <Link
      href={item.href}
      id={id}
      role="option"
      aria-selected={active}
      onClick={onNavigate}
      onMouseEnter={onHover}
      className={cn('group flex items-start gap-4 rounded-lg border px-4 py-3 transition', active ? 'border-apex-400/50 bg-apex-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50')}
    >
      <div className="mt-0.5 shrink-0" aria-hidden="true">
        {item.image ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-slate-100">
            <SafeImage src={item.image} alt="" fill sizes="40px" className="object-cover" />
          </div>
        ) : (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold', TYPE_BADGE[item.type])}>{TYPE_ICON[item.type]}</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="block font-semibold text-slate-900">{item.title}</span>
            {item.subtitle ? <span className="mt-1 line-clamp-1 block text-sm text-slate-500">{item.subtitle}</span> : null}
          </div>
          <div className="mt-1 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-slate-900" aria-hidden="true">
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </Link>
  );
}
