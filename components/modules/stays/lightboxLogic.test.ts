import { describe, expect, it, vi } from 'vitest';
import {
  FOCUSABLE_SELECTOR,
  SWIPE_THRESHOLD_PX,
  announceSlide,
  createFocusRestorer,
  formatAuthorNames,
  handleLightboxKeyDown,
  nearbyIndexes,
  swipeDirection,
  wrapIndex,
  type KeyEventLike
} from './lightboxLogic';

// A fake "DOM": focusable elements that record when they receive focus. The real component supplies real elements; the
// logic only needs `focus()` and identity, so the whole keyboard and focus behaviour is testable without a browser.
function makeFocusables(count: number) {
  const log: number[] = [];
  const elements = Array.from({ length: count }, (_, id) => ({ id, focus: () => void log.push(id) }));
  return { elements, log };
}

function keyEvent(key: string, shiftKey = false) {
  const preventDefault = vi.fn();
  const event: KeyEventLike = { key, shiftKey, preventDefault };
  return { event, preventDefault };
}

function context(overrides: Partial<Parameters<typeof handleLightboxKeyDown>[1]> = {}) {
  const { elements, log } = makeFocusables(4);
  const onClose = vi.fn();
  const onIndexChange = vi.fn();
  return { elements, log, onClose, onIndexChange, ctx: { count: 5, index: 2, focusables: elements, active: elements[1], onClose, onIndexChange, ...overrides } };
}

describe('wrapIndex and nearbyIndexes', () => {
  it('wraps in both directions and survives negative and large deltas', () => {
    expect(wrapIndex(0, -1, 5)).toBe(4);
    expect(wrapIndex(4, 1, 5)).toBe(0);
    expect(wrapIndex(2, 1, 5)).toBe(3);
    expect(wrapIndex(2, -7, 5)).toBe(0);
    expect(wrapIndex(0, 0, 1)).toBe(0);
    expect(wrapIndex(3, 1, 0)).toBe(0);
  });

  it('keeps only the active photo and its two neighbours mounted (so only nearby photos are loaded)', () => {
    expect(nearbyIndexes(3, 8).sort()).toEqual([2, 3, 4]);
    expect(nearbyIndexes(0, 8).sort()).toEqual([0, 1, 7]);
    expect(nearbyIndexes(7, 8).sort()).toEqual([0, 6, 7]);
    expect(nearbyIndexes(0, 1)).toEqual([0]);
    expect(nearbyIndexes(1, 2).sort()).toEqual([0, 1]);
    expect(nearbyIndexes(0, 0)).toEqual([]);
  });

  it('never selects more than three slides, however many photos there are', () => {
    for (let count = 1; count <= 30; count += 1) for (let index = 0; index < count; index += 1) expect(nearbyIndexes(index, count).length).toBeLessThanOrEqual(3);
  });
});

describe('formatAuthorNames and announceSlide (screen reader text)', () => {
  it('formats one, two and several names without shortening any of them', () => {
    expect(formatAuthorNames([])).toBe('');
    expect(formatAuthorNames(['Asha Verma'])).toBe('Asha Verma');
    expect(formatAuthorNames(['Asha', 'Ben'])).toBe('Asha and Ben');
    expect(formatAuthorNames(['Asha', 'Ben', 'Chitra'])).toBe('Asha, Ben and Chitra');
    expect(formatAuthorNames(['A', 'B', 'C', 'D'])).toBe('A, B, C and D');
    const long = 'Maria Fernanda de los Angeles Garcia-Lopez Rodriguez-Hernandez';
    expect(formatAuthorNames([long, 'B'])).toBe(`${long} and B`);
  });

  it('announces the position and who took the photo, or just the position when there is no author', () => {
    expect(announceSlide(0, 5, ['Asha Verma'])).toBe('Photo 1 of 5, by Asha Verma');
    expect(announceSlide(2, 5, ['Asha', 'Ben'])).toBe('Photo 3 of 5, by Asha and Ben');
    expect(announceSlide(4, 5, [])).toBe('Photo 5 of 5');
  });
});

