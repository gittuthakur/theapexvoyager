'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Bike, Car, KeyRound, MountainSnow, Users2, X, type LucideIcon } from 'lucide-react';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/pricing';
import { TRIP_TYPE_OPTIONS, type ServiceType } from '@/config/transportServiceTypes.config';
import TransportCard from './TransportCard';
import NoInventoryActions from './NoInventoryActions';
import type { TransportRoute, VehicleOption } from '@/types/transport';

const SERVICE_ICONS: Record<ServiceType, LucideIcon> = {
  'Cab with Driver': Car,
  'Local Taxi': Car,
  'Group Transport': Users2,
  '4x4 / Mountain Vehicle': MountainSnow,
  'Self-Drive Car': KeyRound,
  'Bike / Motorcycle': Bike,
  'Local Mobility': Car
};

const SERVICE_LABELS: Record<ServiceType, string> = {
  'Cab with Driver': 'Cab with Driver',
  'Local Taxi': 'Local Taxi',
  'Group Transport': 'Tempo / Group',
  '4x4 / Mountain Vehicle': '4x4',
  'Self-Drive Car': 'Self Drive',
  'Bike / Motorcycle': 'Bike Rental',
  'Local Mobility': 'Local Transport'
};

// "Local" doesn't describe an inter-city route trip — the other 3 (brief §2) do.
const ROUTE_TRIP_TYPES = TRIP_TYPE_OPTIONS.filter((option) => option !== 'Local');

export interface RouteBookingTripContext {
  pickup: string;
  destination: string;
  date: string;
  returnDate: string;
  travellers: string;
  tripType: string;
  service: ServiceType;
  customRoute: boolean;
  routeSlug: string;
}

export interface RouteBookingPopupProps {
  origin: string;
  destination: string;
  /** Present for a curated route — drives the allowed ride styles/vehicle categories
   *  and the "known route info" summary. Absent for a custom (uncatalogued) route. */
  routeMeta?: TransportRoute;
  allowedServices: ServiceType[];
  /** The already-fetched, per-service vehicle catalogs (no second inventory fetch). */
  vehiclesByService: Partial<Record<ServiceType, VehicleOption[]>>;
  defaultTravellers?: number;
  journeyContext?: { from?: string; journeySlug?: string };
  onClose: () => void;
  /** Closes this popup before opening TransportDetail — see RouteExplorer, which owns
   *  that transition to avoid modal-on-modal. */
  onViewDetails: (vehicle: VehicleOption, trip: RouteBookingTripContext) => void;
  onRequestVehicle: (vehicle: VehicleOption, trip: RouteBookingTripContext) => void;
  onRequestCustomTransport: (trip: RouteBookingTripContext) => void;
}

type Step = 'trip' | 'service' | 'vehicles';

function slugifyRoutePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * The "Himalayan Routes We Cover" / "View All Routes" booking entry point — an
 * in-place, end-to-end Trip Details → Ride Style → Vehicle flow opened by a route
 * card click instead of scrolling/navigating to a catalog section. Vehicle
 * matching/filtering reuses the same fetched catalogs every other section already
 * has (no second inventory engine); "Select Vehicle"/"Request Custom Transport" hand
 * off to the caller, which reuses the existing BookingRequestModal (customer details
 * → review → submit → MongoDB → TAP reference → WhatsApp) — this popup itself never
 * talks to the booking API directly.
 */
