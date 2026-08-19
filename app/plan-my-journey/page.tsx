import type { Metadata } from 'next';
import InnerHeroBanner from '@/components/modules/InnerHeroBanner';
import PlanMyJourneyWizard from '@/components/modules/trip-planner';
import { images } from '@/config/images.config';
import { siteConfig } from '@/config/site.config';

export const metadata: Metadata = {
  title: `Plan My Journey | ${siteConfig.name}`,
  description:
    "Answer a few quick questions and we'll build three tailored Himalayan itineraries — Smart, Comfort and Signature — with transparent, real-time pricing."
};

export default function PlanMyJourneyPage() {
  return (
    <>
      <InnerHeroBanner
        eyebrow="Your journey, your way"
        title="Plan My"
        highlite="Journey"
        subtitle="Destination, dates, style, stay and transport — one guided flow, three ready-to-book itineraries."
        bgImage={images.toursHero}
      />
      <main className="bg-slate-50">
        <PlanMyJourneyWizard />
      </main>
    </>
  );
}
