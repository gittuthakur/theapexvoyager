/**
 * The canonical "search card" chrome shared by every search/filter panel across the
 * portal (Home, Apex Stays, Our Journeys, Destinations, Experiences, Transport) — one
 * place to change the shared container look (radius, border, background, shadow) for
 * all of them at once, while each panel keeps its own independent fields, layout and
 * submit logic.
 */
export const SEARCH_PANEL_CLASS =
  'rounded-3xl border border-slate-100 bg-white/95 p-2 shadow-xl shadow-slate-900/15 backdrop-blur-sm sm:p-3';

/**
 * The canonical trigger/input row chrome shared by every field inside a search panel
 * (DestinationField, DateRangeField, OccupancyField, TravelStyleField, CounterField,
 * and GlobalSearchFilter's own InlineDateTimeField) — one place to change the shared
 * field look (radius, background, hover/focus states) for all of them at once.
 */
export const SEARCH_FIELD_CLASS =
  'relative z-0 flex items-center gap-3 rounded-2xl border border-transparent bg-slate-200 px-4 py-3 transition-all duration-300 ease-out hover:bg-slate-100 focus-within:z-10 focus-within:scale-[1.02] focus-within:border-white focus-within:bg-white focus-within:shadow-lg';

/** The canonical chrome for every floating dropdown/popover anchored to a search field (see FieldPopover). */
export const SEARCH_OVERLAY_CLASS = 'rounded-2xl border border-slate-200 bg-white shadow-2xl backdrop-blur-xl';
