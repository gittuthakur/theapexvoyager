'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { CounterField } from '@/components/modules/search';
import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { formatINR } from '@/lib/pricing';
import type { VehicleOption } from '@/types/transport';

export interface VehicleRecommendationProps { vehicles: VehicleOption[]; }
type TripType = 'City / Plains' | 'Mountain Route' | 'Remote Himalayan';
const TRIP_TYPES: TripType[] = ['City / Plains', 'Mountain Route', 'Remote Himalayan'];
const CATEGORY_SERVICE_SLUG = { Comfort: 'cab', SUV: 'cab', Premium: 'cab', 'Tempo Traveller': 'group', Coach: 'group', '4x4': '4x4' } as const;
type RecommendedCategory = keyof typeof CATEGORY_SERVICE_SLUG;
const CATEGORY_LABEL: Record<RecommendedCategory, string> = { Comfort: 'Sedan', SUV: 'SUV', Premium: 'Premium SUV', 'Tempo Traveller': 'Tempo Traveller', Coach: 'Coach / Mini Bus', '4x4': '4x4 Mountain Vehicle' };
const TRIP_TYPE_PARAM: Record<TripType, string> = { 'City / Plains': 'city', 'Mountain Route': 'mountain', 'Remote Himalayan': 'remote-himalayan' };

/** Rule output uses real TransportVehicle.category values, whether or not inventory exists. */
function recommendCategories(travellers: number, tripType: TripType): RecommendedCategory[] {
  if (travellers > 14) return ['Coach', 'Tempo Traveller'];
  if (travellers > 6) return ['Tempo Traveller', 'Coach'];
  if (tripType === 'Remote Himalayan') return ['4x4', 'SUV'];
  if (tripType === 'Mountain Route') return ['SUV', 'Premium'];
  return travellers <= 4 ? ['Comfort', 'SUV'] : ['SUV', 'Comfort'];
}

export default function VehicleRecommendation({ vehicles }: VehicleRecommendationProps) {
  const [travellers, setTravellers] = useState(2);
  const [tripType, setTripType] = useState<TripType>('Mountain Route');
  const [selectedCategory, setSelectedCategory] = useState<RecommendedCategory | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openBookingRequest } = useBookingRequest();
  const rankedCategories = useMemo(() => recommendCategories(travellers, tripType), [travellers, tripType]);
  const recommendedCategory = selectedCategory && rankedCategories.includes(selectedCategory) ? selectedCategory : rankedCategories[0];
  const alternativeCategory = rankedCategories.find((category) => category !== recommendedCategory) ?? null;
  const recommended = vehicles.find((vehicle) => vehicle.category === recommendedCategory);

  function updateTravellers(next: number) { setSelectedCategory(null); setTravellers(next); }
  function updateTripType(next: TripType) { setSelectedCategory(null); setTripType(next); }

  function handleSeeMatchingVehicles() {
    if (!recommendedCategory) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('service', CATEGORY_SERVICE_SLUG[recommendedCategory]);
    params.set('vehicle', recommendedCategory);
    params.set('travellers', String(travellers));
    params.set('tripType', TRIP_TYPE_PARAM[tripType]);
    ['driveMode', 'tripDuration', 'returnTime', 'returnLocation', 'quantity'].forEach((key) => params.delete(key));
    router.push(`/transport?${params.toString()}#transport-results`, { scroll: true });
  }

  function handleTalkToExpert() {
    openBookingRequest({ type: 'transport', itemName: 'Talk to a travel expert', travelers: String(travellers), details: { serviceType: CATEGORY_SERVICE_SLUG[recommendedCategory], vehicleCategory: recommendedCategory, tripType: TRIP_TYPE_PARAM[tripType], source: 'transport-quick-recommendation-expert' } });
  }

  return (
    <section id="vehicle-recommendation" className="mx-auto max-w-[1440px] px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.20em] text-apex-600"><Sparkles size={16} />Not sure which vehicle to choose?</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Get a quick recommendation</h2>
        <p className="mt-2 text-sm text-slate-500">Tell us about your trip and we&apos;ll suggest a suitable ride.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <CounterField label="Travellers" value={travellers} onChange={updateTravellers} min={1} max={30} />
          <div><p className="mb-2 text-sm font-semibold text-slate-900">Trip type</p><div className="grid grid-cols-3 gap-2">
            {TRIP_TYPES.map((type) => <button key={type} type="button" onClick={() => updateTripType(type)} className={`cursor-hover rounded-lg px-3 py-3 text-xs font-semibold transition ${tripType === type ? 'bg-apex-500 text-white' : 'border border-apex-400 bg-apex-50 text-slate-900 hover:border-apex-600 hover:bg-apex-100'}`}>{type}</button>)}
          </div></div>
        </div>
        <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-apex-200 bg-apex-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-apex-600">Recommended for your trip</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{recommended?.name ?? CATEGORY_LABEL[recommendedCategory]}</p>
            <p className="mt-1 text-sm text-slate-600">Suitable for {travellers} traveller{travellers === 1 ? '' : 's'} on this journey.</p>
            {alternativeCategory ? <p className="mt-1 text-sm text-slate-500">Alternative: <button type="button" onClick={() => setSelectedCategory(alternativeCategory)} className="font-semibold text-slate-700 underline-offset-2 hover:underline">{CATEGORY_LABEL[alternativeCategory]}</button></p> : null}
            {recommended?.estimatedFromPrice ? <p className="mt-1 text-3xl font-extrabold text-slate-900">{formatINR(recommended.estimatedFromPrice)}</p> : null}
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto">
            <button type="button" onClick={handleSeeMatchingVehicles} className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400">See Matching Vehicles</button>
            <button type="button" onClick={handleTalkToExpert} className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full border border-apex-400 bg-white px-5 py-3 text-sm font-semibold text-apex-600 transition-all duration-300 ease-in-out hover:bg-apex-50">Talk to Travel Expert</button>
          </div>
        </div>
      </div>
    </section>
  );
}
