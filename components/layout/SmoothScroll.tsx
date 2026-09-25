'use client';

import { ReactNode, useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

// Any scrollable overlay (modal, popover, dropdown) that should keep native
// scroll instead of being hijacked by Lenis below.
const NESTED_SCROLL_SELECTOR = '.overflow-y-auto, .overflow-auto, [data-lenis-prevent]';

// Neither option below is set, so `syncTouch` stays at the package default of
// `false` — meaning Lenis's own onVirtualScroll never treats a touch gesture as
// "smooth" (that branch requires `syncTouch && isTouchEvent`), and touch scrolling
// on this site has always been native, untouched by Lenis. A touch-only device
// therefore gets zero scrolling benefit from Lenis today, yet still pays for its
// non-passive touchstart/touchmove/touchend window listeners (attached
// unconditionally by Lenis's VirtualScroll) and this file's own perpetual RAF
// loop. `any-pointer`/`any-hover` (rather than the primary-pointer `pointer`/
// `hover` CustomCursor uses) is the correct check here: Lenis's real job is
// smoothing *wheel* input specifically, which only a real mouse/trackpad can
// generate, so a hybrid touchscreen-laptop/Surface/tablet that also has a
// trackpad or mouse — even one where touch is the OS-reported primary pointer —
// keeps Lenis, since that hardware can and does produce wheel events. Only a
// device with no fine/hover-capable input at all (a phone/tablet with just a
// touchscreen) loses anything, and it was already getting nothing.
const ELIGIBLE_QUERY = '(any-pointer: fine) and (any-hover: hover) and (prefers-reduced-motion: no-preference)';

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Checked once at mount, not kept in sync via a MediaQueryList `change`
    // listener: unlike a purely decorative overlay, tearing Lenis down and
    // recreating it mid-session would need to reconcile animatedScroll/
    // targetScroll against whatever the user has scrolled to in the meantime
    // (risking a visible jump) and re-run the wheel/touchmove shield and
    // MutationObserver setup — real regression surface for a preference that,
    // in practice, changes at runtime only via a DevTools toggle. Reduced-motion
    // already skipped Lenis at mount before this change; this just widens the
    // same mount-time check to also cover devices with no real wheel hardware.
    if (!window.matchMedia(ELIGIBLE_QUERY).matches) return;

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
