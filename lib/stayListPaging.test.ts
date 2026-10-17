import { describe, expect, it } from 'vitest';
import {
  STAYS_BATCH_SIZE,
  dedupeByPlaceId,
  effectiveVisibleCount,
  hasMore,
  nextVisibleCount,
  resolveGridPhase,
  showingLabel,
  type PagingState
} from './stayListPaging';

const ids = (n: number) => Array.from({ length: n }, (_, i) => ({ placeId: `p${i}` }));

// Mirrors what StaysGrid does with these helpers on a click, so whole sequences can be exercised without a DOM.
function click(state: PagingState, key: string, total: number): PagingState {
  const current = effectiveVisibleCount(state, key, total);
  return { key, count: nextVisibleCount(current, total) };
}

describe('batch size', () => {
  it('is 24', () => expect(STAYS_BATCH_SIZE).toBe(24));
});

describe('visible count by total size', () => {
  it.each([
    [0, 0, false],
    [5, 5, false],
    [23, 23, false],
    [24, 24, false],
    [25, 24, true],
    [94, 24, true]
  ])('%i stays: initially shows %i, more=%s', (total, shown, more) => {
    const visible = effectiveVisibleCount({ key: '', count: STAYS_BATCH_SIZE }, 'k', total);
    expect(visible).toBe(shown);
    expect(hasMore(visible, total)).toBe(more);
  });
});

describe('Load more sequence', () => {
  it('94 stays: 24 → 48 → 72 → 94 (final partial batch), then no more', () => {
    let state: PagingState = { key: 'k', count: STAYS_BATCH_SIZE };
    const seen = [effectiveVisibleCount(state, 'k', 94)];
    for (let i = 0; i < 3; i++) {
      state = click(state, 'k', 94);
      seen.push(effectiveVisibleCount(state, 'k', 94));
    }
    expect(seen).toEqual([24, 48, 72, 94]);
    expect(hasMore(seen[3], 94)).toBe(false);
  });

  it('25 stays: one click reveals the single remaining card', () => {
    const state = click({ key: 'k', count: STAYS_BATCH_SIZE }, 'k', 25);
    expect(effectiveVisibleCount(state, 'k', 25)).toBe(25);
  });

  it('never overshoots the total, even on a stray extra click', () => {
    let state: PagingState = { key: 'k', count: 94 };
    state = click(state, 'k', 94);
    expect(effectiveVisibleCount(state, 'k', 94)).toBe(94);
    expect(nextVisibleCount(90, 94)).toBe(94);
  });
});

describe('reset rules (stale counts are never reused)', () => {
  const grown: PagingState = { key: 'manali|all|v1', count: 72 };

  it('a different filter key falls back to one batch', () => {
    expect(effectiveVisibleCount(grown, 'manali|hotel|v1', 94)).toBe(24);
  });

  it('a different destination key falls back to one batch', () => {
    expect(effectiveVisibleCount(grown, 'kasol|all|v1', 94)).toBe(24);
  });

  it('a replaced dataset (new version) falls back to one batch', () => {
    expect(effectiveVisibleCount(grown, 'manali|all|v2', 94)).toBe(24);
  });

  it('the same key keeps the revealed count', () => {
    expect(effectiveVisibleCount(grown, 'manali|all|v1', 94)).toBe(72);
  });

  it('a smaller dataset clamps the old count', () => {
    expect(effectiveVisibleCount(grown, 'manali|all|v1', 30)).toBe(30);
  });

  it('after a reset, the next click continues from one batch, not from the stale count', () => {
    const state = click(grown, 'manali|hotel|v1', 60);
    expect(effectiveVisibleCount(state, 'manali|hotel|v1', 60)).toBe(48);
  });
});

describe('dedupeByPlaceId', () => {
  it('drops a true repeat (same source, id and name), keeping the first and the order', () => {
    const input = [
      { placeId: 'curated:a', source: 'curated', name: 'A', n: 1 },
      { placeId: 'g1', source: 'google', name: 'G1', n: 2 },
      { placeId: 'curated:a', source: 'curated', name: 'A', n: 3 },
      { placeId: 'g1', source: 'google', name: 'g1 ', n: 4 },
      { placeId: 'g2', source: 'google', name: 'G2', n: 5 }
    ];
    expect(dedupeByPlaceId(input).map((x) => x.n)).toEqual([1, 2, 5]);
  });

  it('never merges stays with a missing or blank placeId', () => {
    const input = [
      { placeId: '', name: 'One', n: 1 },
      { placeId: '', name: 'One', n: 2 },
      { placeId: '   ', name: 'Two', n: 3 },
      { placeId: undefined as unknown as string, name: 'Three', n: 4 },
      { placeId: undefined as unknown as string, name: 'Three', n: 5 }
    ];
    expect(dedupeByPlaceId(input).map((x) => x.n)).toEqual([1, 2, 3, 4, 5]);
  });

  it('never merges two different properties that share an id (different name or source)', () => {
    const input = [
      { placeId: 'x', source: 'google', name: 'Hotel Alpha', n: 1 },
      { placeId: 'x', source: 'google', name: 'Hotel Beta', n: 2 },
      { placeId: 'x', source: 'curated', name: 'Hotel Alpha', n: 3 }
    ];
    expect(dedupeByPlaceId(input).map((x) => x.n)).toEqual([1, 2, 3]);
  });

  it('a list without duplicates is returned in the same order', () => {
    const input = ids(94);
    expect(dedupeByPlaceId(input)).toEqual(input);
  });
});

describe('labels and phases', () => {
  it('formats the count line', () => expect(showingLabel(24, 94)).toBe('Showing 24 of 94 stays'));

  it('keeps the loading / unavailable / empty behaviour: curated stays suppress the skeleton and the error message', () => {
    expect(resolveGridPhase('loading', 0, 0)).toBe('skeleton');
    expect(resolveGridPhase('loading', 3, 3)).toBe('list');
    expect(resolveGridPhase('error', 0, 0)).toBe('error');
    expect(resolveGridPhase('error', 3, 3)).toBe('list');
    expect(resolveGridPhase('ready', 0, 0)).toBe('empty');
    expect(resolveGridPhase('ready', 0, 94)).toBe('list');
  });
});
