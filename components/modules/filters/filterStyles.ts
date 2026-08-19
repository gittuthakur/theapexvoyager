import { cn } from '@/lib/utils';

/**
 * Shared visual tokens for every sidebar/toolbar filter panel across the portal
 * (Destinations, Journeys, Experiences listings; Stays, Hotels, Experts filter
 * panels) — one place to change the shared look (radius, shadow, pill/chip/trigger
 * styling, transitions) for all of them at once. Each filter component keeps its
 * own independent state, handlers and query-param logic — only classNames move here.
 */

/** Outer card chrome for a filter sidebar/toolbar/panel. */
export const FILTER_PANEL_CLASS = 'rounded-[2rem] border border-slate-200 bg-white shadow-glow';

/** Uppercase section/group label above a filter's options. */
export const FILTER_LABEL_CLASS = 'text-xs font-semibold uppercase tracking-[0.2em] text-slate-500';

export const FILTER_PILL_BASE_CLASS = 'cursor-hover rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-300 ease-in-out';
export const FILTER_PILL_ACTIVE_CLASS = 'bg-apex-500 text-white shadow-lg shadow-apex-500/30';
export const FILTER_PILL_INACTIVE_CLASS = 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900';

/** The single toggle-pill className used for every filter option/chip-style radio button across the portal. */
export function filterPillClass(active: boolean, className?: string) {
  return cn(FILTER_PILL_BASE_CLASS, active ? FILTER_PILL_ACTIVE_CLASS : FILTER_PILL_INACTIVE_CLASS, className);
}

export const FILTER_TRIGGER_BASE_CLASS =
  'cursor-hover inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-300 ease-in-out';
export const FILTER_TRIGGER_ACTIVE_CLASS = 'border-apex-500 bg-apex-500 text-white shadow-lg shadow-apex-500/30';
export const FILTER_TRIGGER_INACTIVE_CLASS = 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900';

/** The "Filters" / "More Filters" / mobile-filter-drawer trigger button used across the explorers/listings. */
export function filterTriggerClass(active: boolean, className?: string) {
  return cn(FILTER_TRIGGER_BASE_CLASS, active ? FILTER_TRIGGER_ACTIVE_CLASS : FILTER_TRIGGER_INACTIVE_CLASS, className);
}

/** Removable "active filter" tag/chip. */
export const FILTER_CHIP_CLASS =
  'inline-flex items-center gap-1.5 rounded-full border border-apex-200 bg-apex-50 px-3.5 py-1.5 text-sm font-medium text-apex-700';
export const FILTER_CHIP_REMOVE_CLASS = 'cursor-hover text-apex-500 transition-colors duration-300 ease-in-out hover:text-apex-800';

/** "No results" card shown when a filter combination matches nothing. */
export const FILTER_EMPTY_STATE_CLASS = 'rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-glow';
