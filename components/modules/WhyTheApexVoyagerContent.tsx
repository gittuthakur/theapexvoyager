import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import InnerHeroBanner from '@/components/modules/InnerHeroBanner';
import WhyTheApexSection from '@/components/modules/destinations/WhyTheApexSection';
import { images } from '@/config/images.config';

export default function WhyTheApexVoyagerContent() {
  return (
    <>
      <InnerHeroBanner
        eyebrow="Why The Apex Voyager"
        title="Built for the way"
        highlite="you actually want to travel"
        subtitle="No cookie-cutter itineraries — every journey is planned with local expertise, transparent pricing, and support that stays with you from booking to the last mile home."
        bgImage={images.hero}
      />

      <WhyTheApexSection />

      <section className="pb-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-6 rounded-3xl border border-apex-200 bg-gradient-to-r from-apex-50 via-slate-50 to-slate-50 px-6 py-8 sm:p-10 md:flex-row">
          <div className="max-w-xl space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-900">Ready to plan your journey?</h2>
            <p className="text-sm text-slate-600">Tell us where you want to go and we&apos;ll take care of the rest.</p>
          </div>
          <Link
            href="/plan-my-journey"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-apex-500 px-8 py-3.5 font-semibold text-white shadow-lg shadow-apex-500/25 transition-all hover:bg-apex-400"
          >
            Plan My Journey <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}
