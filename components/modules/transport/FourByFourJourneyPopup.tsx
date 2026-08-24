'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';
import { cn } from '@/lib/utils';
import { fourByFourTypeEntry, TRIP_TYPE_OPTIONS, type FourByFourVariant } from '@/config/transportServiceTypes.config';
import { useTransportSearch } from './TransportSearchContext';
import TransportCard from './TransportCard';
import NoInventoryActions from './NoInventoryActions';
import type { VehicleOption } from '@/types/transport';

// "Local" doesn't describe a chauffeur-driven mountain journey — same exclusion
// RouteBookingPopup already applies for its own Trip Type selector.
const JOURNEY_TRIP_TYPES = TRIP_TYPE_OPTIONS.filter((option) => option !== 'Local');

const TRANSMISSION_OPTIONS = ['Any', 'Manual', 'Automatic'] as const;
const GROUP_TYPE_OPTIONS = ['Private Expedition', 'Group Expedition / Open to Group'] as const;
const PACE_OPTIONS = ['Relaxed', 'Standard', 'Fast-Paced'] as const;

const PROGRESS_STEPS = ['Journey', 'Requirements', 'Vehicle', 'Your Details', 'Review'] as const;

type Step = 'journey' | 'requirements' | 'vehicle';

export interface FourByFourTripContext {
  variant: FourByFourVariant;
  pickup: string;
  /** Drop location (With Driver) / return location (Self-Drive) / destination-region
   *  (Expedition) — always this one field, labeled per variant in the UI. */
  destination: string;
  startDate: string;
  returnDate: string;
  /** With Driver only — '' for the other two variants. */
  tripType: string;
  travellers: string;
  adults: number;
  children: number;
  /** Self-Drive only — '' for the other two variants. */
  transmission: string;
  pickupTime: string;
  luggage: string;
  stops: string;
  specialRequirements: string;
  /** Expedition only — a formatted summary of group type / duration / preferred
   *  route / pace / optional planning requests. Never sent as a confirmed inclusion,
   *  only as the customer's stated preference for the team to follow up on. */
  expeditionPreferences: string;
}

export interface FourByFourJourneyPopupProps {
  variant: FourByFourVariant;
  /** The full, real, unfiltered '4x4 / Mountain Vehicle' catalog — filtered in here by
   *  `withDriver`/`mountainSuitable`/`remoteRouteSuitable` per variant, never a second
   *  fetch and never fabricated. */
  allFourByFourVehicles: VehicleOption[];
  journeyContext?: { from?: string; journeySlug?: string };
  onClose: () => void;
  /** Closes this popup before/while opening TransportDetail — see FourByFourVehicles,
   *  which owns that transition to avoid modal-on-modal. */
  onViewDetails: (vehicle: VehicleOption, trip: FourByFourTripContext) => void;
  onRequestVehicle: (vehicle: VehicleOption, trip: FourByFourTripContext) => void;
  onRequestCustom: (trip: FourByFourTripContext) => void;
}

/**
 * "4x4 Himalayan Vehicles" guided journey popup — one shared framework for all 3
 * discovery cards (With Driver / Self-Drive / Expeditions), adapted per variant.
 * Handles only Journey → Requirements → Vehicle in-place; "Select Vehicle"/"Request a
 * Custom 4x4" hand off to the caller, which reuses the existing BookingRequestModal
 * (Your Details → Review → submit → MongoDB → TAP reference → WhatsApp) — this popup
 * never talks to the booking API directly, and never creates a second search/booking
 * architecture.
 */