export default function RouteBookingPopup({
  origin,
  destination,
  routeMeta,
  allowedServices,
  vehiclesByService,
  defaultTravellers,
  journeyContext,
  onClose,
  onViewDetails,
  onRequestVehicle,
  onRequestCustomTransport
}: RouteBookingPopupProps) {
  const [step, setStep] = useState<Step>('trip');
  const [pickup, setPickup] = useState(origin);
  const [drop, setDrop] = useState(destination);
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [travellers, setTravellers] = useState(String(defaultTravellers ?? 2));
  const [tripType, setTripType] = useState<string>(ROUTE_TRIP_TYPES[0]);
  const [service, setService] = useState<ServiceType | null>(null);

  const routeSlug = `${slugifyRoutePart(origin)}-to-${slugifyRoutePart(destination)}`;
  const showReturnDate = tripType !== 'One Way';

  function buildTripContext(activeService: ServiceType): RouteBookingTripContext {
    return {
      pickup,
      destination: drop,
      date,
      returnDate: showReturnDate ? returnDate : '',
      travellers,
      tripType,
      service: activeService,
      customRoute: !routeMeta,
      routeSlug
    };
  }

  const matchingVehicles = useMemo(() => {
    if (!service) return [];
    const pool = vehiclesByService[service] ?? [];
    // Only intersect with the route's real supported categories when we actually have
    // one configured — an uncatalogued (custom) route has nothing to intersect against.
    if (!routeMeta || routeMeta.supportedVehicleCategories.length === 0) return pool;
    return pool.filter((vehicle) => vehicle.category && routeMeta.supportedVehicleCategories.includes(vehicle.category));
  }, [service, vehiclesByService, routeMeta]);

  function handleContinueFromTrip() {
    if (!pickup.trim() || !drop.trim() || !date) return;
    setStep('service');
  }

  function handleSelectService(nextService: ServiceType) {
    setService(nextService);
    setStep('vehicles');
  }

  return (
    <FloatingOverlay
      open
      onClose={onClose}
      labelledBy="route-booking-popup-title"
      panelClassName="max-w-4xl rounded-3xl pointer-events-auto p-6 sm:p-8 bg-white shadow-glow max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-apex-600">Plan Your Route</p>
          <h2 id="route-booking-popup-title" className="mt-1 text-2xl font-bold text-slate-900">
            {origin} → {destination}
          </h2>
          {routeMeta ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              {routeMeta.estimatedDuration ? <span className="rounded-full bg-slate-200 px-3 py-1">{routeMeta.estimatedDuration}</span> : null}
              {routeMeta.seasonalStatus ? <span className="rounded-full bg-slate-200 px-3 py-1">{routeMeta.seasonalStatus}</span> : null}
              {routeMeta.routeType ? <span className="rounded-full bg-slate-200 px-3 py-1">{routeMeta.routeType}</span> : null}
            </div>
          ) : null}
          {routeMeta?.supportedVehicleCategories.length ? (
            <p className="mt-2 text-sm text-slate-600">Supported vehicles: {routeMeta.supportedVehicleCategories.join(', ')}</p>
          ) : null}
          {routeMeta?.startingFare ? (
            <p className="mt-2 text-sm text-slate-600">
              Starting from <span className="font-bold text-apex-500">{formatINR(routeMeta.startingFare)}</span>
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="cursor-hover rounded-full p-1 text-slate-500 transition-colors duration-300 ease-in-out hover:text-slate-900"
        >
          <X size={20} />
        </button>
      </div>

      {step === 'trip' ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="route-popup-pickup" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                From
              </label>
              <input
                id="route-popup-pickup"
                value={pickup}
                onChange={(event) => setPickup(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
              />
            </div>
            <div>
              <label htmlFor="route-popup-drop" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                To
              </label>
              <input
                id="route-popup-drop"
                value={drop}
                onChange={(event) => setDrop(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trip Type</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ROUTE_TRIP_TYPES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={tripType === option}
                  onClick={() => setTripType(option)}
                  className={cn(
                    'cursor-hover rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 ease-in-out',
                    tripType === option ? 'border-apex-500 bg-apex-500 text-white' : 'border-slate-200 text-slate-700 hover:border-apex-300'
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="route-popup-date" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Travel Date
              </label>
              <input
                id="route-popup-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
              />
            </div>
            {showReturnDate ? (
              <div>
                <label htmlFor="route-popup-return-date" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Return Date
                </label>
                <input
                  id="route-popup-return-date"
                  type="date"
                  value={returnDate}
                  onChange={(event) => setReturnDate(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
                />
              </div>
            ) : null}
            <div>
              <label htmlFor="route-popup-travellers" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Travellers
              </label>
              <input
                id="route-popup-travellers"
                type="number"
                min={1}
                value={travellers}
                onChange={(event) => setTravellers(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinueFromTrip}
            disabled={!pickup.trim() || !drop.trim() || !date}
            className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue <ArrowRight size={18} />
          </button>
        </div>
      ) : null}

      {step === 'service' ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setStep('trip')}
            className="cursor-hover inline-flex items-center gap-1 text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-700"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Choose Your Ride Style</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {allowedServices.map((entry) => {
              const Icon = SERVICE_ICONS[entry];
              return (
                <button
                  key={entry}
                  type="button"
                  onClick={() => handleSelectService(entry)}
                  className="cursor-hover flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow transition hover:-translate-y-0.5 hover:border-apex-300 hover:shadow-lg"
                >
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-apex-100 text-apex-600">
                    <Icon size={22} />
                  </span>
                  <span className="text-base font-semibold text-slate-900">{SERVICE_LABELS[entry]}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {step === 'vehicles' && service ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setStep('service')}
            className="cursor-hover inline-flex items-center gap-1 text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-700"
          >
            <ArrowLeft size={16} /> Back
          </button>

          {matchingVehicles.length > 0 ? (
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {matchingVehicles.map((vehicle) => (
                <TransportCard
                  key={vehicle.slug ?? vehicle.id}
                  vehicle={vehicle}
                  pickup={pickup}
                  destination={drop}
                  date={date}
                  travellers={travellers}
                  returnDate={showReturnDate ? returnDate : undefined}
                  journeyContext={journeyContext}
                  ctaLabel="Select Vehicle"
                  onViewDetails={(selected) => onViewDetails(selected, buildTripContext(service))}
                  onRequestVehicle={(selected) => onRequestVehicle(selected, buildTripContext(service))}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-10 text-center">
              <p className="text-lg font-semibold text-slate-900">We couldn&apos;t find a listed vehicle for this route yet.</p>
              <p className="mt-3 text-slate-600">Tell us what you need and our travel experts will arrange it for you.</p>
              <NoInventoryActions
                onRequestCustomVehicle={() => onRequestCustomTransport(buildTripContext(service))}
                requestLabel="Request Custom Transport"
              />
            </div>
          )}
        </div>
      ) : null}
    </FloatingOverlay>
  );
}
