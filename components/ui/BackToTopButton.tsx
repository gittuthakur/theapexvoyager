'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasBottomOverlay, subscribeBottomOverlay } from '@/lib/bottomOverlay';
import { usePathname } from 'next/navigation';

const SCROLL_THRESHOLD = 300;

function getServerOverlaySnapshot() {
  return false;
}

// Global scroll-to-top utility, mounted once in the root layout. Unrelated to
// BackButton (components/ui/BackButton.tsx), which navigates browser history —
// this only ever moves the current page's scroll position, never the route.
export default function BackToTopButton() {
  const [scrolled, setScrolled] = useState(false);
  // Some pages have their own fixed bottom bar (the Journeys compare tray, the
  // Plan My Journey mobile nav) that claims the same corner while it's visible —
  // yield to it instead of stacking on top.
  const overlayActive = useSyncExternalStore(subscribeBottomOverlay, hasBottomOverlay, getServerOverlaySnapshot);

  useEffect(() => {
    function handleScroll() {
      setScrolled((prev) => {
        const shouldShow = window.scrollY > SCROLL_THRESHOLD;
        return prev === shouldShow ? prev : shouldShow;
      });
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const visible = scrolled && !overlayActive;
  const pathname = usePathname();
  // Check karein ki current page home page hai ya nahi
  const isHomePage = pathname === '/';

  // Home page ke liye 6rem, baki pages ke liye 2rem
  const bottomPosition = isHomePage 
    ? 'max(6rem, calc(env(safe-area-inset-bottom) + 5rem))' 
    : 'calc(env(safe-area-inset-bottom) + 2rem)'; 

  function handleClick() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      className={cn(
        'cursor-hover fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-black/90 text-white shadow-glow transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:bg-black hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-300',
        visible ? 'visible translate-y-0 opacity-100 pointer-events-auto' : 'invisible translate-y-2 opacity-0 pointer-events-none'
      )}
      // 6rem clears the existing bottom-right WhatsApp button (bottom-6, 56px tall)
      style={{ bottom: bottomPosition }}
      // wherever it's rendered, with room to spare on pages that don't have it.
    >
      <ArrowUp size={24} aria-hidden="true" />
    </button>
  );
}
