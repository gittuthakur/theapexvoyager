import { connectDB } from '@/lib/mongodb';
import { ExcludedPlace, type ExcludedPlaceDocument, type ExcludedPlaceProvider } from '@/models/ExcludedPlace';

/**
 * THE single place exclusion logic lives — every public surface that can render a
 * Google-sourced property (lib/stays.ts's getStaysForDestination, getCachedStaysCatalog,
 * getStayByPlaceId, and the fetchAndCacheStayType write path) calls into this file,
 * never re-implements its own "is this excluded" check. Matching is always by the
 * provider's own stable place id (`providerPlaceId`), never by property name — two
 * different real properties can share a very similar name, and a name-based match could
 * silently hide the wrong one.
 */

/** Fails OPEN (returns an empty set / `false`) on any lookup failure — a transient
 *  exclusion-database hiccup must never accidentally hide a property that was never
 *  actually excluded (explicit product requirement). The accepted tradeoff is the
 *  reverse: a vanishingly rare window where a genuinely excluded property could still
 *  render if this collection/DB itself is down, which is judged safer than the
 *  alternative of a DB blip taking real, legitimate listings off the site. */
export async function getActiveExclusionSet(provider: ExcludedPlaceProvider): Promise<Set<string>> {
  try {
    await connectDB();
    const rows = await ExcludedPlace.find({ provider, isActive: true }, { providerPlaceId: 1 }).lean();
    return new Set(rows.map((row) => row.providerPlaceId));
  } catch (error) {
    console.error('[propertyExclusion] Failed to load active exclusions — failing OPEN (showing all properties)', error);
    return new Set();
  }
}

export async function isPropertyExcluded(provider: ExcludedPlaceProvider, providerPlaceId: string): Promise<boolean> {
  const excluded = await getActiveExclusionSet(provider);
  return excluded.has(providerPlaceId);
}

/** Removes every excluded item from `items` — used everywhere a list of Google-sourced
 *  results is about to be cached or shown. A single exclusion-set fetch covers the whole
 *  array, never one query per item. Returns `items` unchanged (same reference) when
 *  there's nothing to filter, so a caller checking `result === items` can cheaply detect
 *  "no exclusions applied" if it ever needs to. */
export async function filterOutExcludedPlaces<T extends { placeId: string }>(provider: ExcludedPlaceProvider, items: T[]): Promise<T[]> {
  if (items.length === 0) return items;
  const excluded = await getActiveExclusionSet(provider);
  if (excluded.size === 0) return items;
  return items.filter((item) => !excluded.has(item.placeId));
}

export interface AddExclusionInput {
  provider: ExcludedPlaceProvider;
  providerPlaceId: string;
  propertyName?: string;
  reason?: string;
  requestedBy?: string;
  notes?: string;
}

export type AddExclusionResult = { added: true; exclusion: ExcludedPlaceDocument } | { added: false; reason: 'invalid_input' | 'already_excluded' };

/** The only function allowed to create an exclusion. Refuses a duplicate ACTIVE
 *  exclusion for the same (provider, providerPlaceId) rather than creating a second row
 *  — re-adding a place that already has an active exclusion is a no-op, not an error a
 *  caller needs to handle specially. */
export async function addExclusion(input: AddExclusionInput): Promise<AddExclusionResult> {
  const providerPlaceId = input.providerPlaceId.trim();
  if (!providerPlaceId) return { added: false, reason: 'invalid_input' };

  await connectDB();

  const existing = await ExcludedPlace.findOne({ provider: input.provider, providerPlaceId, isActive: true });
  if (existing) return { added: false, reason: 'already_excluded' };

  const exclusion = await ExcludedPlace.create({
    provider: input.provider,
    providerPlaceId,
    propertyName: input.propertyName,
    reason: input.reason,
    requestedBy: input.requestedBy,
    requestDate: new Date(),
    notes: input.notes,
    isActive: true
  });

  return { added: true, exclusion };
}

export interface ExclusionFilter {
  provider?: ExcludedPlaceProvider;
  isActive?: boolean;
}

export async function getExclusions(filter: ExclusionFilter = {}): Promise<ExcludedPlaceDocument[]> {
  await connectDB();
  return ExcludedPlace.find({
    ...(filter.provider ? { provider: filter.provider } : {}),
    ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {})
  })
    .sort({ createdAt: -1 })
    .lean();
}

export type DeactivateExclusionResult = { deactivated: true; exclusion: ExcludedPlaceDocument } | { deactivated: false; reason: 'not_found' };

/** Making a property eligible again — never deletes the row, so the request/decision
 *  history survives (an admin can see it was once excluded and later reinstated). */
export async function deactivateExclusion(id: string): Promise<DeactivateExclusionResult> {
  await connectDB();
  const exclusion = await ExcludedPlace.findById(id);
  if (!exclusion) return { deactivated: false, reason: 'not_found' };

  exclusion.isActive = false;
  await exclusion.save();
  return { deactivated: true, exclusion };
}
