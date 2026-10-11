import { format, isValid, parseISO, startOfDay } from 'date-fns';

/**
 * Customer trip PREFERENCES carried in the URL by the search panels — a visitor's chosen
 * dates and party size, kept so a downstream enquiry/booking step can pre-fill them.
 *
 * These are deliberately NOT inventory filters: Journeys have no per-date availability,
 * Experiences have no verified capacity semantics, and no provider availability feeds
 * these pages. Nothing here may be used to hide, rank or price results, or to imply that a
 * date is available (see TripPreferencesNote, which states this on every page that shows them).
 *
 * Param names follow the Lead model where one exists (travelStartDate/travelEndDate/adults/
 * children); Stays keeps its established checkIn/checkOut/guests and is handled separately.
 */
export const TRIP_PREFERENCE_KEYS = [
  'travelStartDate',
  'travelEndDate',
  'adults',
  'children',
  'preferredDate',
  'participants',
  'travelers'
] as const;

export type TripPreferenceKey = (typeof TRIP_PREFERENCE_KEYS)[number];
export type TripPreferences = Partial<Record<TripPreferenceKey, string>>;

const COUNT_LIMITS: Record<'adults' | 'children' | 'participants' | 'travelers', { min: number; max: number }> = {
  adults: { min: 1, max: 16 },
  children: { min: 0, max: 10 },
  participants: { min: 1, max: 20 },
  travelers: { min: 1, max: 20 }
};

/** A real calendar date in yyyy-MM-dd form that is not in the past — else undefined. */
export function parsePreferenceDate(raw: string | null | undefined, now: Date = new Date()): string | undefined {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const parsed = parseISO(raw);
  if (!isValid(parsed) || format(parsed, 'yyyy-MM-dd') !== raw) return undefined; // rejects 2027-02-31 style rollovers
  if (parsed < startOfDay(now)) return undefined;
  return raw;
}

/** A whole number within [min, max] — else undefined. */
export function parsePreferenceCount(raw: string | null | undefined, limits: { min: number; max: number }): string | undefined {
  if (!raw || !/^\d{1,3}$/.test(raw)) return undefined;
  const value = Number(raw);
  return value >= limits.min && value <= limits.max ? String(value) : undefined;
}

type ParamSource = URLSearchParams | { get(key: string): string | null } | Record<string, string | string[] | undefined>;

function getter(source: ParamSource): (key: string) => string | undefined {
  if (typeof (source as { get?: unknown }).get === 'function') {
    return (key) => (source as { get(key: string): string | null }).get(key) ?? undefined;
  }
  const record = source as Record<string, string | string[] | undefined>;
  return (key) => {
    const value = record[key];
    return Array.isArray(value) ? value[0] : value;
  };
}

/**
 * Reads and VALIDATES the preference params from a URL/searchParams source. Anything
 * malformed, out of range or in the past is dropped (never shown, never carried on); an end
 * date without a valid start, or before it, is dropped too.
 */
export function readTripPreferences(source: ParamSource, now: Date = new Date()): TripPreferences {
  const get = getter(source);
  const prefs: TripPreferences = {};

  const start = parsePreferenceDate(get('travelStartDate'), now);
  const end = parsePreferenceDate(get('travelEndDate'), now);
  if (start) prefs.travelStartDate = start;
  if (start && end && end >= start) prefs.travelEndDate = end;

  const preferredDate = parsePreferenceDate(get('preferredDate'), now);
  if (preferredDate) prefs.preferredDate = preferredDate;

  for (const key of ['adults', 'children', 'participants', 'travelers'] as const) {
    const count = parsePreferenceCount(get(key), COUNT_LIMITS[key]);
    if (count) prefs[key] = count;
  }
  return prefs;
}

/** Copies the VALID preference params of `from` onto `to` — used by listings that rebuild
 *  their own query string so they never silently drop what the visitor entered. */
export function copyTripPreferences(from: ParamSource, to: URLSearchParams): URLSearchParams {
  for (const [key, value] of Object.entries(readTripPreferences(from))) to.set(key, value);
  return to;
}

export interface PartyInput {
  adults: number;
  children: number;
}

/** Journeys: emit dates when chosen, and the party when it was changed or dates were set —
 *  a default untouched "2 adults" is not a stated preference on its own. */
