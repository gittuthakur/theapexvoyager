/**
 * Pure, DOM-free logic for the credited photo lightbox (D1-3b). Everything the browser would do with real elements is
 * expressed against tiny structural interfaces (`FocusableLike`, `KeyEventLike`), so the focus trap, keyboard
 * navigation, swipe, focus restoration and announcements can be unit-tested without a DOM, and the React component stays
 * a thin wrapper that only supplies the real elements.
 */

/** Elements inside the dialog that can take keyboard focus. */
export const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** The distance (px) a horizontal swipe must travel before it counts as a navigation gesture. */
export const SWIPE_THRESHOLD_PX = 50;

export function wrapIndex(index: number, delta: number, count: number): number {
  if (count <= 0) return 0;
  return (((index + delta) % count) + count) % count;
}

/** The slides worth keeping mounted (and therefore loaded): the active one and its immediate neighbours, wrapping. */
export function nearbyIndexes(index: number, count: number): number[] {
  if (count <= 0) return [];
  return [...new Set([index, wrapIndex(index, -1, count), wrapIndex(index, 1, count)])];
}

/** "A", "A and B", "A, B and C". Names are never shortened. */
export function formatAuthorNames(names: readonly string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** What a screen reader hears when the slide changes. */
export function announceSlide(index: number, count: number, authorNames: readonly string[]): string {
  const credit = formatAuthorNames(authorNames);
  return `Photo ${index + 1} of ${count}${credit ? `, by ${credit}` : ''}`;
}

export interface Point {
  x: number;
  y: number;
}

/** A left swipe shows the next photo, a right swipe the previous one. Short or mostly-vertical gestures (scrolling) are
 *  ignored. */
export function swipeDirection(start: Point, end: Point, threshold: number = SWIPE_THRESHOLD_PX): 'prev' | 'next' | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < threshold) return null;
  if (Math.abs(dx) < Math.abs(dy) * 1.2) return null;
  return dx < 0 ? 'next' : 'prev';
}

export interface FocusableLike {
  focus(): void;
}

export interface KeyEventLike {
  key: string;
  shiftKey?: boolean;
  preventDefault(): void;
}

export interface LightboxKeyContext<T extends FocusableLike> {
  count: number;
  index: number;
  /** The focusable elements inside the dialog, in DOM order. */
  focusables: readonly T[];
  /** The element that currently has focus. */
  active: unknown;
  onClose(): void;
  onIndexChange(next: number): void;
}

export type LightboxKeyAction = 'close' | 'prev' | 'next' | 'trap' | null;

/** Escape closes, the arrow keys navigate, and Tab/Shift+Tab is trapped inside the dialog (it wraps from the last
 *  element to the first and back, and pulls focus back in if it ever escapes). Returns what it did, or null when the
 *  key is none of its business (the browser then handles it normally). */
export function handleLightboxKeyDown<T extends FocusableLike>(event: KeyEventLike, ctx: LightboxKeyContext<T>): LightboxKeyAction {
  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      ctx.onClose();
      return 'close';
    case 'ArrowLeft':
    case 'ArrowRight': {
      if (ctx.count < 2) return null;
      event.preventDefault();
      const prev = event.key === 'ArrowLeft';
      ctx.onIndexChange(wrapIndex(ctx.index, prev ? -1 : 1, ctx.count));
      return prev ? 'prev' : 'next';
    }
    case 'Tab': {
      const { focusables, active } = ctx;
      if (focusables.length === 0) {
        event.preventDefault();
        return 'trap';
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const inside = focusables.some((element) => element === active);
      if (event.shiftKey) {
        if (!inside || active === first) {
          event.preventDefault();
          last.focus();
          return 'trap';
        }
      } else if (!inside || active === last) {
        event.preventDefault();
        first.focus();
        return 'trap';
      }
      return null;
    }
    default:
      return null;
  }
}

/** Remembers which element had focus when the dialog opened; the returned function gives focus back to it. */
export function createFocusRestorer(getActive: () => unknown): () => void {
  const previous = getActive() as Partial<FocusableLike> | null;
  return () => {
    if (previous && typeof previous.focus === 'function') previous.focus();
  };
}
