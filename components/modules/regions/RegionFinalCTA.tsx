'use client';

import { Compass, ArrowRight } from 'lucide-react';
import { useBookingNavigation } from '@/lib/bookingNavigation';
import TalkToTravelTeamButton from '@/components/modules/TalkToTravelTeamButton';
import type { RegionProfile } from '@/types/regionHub';

export interface RegionFinalCTAProps {
  region: RegionProfile;
}

export default function RegionFinalCTA({ region }: RegionFinalCTAProps) {
  const { navigateToBooking } = useBookingNavigation();

  return (
    <section className="mx-auto mt-4 max-w-6xl rounded-3xl border border-slate-300 bg-apex-50 px-6 py-10 text-center sm:px-12">
      <Compass className="mx-auto text-apex-500" size={28} />
      <h2 className="mt-4 text-2xl font-bold text-slate-800 sm:text-3xl">Plan Your {region.name} Journey</h2>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => navigateToBooking({ source: 'region', slug: region.slug })}
          className="cursor-hover inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-apex-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-apex-500/30 transition-all duration-300 ease-in-out hover:bg-apex-400"
        >
          Create My Journey
          <ArrowRight size={18} />
        </button>
        {/* No Expert is currently publicly listed for any region (or site-wide) — a
            "Talk to a Travel Expert" link into /experts would land on an empty grid.
            TalkToTravelTeamButton is the same real, working enquiry mechanism used
            elsewhere on the site for exactly this "no specific expert" case: it opens
            a genuine booking-request modal, never a dead end. */}
        <TalkToTravelTeamButton
          destination={region.name}
          label="Talk to Our Travel Team"
          className="min-h-[48px] rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        />
      </div>
    </section>
  );
}
