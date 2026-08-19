'use client';

import { Headphones, MapPin, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import TrustBadges from '@/components/modules/TrustBadges';

// Icon components (functions) can't cross the Server→Client boundary as props — so
// this whole badges list is defined and consumed here, inside the client boundary,
// rather than being built in the (server) page and passed into TrustBadges as `items`.
const WHY_THE_APEX_BADGES = [
  { icon: Sparkles, title: 'Curated With Care', description: 'Every destination handpicked by our team' },
  { icon: MapPin, title: 'Local Expertise', description: 'On-ground knowledge you can trust' },
  { icon: Wallet, title: 'Best Price Promise', description: "We won't be beaten on price" },
  { icon: ShieldCheck, title: 'Safe & Reliable', description: 'Vetted stays, journeys and experts' },
  { icon: Sparkles, title: 'Personalized Trips', description: 'Built around how you like to travel' },
  { icon: Headphones, title: '24/7 Assistance', description: "We're here for the whole journey" }
];

export default function WhyTheApexSection() {
  return (
    <section className="py-14 lg:py-16">
      <section className="mx-auto max-w-[1440px] px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">Why The Apex</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Built on trust, <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">not templates</span></h2>
        </div>
        <TrustBadges items={WHY_THE_APEX_BADGES} className="mt-10 sm:grid-cols-3" />
      </section>
    </section>
  );
}
