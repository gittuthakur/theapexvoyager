'use client';

import { ReactNode, useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

// Any scrollable overlay (modal, popover, dropdown) that should keep native
// scroll instead of being hijacked by Lenis below.
const NESTED_SCROLL_SELECTOR = '.overflow-y-auto, .overflow-auto, [data-lenis-prevent]';

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

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

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.removeEventListener('wheel', shieldNestedScroll, { capture: true });
      window.removeEventListener('touchmove', shieldNestedScroll, { capture: true });
    };
  }, []);

  return <>{children}</>;
}
