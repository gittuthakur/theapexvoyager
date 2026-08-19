import Link from 'next/link';
import { Backpack, Car, Compass, HelpCircle, Home, Sparkles, type LucideIcon } from 'lucide-react';

interface HelpOption {
  label: string;
  /** Matches ExpertTripPlanner's "needHelpWith" values so the chip pre-fills the planner below instead of landing on a dead page. */
  needHelpWith: string;
  icon: LucideIcon;
}

const helpOptions: HelpOption[] = [
  { label: 'I need a complete trip', needHelpWith: 'Complete trip', icon: Backpack },
  { label: 'I want to customise a package', needHelpWith: 'Itinerary', icon: Sparkles },
  { label: 'I need transport', needHelpWith: 'Transport', icon: Car },
  { label: 'I need a stay', needHelpWith: 'Stay', icon: Home },
  { label: 'I want local experiences', needHelpWith: 'Experiences', icon: Compass },
  { label: "I'm not sure where to go", needHelpWith: 'Everything', icon: HelpCircle }
];

// Every chip links to the trip planner further down this same page, pre-filled via
// query param — never a dead page (spec §5). See ExpertTripPlanner for the read side.
export default function ExpertHelpOptions() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-12 lg:py-16">
      <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">What can we help you plan?</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {helpOptions.map(({ label, needHelpWith, icon: Icon }) => (
          <Link
            key={label}
            href={`/experts?help=${encodeURIComponent(needHelpWith)}#plan-my-trip`}
            className="cursor-hover group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:border-apex-300 hover:text-slate-900 hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-apex-50 text-apex-600 transition-colors duration-300 ease-in-out group-hover:bg-apex-500 group-hover:text-white">
              <Icon size={18} />
            </span>
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
