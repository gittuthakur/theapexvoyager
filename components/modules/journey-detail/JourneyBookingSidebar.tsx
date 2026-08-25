'use client';

import { useEffect } from 'react';
import { ArrowRight, CalendarClock, Clock, MapPin } from 'lucide-react';
import WhatsAppButton from '@/components/modules/WhatsAppButton';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { registerBottomOverlay } from '@/lib/bottomOverlay';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { formatINR } from '@/lib/pricing';
import type { TravelPackage } from '@/types/package';

export interface JourneyBookingSidebarProps {
  pkg: TravelPackage;
  onCustomize: () => void;
}

// Journey Detail-exclusive — consolidates the price + WhatsApp + "Customize" CTA into
// one persistent panel instead of repeating it in the hero and again at the page
// bottom. Desktop: sticky sidebar. Mobile: fixed bottom bar. Both render the same two
// existing actions (WhatsAppButton, the booking modal trigger) with no behavior change.
export default function JourneyBookingSidebar({ pkg, onCustomize }: JourneyBookingSidebarProps) {
  // The fixed mobile bar below (`lg:hidden`) occupies the same bottom-right corner as
  // the global Back-to-Top button — claim that space only while it's actually visible
  // (below the lg breakpoint) so Back-to-Top yields to it instead of overlapping.
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    let unregister: (() => void) | null = null;

    function sync() {
      if (mediaQuery.matches && !unregister) {
        unregister = registerBottomOverlay();
      } else if (!mediaQuery.matches && unregister) {
        unregister();
        unregister = null;
      }
    }

    sync();
    mediaQuery.addEventListener('change', sync);
    return () => {
      mediaQuery.removeEventListener('change', sync);
      unregister?.();
    };
  }, []);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Starting from</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">
            {formatINR(pkg.price)} <span className="text-sm font-normal text-slate-500">/ person</span>
          </p>
          {pkg.seasonalPricing?.length ? (
            <p className="mt-1 inline-flex gap-1.5 text-xs text-slate-500">
              <CalendarClock size={20} className="text-apex-400 mt-0.5" /> Price varies by season — see live pricing when you customize
            </p>
          ) : null}

          <div className="mt-5 space-y-2 border-t border-slate-100 pt-5 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <MapPin size={15} className="text-apex-400" /> {pkg.destination}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={15} className="text-apex-400" /> {pkg.duration}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={onCustomize}
              className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-apex-500/20 transition-all duration-300 ease-in-out hover:bg-apex-400"
            >
              Plan This Journey <ArrowRight size={16} />
            </button>
            <WhatsAppButton
              tripTitle={pkg.name}
              destination={pkg.destination}
              className="static w-full shadow-none hover:scale-100"
            />
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">No payment required to enquire</p>
        </div>
      </aside>

      {/* Mobile sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 p-4 backdrop-blur-sm lg:hidden">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">From</p>
          <p className="text-lg font-bold text-slate-900">{formatINR(pkg.price)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Chat on WhatsApp"
            onClick={() => window.open(buildWhatsAppLink({ tripTitle: pkg.name, destination: pkg.destination }), '_blank')}
            className="cursor-hover inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition-all duration-300 ease-in-out hover:bg-[#20ba5a]"
          >
            <WhatsAppIcon size={20} />
          </button>
          <button
            type="button"
            onClick={onCustomize}
            className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-apex-500/20 transition-all duration-300 ease-in-out hover:bg-apex-400"
          >
            Plan
          </button>
        </div>
      </div>
    </>
  );
}
