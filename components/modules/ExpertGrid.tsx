import ExpertCard from '@/components/modules/ExpertCard';
import TalkToTravelTeamButton from '@/components/modules/TalkToTravelTeamButton';
import type { TravelExpert } from '@/types/expert';

export interface ExpertGridProps {
  experts: TravelExpert[];
}

// Empty state per spec §14/§26 — never a dead end, always a path to a human.
export default function ExpertGrid({ experts }: ExpertGridProps) {
  if (experts.length === 0) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-glow">
        <p className="text-lg font-semibold text-slate-900">We couldn&apos;t find an expert for these filters.</p>
        <p className="mt-3">Try a different destination, style or expertise — or talk to our travel team directly.</p>
        <div className="mt-6 flex justify-center">
          <TalkToTravelTeamButton />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {experts.map((expert) => (
        <ExpertCard key={expert.slug} expert={expert} />
      ))}
    </div>
  );
}
