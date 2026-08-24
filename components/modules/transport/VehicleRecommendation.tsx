'use client';

import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { CounterField } from '@/components/modules/search';
import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { useTransportSearch } from './TransportSearchContext';
import { vehicleLabelFromValue, type ServiceType } from '@/config/transportServiceTypes.config';
import { formatINR } from '@/lib/pricing';
import type { VehicleOption } from '@/types/transport';

export interface VehicleRecommendationProps { vehicles: VehicleOption[]; }
type TripType = 'City / Plains' | 'Mountain Route' | 'Remote Himalayan';
const TRIP_TYPES: TripType[] = ['City / Plains', 'Mountain Route', 'Remote Himalayan'];
const TRIP_TYPE_PARAM: Record<TripType, string> = { 'City / Plains': 'city', 'Mountain Route': 'mountain', 'Remote Himalayan': 'remote-himalayan' };

/** Real TransportVehicle.category values only, scoped to whichever service is
 *  currently active in TransportSearchContext — never a category belonging to a
 *  different service (e.g. never a Tempo Traveller while Self-Drive is selected).
 *  Cab with Driver/Local Taxi keeps the exact rule set this always had; the other
 *  services each get their own rule set drawn only from that service's own real
 *  categories (config/transportServiceTypes.config.ts's VEHICLE_TYPES_BY_SERVICE_TYPE). */
function recommendCategories(service: ServiceType, travellers: number, tripType: TripType): string[] {
  switch (service) {
    case 'Group Transport':
      return travellers > 14 ? ['Coach', 'Tempo Traveller'] : ['Tempo Traveller', 'Coach'];
    case '4x4 / Mountain Vehicle':
      return ['4x4'];
    case 'Self-Drive Car':
      if (travellers > 6) return ['Premium SUV', 'SUV'];
      if (tripType === 'Remote Himalayan') return ['4x4', 'SUV'];
      if (tripType === 'Mountain Route') return ['SUV', 'Compact SUV'];
      return travellers <= 4 ? ['Hatchback', 'Sedan'] : ['SUV', 'Sedan'];
    case 'Bike / Motorcycle':
      if (tripType === 'Remote Himalayan') return ['Adventure / ADV', 'Touring'];
      if (tripType === 'Mountain Route') return ['Adventure / ADV', 'Roadster'];
      return ['Cruiser', 'Roadster'];
    default: // 'Cab with Driver' / 'Local Taxi' — unchanged from before this fix
      if (travellers > 14) return ['Coach', 'Tempo Traveller'];
      if (travellers > 6) return ['Tempo Traveller', 'Coach'];
      if (tripType === 'Remote Himalayan') return ['4x4', 'SUV'];
      if (tripType === 'Mountain Route') return ['SUV', 'Premium'];
      return travellers <= 4 ? ['Comfort', 'SUV'] : ['SUV', 'Comfort'];
  }
}

export default function VehicleRecommendation({ vehicles }: VehicleRecommendationProps) {
  const [travellers, setTravellers] = useState(2);
  const [tripType, setTripType] = useState<TripType>('Mountain Route');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { fields, selectVehicleFit } = useTransportSearch();
  const { openBookingRequest } = useBookingRequest();
  const service = fields.service;
  // Local Mobility has no generic vehicle-category catalog — it's destination-specific
  // enquiry, so this widget hands off to a travel expert instead of guessing a vehicle.
  const isLocalService = service === 'Local Mobility';

  const rankedCategories = useMemo(() => recommendCategories(service, travellers, tripType), [service, travellers, tripType]);
  const recommendedCategory = (selectedCategory && rankedCategories.includes(selectedCategory) ? selectedCategory : rankedCategories[0]) ?? '';
  const alternativeCategory = rankedCategories.find((category) => category !== recommendedCategory) ?? null;
  const recommendedLabel = recommendedCategory ? vehicleLabelFromValue(service, recommendedCategory) : '';
  const alternativeLabel = alternativeCategory ? vehicleLabelFromValue(service, alternativeCategory) : null;
  const recommended = vehicles.find((vehicle) => vehicle.category === recommendedCategory && vehicle.serviceType === service);

  function updateTravellers(next: number) { setSelectedCategory(null); setTravellers(next); }
  function updateTripType(next: TripType) { setSelectedCategory(null); setTripType(next); }

  // Routes through the same canonical TransportSearchContext every discovery card
  // already uses — no separate URL-building/results system. The active service never
  // changes here (it already matches `fields.service`), only its `vehicle` field.
  function handleSeeMatchingVehicles() {
    if (!recommendedCategory) return;
    selectVehicleFit(service, recommendedLabel);
    // The matching section only becomes `#transport-results` once the server-rendered
    // page catches up with the URL change above — a short, generous delay rather than
    // an exact sync, same tradeoff already accepted elsewhere in this app for
    // dev-server/RSC latency.
    setTimeout(() => {
      document.getElementById('transport-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
  }

  function handleTalkToExpert() {
    openBookingRequest({
      type: 'transport',
      itemName: 'Talk to a travel expert',
      travelers: String(travellers),
      details: {
        serviceType: service,
        vehicleCategory: recommendedCategory || undefined,
        tripType: TRIP_TYPE_PARAM[tripType],
        source: 'transport-quick-recommendation-expert'
      }
    });
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

        {isLocalService ? (
          <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-apex-200 bg-apex-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-apex-600">Local Transport</p>
              <p className="mt-1 text-lg font-bold text-slate-900">Arranged for your destination</p>
              <p className="mt-1 text-sm text-slate-600">
                Local Transport is destination-specific — tell us where you&apos;re headed and we&apos;ll confirm real options directly.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto">
              <button
                type="button"
                onClick={handleTalkToExpert}
                className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
              >
                Talk to Travel Expert
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-apex-200 bg-apex-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-apex-600">Recommended for your trip</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{recommended?.name ?? recommendedLabel}</p>
              <p className="mt-1 text-sm text-slate-600">Suitable for {travellers} traveller{travellers === 1 ? '' : 's'} on this journey.</p>
              {alternativeLabel ? (
                <p className="mt-1 text-sm text-slate-500">
                  Alternative:{' '}
                  <button type="button" onClick={() => setSelectedCategory(alternativeCategory)} className="font-semibold text-slate-700 underline-offset-2 hover:underline">
                    {alternativeLabel}
                  </button>
                </p>
              ) : null}
              {recommended?.estimatedFromPrice ? (
                <>
                  <p className="mt-1 text-3xl font-extrabold text-slate-900">{formatINR(recommended.estimatedFromPrice)}</p>
                  {recommended.priceNote ? <p className="text-xs text-slate-500">{recommended.priceNote}</p> : null}
                </>
              ) : null}
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto">
              <button
                type="button"
                onClick={handleSeeMatchingVehicles}
                className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
              >
                See Matching Vehicles
              </button>
              <button
                type="button"
                onClick={handleTalkToExpert}
                className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full border border-apex-400 bg-white px-5 py-3 text-sm font-semibold text-apex-600 transition-all duration-300 ease-in-out hover:bg-apex-50"
              >
                Talk to Travel Expert
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