export default function FourByFourJourneyPopup({
  variant,
  allFourByFourVehicles,
  journeyContext,
  onClose,
  onViewDetails,
  onRequestVehicle,
  onRequestCustom
}: FourByFourJourneyPopupProps) {
  const { fields } = useTransportSearch();
  const entry = fourByFourTypeEntry(variant)!;

  const [step, setStep] = useState<Step>('journey');

  const [pickup, setPickup] = useState(fields.pickup);
  const [destination, setDestination] = useState(
    variant === 'self-drive' ? (fields.returnAtDifferentLocation ? fields.returnLocation : fields.pickup) : fields.drop
  );
  const [startDate, setStartDate] = useState(fields.date);
  const [returnDate, setReturnDate] = useState(fields.returnDate);
  const [tripType, setTripType] = useState<string>(JOURNEY_TRIP_TYPES[0]);
  const [approxDuration, setApproxDuration] = useState('');
  const [groupType, setGroupType] = useState<string>(GROUP_TYPE_OPTIONS[0]);
  const [adults, setAdults] = useState(Math.max(1, fields.passengers || 2));
  const [children, setChildren] = useState(0);

  const [pickupTime, setPickupTime] = useState('');
  const [luggage, setLuggage] = useState('');
  const [stops, setStops] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [transmission, setTransmission] = useState<string>(TRANSMISSION_OPTIONS[0]);
  const [licenceConfirmed, setLicenceConfirmed] = useState(false);
  const [preferredRoute, setPreferredRoute] = useState('');
  const [pace, setPace] = useState<string>(PACE_OPTIONS[1]);
  const [stayAssistance, setStayAssistance] = useState(false);
  const [localExperiences, setLocalExperiences] = useState(false);
  const [tripPlanningSupport, setTripPlanningSupport] = useState(false);

  const showReturnDate = variant !== 'with-driver' || tripType !== 'One Way';

  const matchingVehicles = useMemo(() => {
    if (variant === 'with-driver') return allFourByFourVehicles.filter((v) => v.withDriver === true);
    if (variant === 'self-drive') return allFourByFourVehicles.filter((v) => v.withDriver === false);
    return allFourByFourVehicles.filter((v) => v.withDriver === true && (v.mountainSuitable || v.remoteRouteSuitable));
  }, [variant, allFourByFourVehicles]);

  // Only real, configured partner policy — never fabricated. Empty today (no seeded
  // self-drive 4x4 has these set), so this block simply doesn't render until one does.
  const policyVehicles = useMemo(
    () => matchingVehicles.filter((v) => v.minimumAge || v.drivingLicenceRequired),
    [matchingVehicles]
  );
  const requiresLicenceConfirmation = variant === 'self-drive' && policyVehicles.length > 0;

  const totalTravellers = adults + children;

  function buildTripContext(): FourByFourTripContext {
    const expeditionPreferences =
      variant === 'expedition'
        ? [
            `Group type: ${groupType}`,
            approxDuration ? `Approx duration: ${approxDuration}` : '',
            preferredRoute ? `Preferred route: ${preferredRoute}` : '',
            `Pace: ${pace}`,
            [stayAssistance && 'Stay assistance', localExperiences && 'Local experiences', tripPlanningSupport && 'Trip planning support']
              .filter(Boolean)
              .join(', ') || ''
          ]
            .filter(Boolean)
            .join('; ')
        : '';

    return {
      variant,
      pickup: pickup.trim(),
      destination: destination.trim(),
      startDate,
      returnDate: showReturnDate ? returnDate : '',
      tripType: variant === 'with-driver' ? tripType : '',
      travellers: String(totalTravellers),
      adults,
      children,
      transmission: variant === 'self-drive' ? transmission : '',
      pickupTime,
      luggage,
      stops,
      specialRequirements,
      expeditionPreferences
    };
  }

  function canContinueFromJourney(): boolean {
    if (!startDate) return false;
    if (variant === 'with-driver') return Boolean(pickup.trim() && destination.trim());
    if (variant === 'self-drive') return Boolean(pickup.trim());
    return Boolean(destination.trim());
  }

  function canContinueFromRequirements(): boolean {
    return !requiresLicenceConfirmation || licenceConfirmed;
  }

  const journeyFieldLabels =
    variant === 'with-driver'
      ? { from: 'From', to: 'To' }
      : variant === 'self-drive'
        ? { from: 'Pickup Location', to: 'Drop / Return Location' }
        : { from: 'Starting Point', to: 'Destination / Region / Route' };

  return (
    <FloatingOverlay
      open
      onClose={onClose}
      labelledBy="fourbyfour-journey-popup-title"
      panelClassName="max-w-4xl rounded-3xl pointer-events-auto p-6 sm:p-8 bg-white shadow-glow overflow-y-auto"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-apex-600">{entry.label}</p>
          <h2 id="fourbyfour-journey-popup-title" className="mt-1 text-2xl font-bold text-slate-900">
            {entry.popupTitle}
          </h2>
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

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
        {PROGRESS_STEPS.map((label, index) => {
          const stepIndex = step === 'journey' ? 0 : step === 'requirements' ? 1 : 2;
          const isCurrent = index === stepIndex;
          const isDone = index < stepIndex;
          return (
            <span
              key={label}
              className={cn(
                'rounded-full px-3 py-1',
                isCurrent
                  ? 'bg-apex-500 text-white'
                  : isDone
                    ? 'bg-apex-100 text-apex-600'
                    : 'bg-slate-100 text-slate-400'
              )}
            >
              {index + 1} {label}
            </span>
          );
        })}
      </div>

      {step === 'journey' ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fbf-pickup" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {journeyFieldLabels.from}
              </label>
              <input
                id="fbf-pickup"
                value={pickup}
                onChange={(event) => setPickup(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
              />
            </div>
            <div>
              <label htmlFor="fbf-destination" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {journeyFieldLabels.to}
                {variant === 'self-drive' ? ' (optional — same as pickup if left blank)' : ''}
              </label>
              <input
                id="fbf-destination"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
              />
            </div>
          </div>

          {variant === 'with-driver' ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trip Type</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {JOURNEY_TRIP_TYPES.map((option) => (
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
          ) : null}

          {variant === 'expedition' ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expedition Type</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {GROUP_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={groupType === option}
                    onClick={() => setGroupType(option)}
                    className={cn(
                      'cursor-hover rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 ease-in-out',
                      groupType === option ? 'border-apex-500 bg-apex-500 text-white' : 'border-slate-200 text-slate-700 hover:border-apex-300'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="fbf-start-date" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Start Date
              </label>
              <input
                id="fbf-start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
              />
            </div>
            {showReturnDate ? (
              <div>
                <label htmlFor="fbf-return-date" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Return Date
                </label>
                <input
                  id="fbf-return-date"
                  type="date"
                  value={returnDate}
                  onChange={(event) => setReturnDate(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
                />
              </div>
            ) : null}
            {variant === 'expedition' ? (
              <div>
                <label htmlFor="fbf-duration" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Approx Duration
                </label>
                <input
                  id="fbf-duration"
                  placeholder="e.g. 6 days"
                  value={approxDuration}
                  onChange={(event) => setApproxDuration(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fbf-adults" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Adults
              </label>
              <input
                id="fbf-adults"
                type="number"
                min={1}
                value={adults}
                onChange={(event) => setAdults(Math.max(1, Number(event.target.value) || 1))}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
              />
            </div>
            <div>
              <label htmlFor="fbf-children" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Children
              </label>
              <input
                id="fbf-children"
                type="number"
                min={0}
                value={children}
                onChange={(event) => setChildren(Math.max(0, Number(event.target.value) || 0))}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">Total travellers: {totalTravellers}</p>

          <button
            type="button"
            onClick={() => setStep('requirements')}
            disabled={!canContinueFromJourney()}
            className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue <ArrowRight size={18} />
          </button>
        </div>
      ) : null}

      {step === 'requirements' ? (
        <div className="mt-6 space-y-5">
          <button
            type="button"
            onClick={() => setStep('journey')}
            className="cursor-hover inline-flex items-center gap-1 text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-700"
          >
            <ArrowLeft size={16} /> Back
          </button>

          {variant === 'with-driver' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fbf-pickup-time" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Pickup Time (optional)
                </label>
                <input
                  id="fbf-pickup-time"
                  type="time"
                  value={pickupTime}
                  onChange={(event) => setPickupTime(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
                />
              </div>
              <div>
                <label htmlFor="fbf-stops" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stops / Via Locations (optional)
                </label>
                <input
                  id="fbf-stops"
                  value={stops}
                  onChange={(event) => setStops(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
                />
              </div>
            </div>
          ) : null}

          {variant === 'self-drive' ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transmission Preference</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {TRANSMISSION_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={transmission === option}
                    onClick={() => setTransmission(option)}
                    className={cn(
                      'cursor-hover rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 ease-in-out',
                      transmission === option ? 'border-apex-500 bg-apex-500 text-white' : 'border-slate-200 text-slate-700 hover:border-apex-300'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {variant === 'expedition' ? (
            <>
              <div>
                <label htmlFor="fbf-preferred-route" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Preferred Route / Places to Cover (optional)
                </label>
                <input
                  id="fbf-preferred-route"
                  value={preferredRoute}
                  onChange={(event) => setPreferredRoute(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trip Pace</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PACE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={pace === option}
                      onClick={() => setPace(option)}
                      className={cn(
                        'cursor-hover rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 ease-in-out',
                        pace === option ? 'border-apex-500 bg-apex-500 text-white' : 'border-slate-200 text-slate-700 hover:border-apex-300'
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Optional planning requests <span className="font-normal text-slate-400">(requests only — not confirmed inclusions)</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-700">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={stayAssistance} onChange={(event) => setStayAssistance(event.target.checked)} />
                    Stay assistance
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={localExperiences} onChange={(event) => setLocalExperiences(event.target.checked)} />
                    Local experiences
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={tripPlanningSupport} onChange={(event) => setTripPlanningSupport(event.target.checked)} />
                    Trip planning support
                  </label>
                </div>
              </div>
            </>
          ) : null}

          {variant !== 'expedition' ? (
            <div>
              <label htmlFor="fbf-luggage" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Luggage (optional)
              </label>
              <input
                id="fbf-luggage"
                placeholder="e.g. 2 large bags"
                value={luggage}
                onChange={(event) => setLuggage(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
              />
            </div>
          ) : null}

          {requiresLicenceConfirmation ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Driver requirements for this rental</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {policyVehicles.map((v) => (
                  <li key={v.slug ?? v.id}>
                    {v.name}: {v.minimumAge ? `Minimum age ${v.minimumAge} years` : ''}
                    {v.minimumAge && v.drivingLicenceRequired ? ' · ' : ''}
                    {v.drivingLicenceRequired ?? ''}
                  </li>
                ))}
              </ul>
              <label className="mt-3 inline-flex items-center gap-2">
                <input type="checkbox" checked={licenceConfirmed} onChange={(event) => setLicenceConfirmed(event.target.checked)} />
                I confirm I meet the driver age and licence requirements above.
              </label>
            </div>
          ) : null}

          <div>
            <label htmlFor="fbf-notes" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {variant === 'with-driver' ? 'Tell us anything else about your trip (optional)' : 'Special Requirements (optional)'}
            </label>
            <textarea
              id="fbf-notes"
              rows={3}
              value={specialRequirements}
              onChange={(event) => setSpecialRequirements(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-apex-400"
            />
          </div>

          <button
            type="button"
            onClick={() => setStep('vehicle')}
            disabled={!canContinueFromRequirements()}
            className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue <ArrowRight size={18} />
          </button>
        </div>
      ) : null}

      {step === 'vehicle' ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setStep('requirements')}
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
                  destination={destination}
                  date={startDate}
                  travellers={String(totalTravellers)}
                  returnDate={showReturnDate ? returnDate : undefined}
                  driveMode={variant === 'with-driver' ? 'With Driver' : variant === 'self-drive' ? 'Self Drive' : undefined}
                  journeyContext={journeyContext}
                  ctaLabel="Select Vehicle"
                  onViewDetails={(selected) => onViewDetails(selected, buildTripContext())}
                  onRequestVehicle={(selected) => onRequestVehicle(selected, buildTripContext())}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-10 text-center">
              <p className="text-lg font-semibold text-slate-900">{entry.emptyStateMessage}</p>
              <p className="mt-3 text-slate-600">Tell us what you need and our travel experts will arrange it for you.</p>
              <NoInventoryActions onRequestCustomVehicle={() => onRequestCustom(buildTripContext())} requestLabel={entry.requestLabel} />
            </div>
          )}
        </div>
      ) : null}
    </FloatingOverlay>
  );
}
