// Progressive rendering for the Stays listing grid (P5-A). Pure and DOM-free so every rule is unit-testable.
//
// The grid renders only the first STAYS_BATCH_SIZE matching stays and reveals another batch on each explicit click.
// This only limits what is rendered (and therefore which card photos the browser asks for): the full eligible
// dataset is still fetched, filtered and counted, and nothing is reordered or dropped.

export const STAYS_BATCH_SIZE = 24;

/**
 * Drops only a true repeat of the same listing: same source, same non-blank placeId AND same name. First occurrence wins and
 * order is preserved (so curated-first survives). A stay with a missing/blank placeId, or two different properties that
 * happen to share an id, are never merged: hiding a genuine property is worse than showing a rare repeat.
 */
export function dedupeByPlaceId<T extends { placeId: string; source?: string; name?: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const id = typeof item.placeId === 'string' ? item.placeId.trim() : '';
    if (id) {
      const key = JSON.stringify([item.source ?? '', id, (item.name ?? '').trim().toLowerCase()]);
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(item);
  }
  return out;
}

export interface PagingState {
  /** Identity of the data + filters this count was earned under. */
  key: string;
  count: number;
}

/** A count earned under a different key (another filter, destination or data load) is stale: start again from one batch. */
export function effectiveVisibleCount(state: PagingState, key: string, total: number, batch = STAYS_BATCH_SIZE): number {
  const count = state.key === key ? state.count : batch;
  return Math.max(0, Math.min(count, total));
}

export function nextVisibleCount(current: number, total: number, batch = STAYS_BATCH_SIZE): number {
  return Math.min(Math.max(current, 0) + batch, total);
}

export function hasMore(visible: number, total: number): boolean {
  return visible < total;
}

export function showingLabel(visible: number, total: number): string {
  return `Showing ${visible} of ${total} stays`;
}

export type GridPhase = 'skeleton' | 'error' | 'empty' | 'list';

/** The grid's non-list states, unchanged from before paging: curated stays render without waiting on the live fetch. */
export function resolveGridPhase(status: 'loading' | 'ready' | 'error', curatedCount: number, totalStays: number): GridPhase {
  if (status === 'loading' && curatedCount === 0) return 'skeleton';
  if (status === 'error' && curatedCount === 0) return 'error';
  if (totalStays === 0) return 'empty';
  return 'list';
}