describe('swipe navigation', () => {
  const start = { x: 200, y: 300 };

  it('a left swipe shows the next photo and a right swipe the previous one', () => {
    expect(swipeDirection(start, { x: 120, y: 305 })).toBe('next');
    expect(swipeDirection(start, { x: 290, y: 295 })).toBe('prev');
  });

  it('ignores short movements (taps and jitter) and exactly-under-threshold swipes', () => {
    expect(swipeDirection(start, { x: 200, y: 300 })).toBeNull();
    expect(swipeDirection(start, { x: 200 + SWIPE_THRESHOLD_PX - 1, y: 300 })).toBeNull();
    expect(swipeDirection(start, { x: 200 - SWIPE_THRESHOLD_PX + 1, y: 300 })).toBeNull();
    expect(swipeDirection(start, { x: 200 + SWIPE_THRESHOLD_PX, y: 300 })).toBe('prev');
  });

  it('ignores mostly-vertical gestures so scrolling the caption never changes the photo', () => {
    expect(swipeDirection(start, { x: 120, y: 520 })).toBeNull();
    expect(swipeDirection(start, { x: 260, y: 40 })).toBeNull();
  });
});

describe('Escape and arrow keys', () => {
  it('Escape closes the dialog', () => {
    const { event, preventDefault } = keyEvent('Escape');
    const { ctx, onClose, onIndexChange } = context();
    expect(handleLightboxKeyDown(event, ctx)).toBe('close');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onIndexChange).not.toHaveBeenCalled();
    expect(preventDefault).toHaveBeenCalled();
  });

  it('ArrowRight and ArrowLeft move to the next and previous photo, wrapping at the ends', () => {
    for (const [key, index, expected, action] of [
      ['ArrowRight', 2, 3, 'next'],
      ['ArrowLeft', 2, 1, 'prev'],
      ['ArrowRight', 4, 0, 'next'],
      ['ArrowLeft', 0, 4, 'prev']
    ] as const) {
      const { event, preventDefault } = keyEvent(key);
      const { ctx, onIndexChange, onClose } = context({ index });
      expect(handleLightboxKeyDown(event, ctx)).toBe(action);
      expect(onIndexChange).toHaveBeenCalledWith(expected);
      expect(onClose).not.toHaveBeenCalled();
      expect(preventDefault).toHaveBeenCalled();
    }
  });

  it('with a single photo the arrow keys do nothing and are left to the browser', () => {
    for (const key of ['ArrowRight', 'ArrowLeft']) {
      const { event, preventDefault } = keyEvent(key);
      const { ctx, onIndexChange } = context({ count: 1, index: 0 });
      expect(handleLightboxKeyDown(event, ctx)).toBeNull();
      expect(onIndexChange).not.toHaveBeenCalled();
      expect(preventDefault).not.toHaveBeenCalled();
    }
  });

  it('other keys are ignored and have no side effects', () => {
    for (const key of ['Enter', ' ', 'a', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'F5']) {
      const { event, preventDefault } = keyEvent(key);
      const { ctx, onClose, onIndexChange, log } = context();
      expect(handleLightboxKeyDown(event, ctx), key).toBeNull();
      expect(onClose).not.toHaveBeenCalled();
      expect(onIndexChange).not.toHaveBeenCalled();
      expect(preventDefault).not.toHaveBeenCalled();
      expect(log).toEqual([]);
    }
  });
});

