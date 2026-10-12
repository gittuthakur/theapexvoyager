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

/** Thrown when the active-exclusion list cannot be read. An exclusion is a property owner's
 *  takedown request, so "I could not check" must never be treated as "nothing is excluded":
 *  every lookup below FAILS CLOSED by throwing this, and each public caller turns it into a
 *  safe "temporarily unavailable" state for Google-sourced results (never an unfiltered list).
 *  No last-known-good copy is kept: a stale set cannot prove a newer exclusion is absent. */
export class ExclusionLookupError extends Error {
  constructor(cause?: unknown) {
    super('Active property exclusions could not be loaded');
    this.name = 'ExclusionLookupError';
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

export async function getActiveExclusionSet(provider: ExcludedPlaceProvider): Promise<Set<string>> {
  try {
    await connectDB();
    const rows = await ExcludedPlace.find({ provider, isActive: true }, { providerPlaceId: 1 }).lean();
    return new Set(rows.map((row) => row.providerPlaceId));
  } catch (error) {
    console.error('[propertyExclusion] Failed to load active exclusions — failing CLOSED (Google-sourced results withheld)', error);
    throw new ExclusionLookupError(error);
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
