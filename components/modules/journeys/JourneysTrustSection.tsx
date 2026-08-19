'use client';

import { Gem, Headphones, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import TrustBadges from '@/components/modules/TrustBadges';

// Icon components (functions) can't cross the Server→Client boundary as props — so this
// list is defined and consumed here, inside the client boundary, rather than being built
// in the (server) page — see the same pattern in destinations/WhyTheApexSection.tsx.
const JOURNEYS_TRUST_BADGES = [
  { icon: MapPin, title: 'Local Himalayan Expertise', description: 'On-ground knowledge across every region' },
  { icon: ShieldCheck, title: 'Verified Stays & Experiences', description: 'Every partner is checked by our team' },
  { icon: Sparkles, title: 'Personalized Journeys', description: 'Configured to your dates and preferences' },
  { icon: Gem, title: 'Transparent Travel Planning', description: 'Clear pricing, never a hidden surprise' },
  { icon: Headphones, title: '24/7 Travel Support', description: "We're here whenever you need us" }
];

export default function JourneysTrustSection() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-16 lg:py-20">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">Why Travel With Us</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Why Travel With The Apex Voyager?</h2>
      </div>
      <TrustBadges className="mt-8" items={JOURNEYS_TRUST_BADGES} />
    </section>
  );
}
