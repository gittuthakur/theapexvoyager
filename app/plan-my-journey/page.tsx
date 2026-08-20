import type { Metadata } from 'next';
import { Suspense } from 'react';
import BackButton from '@/components/ui/BackButton';
import PlanMyJourneyWizard from '@/components/modules/trip-planner';
import { siteConfig } from '@/config/site.config';

export const metadata: Metadata = {
  title: `Plan My Journey | ${siteConfig.name}`,
  description:
    "Answer a few quick questions and we'll build three tailored Himalayan itineraries — Smart, Comfort and Signature — with transparent, real-time pricing."
};

interface PlanMyJourneyPageProps {
  searchParams: Promise<{ destination?: string; region?: string }>;
}

export default async function PlanMyJourneyPage({ searchParams }: PlanMyJourneyPageProps) {
  const { destination, region } = await searchParams;
  // router.back() (via BackButton) already returns to wherever the user actually came
  // from — this fallback only kicks in when there's no real navigation history to go
  // back to (a direct URL open, refresh, or new tab). In that case, prefer the specific
  // destination/region the wizard was opened for over the generic homepage, so a direct
  // link like /plan-my-journey?region=himachal-pradesh still lands somewhere relevant.
  const fallbackHref = destination ? `/destinations/${destination}` : region ? `/regions/${region}` : '/';

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-6">
        <BackButton fallbackHref={fallbackHref} label="Back" />

        <div>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Plan My <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">Journey</span></h1>
          <p className="mt-2 max-w-2xl text-base text-slate-600">
            Destination, dates, style, stay and transport — one guided flow, three ready-to-book itineraries.
          </p>
        </div>

        <Suspense fallback={null}>
          <PlanMyJourneyWizard />
        </Suspense>
      </div>
    </main>
  );
}
