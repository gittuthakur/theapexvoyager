import { BadgeCheck, Clock, Compass, ShieldCheck, type LucideIcon } from 'lucide-react';

interface TrustPoint {
  icon: LucideIcon;
  title: string;
  description: string;
}

const TRUST_POINTS: TrustPoint[] = [
  { icon: BadgeCheck, title: 'Verified Local Experiences', description: 'Experiences selected for quality, authenticity and reliability.' },
  { icon: Compass, title: 'Local Experts', description: 'People who know the mountains beyond the guidebook.' },
  { icon: ShieldCheck, title: 'Transparent Pricing', description: 'Know what is included before you book.' },
  { icon: Clock, title: '24/7 Travel Support', description: "We're here before, during and after your journey." }
];

export default function ExperienceTrust() {
  return (
    <section className="bg-slate-100 py-16 lg:py-20">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10 lg:px-16">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Travel With Confidence</h2>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-apex-100 text-apex-600">
                <Icon size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