describe('focus trap (Tab and Shift+Tab)', () => {
  it('Tab on the LAST element wraps to the first', () => {
    const { event, preventDefault } = keyEvent('Tab');
    const { ctx, elements, log } = context();
    ctx.active = elements[3];
    expect(handleLightboxKeyDown(event, ctx)).toBe('trap');
    expect(log).toEqual([0]);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('Shift+Tab on the FIRST element wraps to the last', () => {
    const { event, preventDefault } = keyEvent('Tab', true);
    const { ctx, elements, log } = context();
    ctx.active = elements[0];
    expect(handleLightboxKeyDown(event, ctx)).toBe('trap');
    expect(log).toEqual([3]);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('Tab and Shift+Tab in the middle are left to the browser (it moves focus normally inside the dialog)', () => {
    for (const shiftKey of [false, true]) {
      const { event, preventDefault } = keyEvent('Tab', shiftKey);
      const { ctx, log } = context();
      expect(handleLightboxKeyDown(event, ctx)).toBeNull();
      expect(log).toEqual([]);
      expect(preventDefault).not.toHaveBeenCalled();
    }
  });

  it('pulls focus back in if it ever escapes the dialog: Tab goes to the first element, Shift+Tab to the last', () => {
    const outside = { focus: vi.fn() };
    const forward = context();
    forward.ctx.active = outside;
    handleLightboxKeyDown(keyEvent('Tab').event, forward.ctx);
    expect(forward.log).toEqual([0]);

    const backward = context();
    backward.ctx.active = outside;
    handleLightboxKeyDown(keyEvent('Tab', true).event, backward.ctx);
    expect(backward.log).toEqual([3]);
    expect(outside.focus).not.toHaveBeenCalled();
  });

  it('a lone focusable element keeps focus on itself in both directions', () => {
    for (const shiftKey of [false, true]) {
      const { elements, log } = makeFocusables(1);
      const { event, preventDefault } = keyEvent('Tab', shiftKey);
      handleLightboxKeyDown(event, { count: 1, index: 0, focusables: elements, active: elements[0], onClose: vi.fn(), onIndexChange: vi.fn() });
      expect(log).toEqual([0]);
      expect(preventDefault).toHaveBeenCalled();
    }
  });

  it('with nothing focusable Tab is swallowed rather than escaping the dialog', () => {
    const { event, preventDefault } = keyEvent('Tab');
    expect(handleLightboxKeyDown(event, { count: 1, index: 0, focusables: [], active: null, onClose: vi.fn(), onIndexChange: vi.fn() })).toBe('trap');
    expect(preventDefault).toHaveBeenCalled();
  });

  it('repeated Tab presses cycle through every element and never leave the set', () => {
    // A tiny model of the browser: focus() moves "focus" to that element; when the logic does not intercept Tab, the
    // browser itself moves to the next element in order. Starting on the first element, pressing Tab must visit every
    // element in order and wrap, never landing outside the dialog.
    let active: { id: number; focus: () => void } | null = null;
    const elements: Array<{ id: number; focus: () => void }> = Array.from({ length: 4 }, (_, id) => ({ id, focus: () => void (active = elements[id]) }));
    active = elements[0];
    const visited: number[] = [0];
    for (let step = 0; step < 8; step += 1) {
      const current: { id: number; focus: () => void } = active!;
      const outcome = handleLightboxKeyDown(keyEvent('Tab').event, { count: 1, index: 0, focusables: elements, active: current, onClose: vi.fn(), onIndexChange: vi.fn() });
      if (outcome !== 'trap') active = elements[current.id + 1];
      visited.push(active!.id);
    }
    expect(visited).toEqual([0, 1, 2, 3, 0, 1, 2, 3, 0]);
  });
});

describe('focus restoration on close', () => {
  it('gives focus back to the element that had it when the dialog opened', () => {
    const opener = { focus: vi.fn() };
    const restore = createFocusRestorer(() => opener);
    expect(opener.focus).not.toHaveBeenCalled();
    restore();
    expect(opener.focus).toHaveBeenCalledTimes(1);
  });

  it('captures the opener at open time, not at close time', () => {
    let active: { focus: () => void } = { focus: vi.fn() };
    const opener = active;
    const restore = createFocusRestorer(() => active);
    active = { focus: vi.fn() };
    restore();
    expect(opener.focus).toHaveBeenCalledTimes(1);
    expect(active.focus).not.toHaveBeenCalled();
  });

  it('does not throw when nothing, or something unfocusable, had focus', () => {
    expect(() => createFocusRestorer(() => null)()).not.toThrow();
    expect(() => createFocusRestorer(() => undefined)()).not.toThrow();
    expect(() => createFocusRestorer(() => ({}))()).not.toThrow();
    expect(() => createFocusRestorer(() => 'body')()).not.toThrow();
  });
});

describe('focusable selector', () => {
  it('matches links and enabled buttons and excludes disabled buttons and tabindex=-1', () => {
    expect(FOCUSABLE_SELECTOR).toContain('a[href]');
    expect(FOCUSABLE_SELECTOR).toContain('button:not([disabled])');
    expect(FOCUSABLE_SELECTOR).toContain('[tabindex]:not([tabindex="-1"])');
  });
});
