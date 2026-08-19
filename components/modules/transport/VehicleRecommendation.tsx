'use client';

import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { CounterField } from '@/components/modules/search';
import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { formatINR } from '@/lib/pricing';
import type { VehicleOption } from '@/types/transport';

export interface VehicleRecommendationProps {
  vehicles: VehicleOption[];
}

type TripType = 'City / Plains' | 'Mountain Route' | 'Remote Himalayan';

const TRIP_TYPES: TripType[] = ['City / Plains', 'Mountain Route', 'Remote Himalayan'];

/**
 * Simple rule-based scoring — not AI-powered. Kept inline (rather than in lib/transport.ts)
 * since it runs client-side against an already-fetched vehicle list and lib/transport.ts
 * pulls in server-only Mongoose code that shouldn't ship to the browser bundle.
 */
function recommendVehicle(vehicles: VehicleOption[], travellers: number, tripType: TripType): VehicleOption | null {
  const candidates = vehicles.filter((v) => v.seats >= travellers);
  if (candidates.length === 0) return null;

  const categoryPreference: Record<TripType, string[]> = {
    'City / Plains': ['Comfort', 'SUV'],
    'Mountain Route': ['SUV', 'Premium', 'Tempo Traveller'],
    'Remote Himalayan': ['SUV', 'Premium']
  };
  const preferredOrder = categoryPreference[tripType];

  const ranked = [...candidates].sort((a, b) => {
    const aRank = preferredOrder.indexOf(a.category ?? '');
    const bRank = preferredOrder.indexOf(b.category ?? '');
    const aScore = aRank === -1 ? preferredOrder.length : aRank;
    const bScore = bRank === -1 ? preferredOrder.length : bRank;
    if (aScore !== bScore) return aScore - bScore;
    return a.seats - b.seats;
  });

  return ranked[0];
}

export default function VehicleRecommendation({ vehicles }: VehicleRecommendationProps) {
  const [travellers, setTravellers] = useState(2);
  const [tripType, setTripType] = useState<TripType>('Mountain Route');
  const { openBookingRequest } = useBookingRequest();

  const recommended = useMemo(() => recommendVehicle(vehicles, travellers, tripType), [vehicles, travellers, tripType]);

  if (vehicles.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
        <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">
          <Sparkles size={16} />
          Not sure which vehicle to choose?
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Get a quick recommendation</h2>
        <p className="mt-2 text-sm text-slate-500">A simple rule-based suggestion based on your trip — not an AI recommendation.</p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <CounterField label="Travellers" value={travellers} onChange={setTravellers} min={1} max={30} />
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-900">Trip type</p>
            <div className="grid grid-cols-3 gap-2">
              {TRIP_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTripType(type)}
                  className={`cursor-hover rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                    tripType === type
                      ? 'border-apex-400 bg-apex-50 text-slate-900'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {recommended ? (
          <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-apex-200 bg-apex-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-apex-600">Recommended for your trip</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{recommended.name}</p>
              <p className="mt-1 text-sm text-slate-600">
                Ideal for {travellers} traveller{travellers === 1 ? '' : 's'} on a {tripType.toLowerCase()} journey.
              </p>
              {recommended.estimatedFromPrice ? (
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatINR(recommended.estimatedFromPrice)}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() =>
                openBookingRequest({
                  type: 'transport',
                  itemName: recommended.name,
                  travelers: `${travellers} traveller${travellers === 1 ? '' : 's'}`,
                  details: { vehicleSlug: recommended.slug ?? recommended.id, tripType, source: 'transport-recommendation' }
                })
              }
              className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
            >
              Request This Vehicle
            </button>
          </div>
        ) : (
          <p className="mt-6 text-sm text-slate-600">
            None of our standard vehicles fit that many travellers — request a custom quote and we&apos;ll arrange a suitable option.
          </p>
        )}
      </div>
    </section>
  );
}
