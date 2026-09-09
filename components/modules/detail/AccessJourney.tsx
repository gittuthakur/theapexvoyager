import { Fragment } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccessJourneyStage {
  title: string;
  description?: string;
  note?: string;
}

export interface AccessJourneyProps {
  stages: AccessJourneyStage[];
  heading?: string;
  className?: string;
}

/**
 * Generic staged-access sequence — not tied to any one destination or entity. Renders an
 * ordered list of arbitrary stages (e.g. gateway → road base → road head → trek start →
 * final point) supplied entirely by the caller. Carries no live status, fare, distance or
 * availability of its own; every word shown comes from `stages`, so it says nothing beyond
 * what the caller actually knows to be true.
 */
export default function AccessJourney({ stages, heading, className }: AccessJourneyProps) {
  if (stages.length === 0) return null;

  return (
    <div className={cn('rounded-[1.5rem] border border-slate-200 bg-white p-6 sm:p-8', className)}>
      {heading ? <h3 className="text-lg font-semibold text-slate-900">{heading}</h3> : null}
      <ol className={cn('flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-3', heading ? 'mt-5' : undefined)}>
        {stages.map((stage, index) => (
          <Fragment key={`${stage.title}-${index}`}>
            <li className="flex min-w-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:basis-[calc(50%-1.5rem)] lg:basis-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-apex-500">
                Stage {index + 1} of {stages.length}
              </span>
              <span className="mt-1 text-sm font-semibold text-slate-900">{stage.title}</span>
              {stage.description ? <span className="mt-1 text-sm leading-6 text-slate-600">{stage.description}</span> : null}
              {stage.note ? <span className="mt-2 text-xs leading-5 text-slate-500">{stage.note}</span> : null}
            </li>
            {index < stages.length - 1 ? (
              <li aria-hidden="true" className="hidden shrink-0 items-center justify-center text-slate-300 sm:flex">
                <ArrowRight size={18} />
              </li>
            ) : null}
          </Fragment>
        ))}
      </ol>
    </div>
  );
}
