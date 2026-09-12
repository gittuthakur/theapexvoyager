'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';
import { trackWhatsAppConversion } from '@/lib/googleAds';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

export interface WhatsAppButtonProps {
  phoneNumber?: string;
  messageText?: string;
  tripTitle?: string;
  destination?: string;
  dates?: string;
  className?: string;
}

export default function WhatsAppButton({
  phoneNumber,
  messageText,
  tripTitle,
  destination,
  dates,
  className
}: WhatsAppButtonProps) {
  // Only the default usage (no className override) is the fixed bottom-right
  // floater — callers like JourneyBookingSidebar override position to `static`
  // and render it inline, where it never overlaps the footer.
  const isFloating = !className;
  const [nearFooter, setNearFooter] = useState(false);

  useEffect(() => {
    if (!isFloating) return;
    const footer = document.querySelector('footer');
    if (!footer) return;

    // The floating button otherwise sits permanently on top of the Newsletter
    // Subscribe button and the footer's legal links on narrow viewports, where
    // that content stacks tall enough to reach the bottom-right corner. Fade it
    // out slightly before the footer comes into view instead.
    const observer = new IntersectionObserver(([entry]) => setNearFooter(entry.isIntersecting), {
      rootMargin: '0px 0px 400px 0px'
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, [isFloating]);

  function openChat() {
    const url = buildWhatsAppLink({ phoneNumber, messageText, tripTitle, destination, dates });
    trackWhatsAppConversion();
    window.open(url, '_blank');
  }

  const hidden = isFloating && nearFooter;

  return (
    <button
      type="button"
      onClick={openChat}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden || undefined}
      aria-label="Chat on WhatsApp"
      className={cn(
        'cursor-hover fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] font-semibold text-white shadow-2xl shadow-[#25D366]/20 transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#20ba5a]',
        // Floating usage only (Home hero, Region Hub): a compact icon-only circle
        // below `sm` keeps the button's footprint small enough that it can't sit on
        // top of nearby heading/body text on short mobile viewports — the full pill
        // (254px wide) was measured overlapping the Region Hub's "About" heading at
        // 390px. `className`-overridden usages (e.g. JourneyBookingSidebar's static,
        // full-width sidebar button) opt out via twMerge, same as `isFloating` itself.
        isFloating ? 'h-14 w-14 justify-center sm:h-auto sm:w-auto sm:justify-start sm:px-5 sm:py-4' : 'px-5 py-4',
        hidden ? 'pointer-events-none translate-y-4 opacity-0' : 'translate-y-0 opacity-100',
        className
      )}
    >
      <WhatsAppIcon size={22} />
      <span className={isFloating ? 'hidden sm:inline' : undefined}>Chat on WhatsApp</span>
      <ArrowRight size={22} className={isFloating ? 'hidden sm:inline' : undefined} />
    </button>
  );
}
