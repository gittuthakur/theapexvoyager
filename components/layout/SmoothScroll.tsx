'use client';

import { ReactNode, useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

// Any scrollable overlay (modal, popover, dropdown) that should keep native
// scroll instead of being hijacked by Lenis below.
const NESTED_SCROLL_SELECTOR = '.overflow-y-auto, .overflow-auto, [data-lenis-prevent]';

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Eased/smoothed scrolling is one of the canonical prefers-reduced-motion use cases —
    // skip Lenis entirely so native (instant, non-eased) browser scrolling takes over;
    // the scroll-lock class toggle it would otherwise watch is a CSS-only concern that
    // works with or without Lenis running.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      wheelMultiplier: 1,
      infinite: false
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // Lenis attaches its own wheel/touchmove listeners to `window` in the bubble
    // phase. A bubble-phase stopPropagation() from inside a nested scroller can't
    // reliably beat that (it depends on mount order), so intercept here instead:
    // capture always runs before bubble, so this reliably shields any
    // overflow-y-auto/overflow-auto container from Lenis without touching it.
    const shieldNestedScroll = (event: WheelEvent | TouchEvent) => {
      const target = event.target as Element | null;
      if (target?.closest(NESTED_SCROLL_SELECTOR)) {
        event.stopPropagation();
      }
    };

    window.addEventListener('wheel', shieldNestedScroll, { capture: true, passive: true });
    window.addEventListener('touchmove', shieldNestedScroll, { capture: true, passive: true });

    // useBodyScrollLock (every modal/drawer on the site) toggles this class on <html> but
    // has no reference to this Lenis instance to pause it — Lenis's own RAF loop and
    // eased-scroll interpolation keep running the whole time a modal is "locked" open,
    // completely unaware that native scrolling is frozen. Any wheel input queued right
    // before or during the lock still gets animated toward, landing the real scroll
    // position somewhere the user never saw, which then jumps into view the moment the
    // overlay closes and the lock lifts. Watching the same class instead of threading a
    // Lenis ref through the shared overlay/hook keeps every existing consumer unchanged.
    function syncLenisToLockState() {
      if (document.documentElement.classList.contains('overflow-hidden')) {
        lenis.stop();
      } else {
        lenis.start();
      }
    }

    const scrollLockObserver = new MutationObserver(syncLenisToLockState);
    scrollLockObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    // MutationObserver only fires on future class changes, not the class's state at the
    // moment `observe()` is called — e.g. a `?book=1` deep link whose modal-opening effect
    // runs before this one and has already added the lock class. Sync once up front so
    // that ordering can't leave Lenis running against an already-locked page.
    syncLenisToLockState();

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      scrollLockObserver.disconnect();
      window.removeEventListener('wheel', shieldNestedScroll, { capture: true });
      window.removeEventListener('touchmove', shieldNestedScroll, { capture: true });
    };
  }, []);

  return <>{children}</>;
}
