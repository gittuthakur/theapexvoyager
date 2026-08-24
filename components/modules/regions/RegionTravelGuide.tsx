import { Car, CloudSun, Compass, Leaf, MapPin, ShieldCheck } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import type { RegionProfile } from '@/types/regionHub';
import type { GoogleContext } from '@/types/regionHub';

export interface RegionTravelGuideProps {
  region: RegionProfile;
  googleContext: GoogleContext;
}

export default function RegionTravelGuide({ region, googleContext }: RegionTravelGuideProps) {
  const { travelGuide } = region;

  const guideEntries: Array<[typeof Compass, string, string | undefined]> = [
    [Compass, 'Best time to visit', travelGuide.bestTime],
    [Car, 'How to reach', travelGuide.howToReach],
    [CloudSun, 'Weather', travelGuide.weather],
    [MapPin, 'Local transport', travelGuide.localTransport],
    [ShieldCheck, 'Permits', travelGuide.permits],
    [Leaf, 'Responsible travel', travelGuide.responsibleTravel]
  ];
  const visibleEntries = guideEntries.filter((entry): entry is [typeof Compass, string, string] => Boolean(entry[2]));

  return (
    <section id="travel-guide" className="py-8">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-apex-500">Plan ahead</p>
      <h2 className="mt-3 text-3xl font-bold text-slate-900">{region.name} Travel Guide</h2>

      {visibleEntries.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleEntries.map(([Icon, label, value]) => (
            <div key={label} className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-6">
              <Icon className="text-apex-500" size={20} />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {googleContext.attractions.length > 0 ? (
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-slate-900">Nearby to Explore</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {googleContext.attractions.map((attraction) => (
              <div key={attraction.id} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="relative h-32 w-full bg-slate-100">
                  {attraction.photoUrl ? (
                    <SafeImage src={attraction.photoUrl} alt={attraction.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                  ) : null}
                </div>
                <p className="p-3 text-sm font-semibold text-slate-900">{attraction.name}</p>
              </div>
            ))}
          </div>
          {googleContext.attribution ? <p className="mt-2 text-xs text-slate-400">{googleContext.attribution}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