export function journeyPreferenceParams(dates: { checkIn: Date | null; checkOut: Date | null }, party: PartyInput): Record<string, string | undefined> {
  const hasDates = Boolean(dates.checkIn);
  const partyChanged = party.adults !== 2 || party.children !== 0;
  return {
    travelStartDate: dates.checkIn ? format(dates.checkIn, 'yyyy-MM-dd') : undefined,
    travelEndDate: dates.checkIn && dates.checkOut ? format(dates.checkOut, 'yyyy-MM-dd') : undefined,
    adults: hasDates || partyChanged ? String(party.adults) : undefined,
    children: (hasDates || partyChanged) && party.children > 0 ? String(party.children) : undefined
  };
}

/** Experiences / Experts: a single preferred date and a headcount, same "only when stated" rule. */
export function singleDatePreferenceParams(
  countKey: 'participants' | 'travelers',
  date: string,
  count: number
): Record<string, string | undefined> {
  const stated = Boolean(date) || count !== 2;
  return { preferredDate: date || undefined, [countKey]: stated ? String(count) : undefined };
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

function formatDay(iso: string, withYear: boolean) {
  return format(parseISO(iso), withYear ? 'd MMM yyyy' : 'd MMM');
}

/** Human-readable "Label: value" lines for the preferences present (already validated). */
export function describeTripPreferences(prefs: TripPreferences): string[] {
  const lines: string[] = [];
  if (prefs.travelStartDate) {
    lines.push(
      prefs.travelEndDate
        ? `Travel dates: ${formatDay(prefs.travelStartDate, false)} – ${formatDay(prefs.travelEndDate, true)}`
        : `Travel from: ${formatDay(prefs.travelStartDate, true)}`
    );
  }
  if (prefs.adults) {
    const children = Number(prefs.children ?? 0);
    lines.push(`Travelers: ${plural(Number(prefs.adults), 'adult', 'adults')}${children ? `, ${plural(children, 'child', 'children')}` : ''}`);
  }
  if (prefs.preferredDate) lines.push(`Preferred date: ${formatDay(prefs.preferredDate, true)}`);
  if (prefs.participants) lines.push(`Participants: ${prefs.participants}`);
  if (prefs.travelers) lines.push(`Travelers: ${prefs.travelers}`);
  return lines;
}

export const TRIP_PREFERENCES_DISCLAIMER =
  'Saved as your preferences for an enquiry. This page does not check availability — our team confirms dates and group size with you.';

export interface StayPreferences {
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}

/**
 * Stays keeps its established checkIn/checkOut/guests params. They are PREFERENCES carried to
 * a stay's detail page — /stays/search has no availability data, so they filter nothing. This
 * validates them: real, non-past dates, a check-out strictly after its check-in, and a whole
 * guest count; anything else is dropped (never shown, never passed on to the stay cards).
 */
export function readStayPreferences(
  raw: { checkIn?: string; checkOut?: string; guests?: string },
  now: Date = new Date()
): StayPreferences {
  const prefs: StayPreferences = {};
  const checkIn = parsePreferenceDate(raw.checkIn, now);
  const checkOut = parsePreferenceDate(raw.checkOut, now);
  if (checkIn) prefs.checkIn = checkIn;
  if (checkIn && checkOut && checkOut > checkIn) prefs.checkOut = checkOut;
  const guests = parsePreferenceCount(raw.guests, { min: 1, max: 32 });
  if (guests) prefs.guests = guests;
  return prefs;
}

/** e.g. ["Check-in 12 Jan 2027", "Check-out 15 Jan 2027", "2 guests"] */
export function describeStayPreferences(prefs: StayPreferences): string[] {
  const parts: string[] = [];
  if (prefs.checkIn) parts.push(`Check-in ${formatDay(prefs.checkIn, true)}`);
  if (prefs.checkOut) parts.push(`Check-out ${formatDay(prefs.checkOut, true)}`);
  if (prefs.guests) parts.push(plural(Number(prefs.guests), 'guest', 'guests'));
  return parts;
}

export const STAY_PREFERENCES_DISCLAIMER = 'Stays are not checked against these dates here — availability is confirmed when you enquire.';
