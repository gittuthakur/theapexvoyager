import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import ExpertCard from '@/components/modules/ExpertCard';
import type { TravelExpert } from '@/types/expert';

export interface RegionExpertsProps {
  travelExperts: TravelExpert[];
  regionName: string;
}

export default function RegionExperts({ travelExperts, regionName }: RegionExpertsProps) {
  return (
    <section id="experts" className="py-8">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-apex-500">Local knowledge</p>
      <h2 className="mt-3 text-3xl font-bold text-slate-900">Know {regionName} Through Locals</h2>

      {travelExperts.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {travelExperts.map((expert) => (
            <ExpertCard key={expert.slug} expert={expert} />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8">
          <p className="min-w-0 text-sm text-slate-500">
            <Users size={16} className="mr-2 inline text-apex-300" />
            No dedicated {regionName} specialist yet — our broader team can still help you plan.
          </p>
          <Link href="/experts" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-apex-600 hover:text-apex-700">
            Browse all Travel Experts <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </section>
  );
}
