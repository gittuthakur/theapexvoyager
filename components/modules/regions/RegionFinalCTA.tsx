'use client';

import Link from 'next/link';
import { ArrowRight, Compass, Users } from 'lucide-react';
import { useBookingNavigation } from '@/lib/bookingNavigation';
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
        <Link
          href="/experts"
          className="cursor-hover inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 ease-in-out hover:bg-slate-50"
        >
          <Users size={18} />
          Talk to a Travel Expert
        </Link>
      </div>
    </section>
  );
}
