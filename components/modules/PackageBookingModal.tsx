'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ArrowRight, Check, Minus, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { calculateBookingPrice, formatINR, type PriceBreakdown } from '@/lib/pricing';
import { postJSON } from '@/lib/api';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';
import type { TravelPackage } from '@/types/package';

export interface PackageBookingModalProps {
  pkg: TravelPackage;
  open: boolean;
  onClose: () => void;
}

type Step = 'config' | 'details' | 'summary' | 'done';

interface CustomerDetails {
  fullName: string;
  whatsapp: string;
  email: string;
  pickupLocation: string;
  specialRequest: string;
}

const EMPTY_CUSTOMER: CustomerDetails = {
  fullName: '',
  whatsapp: '',
  email: '',
  pickupLocation: '',
  specialRequest: ''
};

function todayISO() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

/** Parses a 'YYYY-MM-DD' string as a local-time Date, avoiding the UTC-midnight
 *  off-by-one day that `new Date('YYYY-MM-DD')` can produce in negative-UTC timezones. */
function parseISODateLocal(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** The pace option with no price adjustment (the "itinerary as designed" baseline) —
 *  not necessarily array index 0, since pace arrays are authored as
 *  [relaxed, standard, immersive], falling back to index 0 only if no such option
 *  exists (e.g. every option has been given a non-1 multiplier). */
function defaultPaceId(pace?: TravelPackage['pace']): string {
  if (!pace?.length) return '';
  return (pace.find((option) => option.priceMultiplier === 1) ?? pace[0]).id;
}

function buildBookingMessage(args: {
  reference: string;
  pkg: TravelPackage;
  travelDateLabel: string;
  adults: number;
  children: number;
  stayLabel: string;
  transportLabel?: string;
  paceLabel?: string;
  addOnLabels: string[];
  total: number;
  customer: CustomerDetails;
}) {
  const { reference, pkg, travelDateLabel, adults, children, stayLabel, transportLabel, paceLabel, addOnLabels, total, customer } = args;

  const travellerLines = [`${adults} Adult${adults !== 1 ? 's' : ''}`];
  if (children > 0) travellerLines.push(`${children} Child${children !== 1 ? 'ren' : ''}`);

  return [
    'Hello The Apex Voyager,',
    '',
    'I would like to make a booking request.',
    '',
    `Booking Reference: ${reference}`,
    '',
    `Package: ${pkg.name}`,
    '',
    `Travel Date: ${travelDateLabel}`,
    '',
    'Travellers:',
    travellerLines.join('\n'),
    '',
    'Accommodation:',
    stayLabel,
    ...(transportLabel ? ['', 'Transport:', transportLabel] : []),
    ...(paceLabel ? ['', 'Pace:', paceLabel] : []),
    '',
    'Selected Add-ons:',
    addOnLabels.length > 0 ? addOnLabels.join('\n') : 'None',
    '',
    'Estimated Trip Price:',
    formatINR(total),
    '',
    'Customer Name:',
    customer.fullName,
    '',
    'WhatsApp:',
    customer.whatsapp,
    '',
    'Please confirm availability and final pricing.',
    '',
    'Thank you.'
  ].join('\n');
}

function Stepper({
  label,
  value,
  min,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  isMounted?: boolean;
  onChange: (value: number) => void;
}) {
  const isDecrementDisabled = value <= min;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={isDecrementDisabled}
          aria-label={`Decrease ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-900 transition-all duration-300 ease-in-out hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center text-sm font-semibold text-slate-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-900 transition-all duration-300 ease-in-out hover:bg-slate-100"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function PriceBreakdownPanel({ pkg, breakdown }: { pkg: TravelPackage; breakdown: PriceBreakdown }) {
  return (
    <div className="rounded-2xl border border-apex-200 bg-apex-50 p-5 static top-0">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-apex-600">Live Trip Price</p>
      <div className="mt-3 space-y-2 text-sm text-slate-700">
        <div className="flex items-center justify-between">
          <span>
            Base Package
            {breakdown.seasonLabel ? <span className="text-slate-500"> ({breakdown.seasonLabel})</span> : null}
          </span>
          <span>{formatINR(breakdown.basePrice)}</span>
        </div>
        {breakdown.stayUpgrade > 0 ? (
          <div className="flex items-center justify-between text-slate-600">
            <span>{breakdown.stayLabel}</span>
            <span>+{formatINR(breakdown.stayUpgrade)}</span>
          </div>
        ) : null}
        {breakdown.transportUpgrade > 0 ? (
          <div className="flex items-center justify-between text-slate-600">
            <span>{breakdown.transportLabel}</span>
            <span>+{formatINR(breakdown.transportUpgrade)}</span>
          </div>
        ) : null}
        {breakdown.addOnLines.map((line) => (
          <div key={line.id} className="flex items-center justify-between text-slate-600">
            <span>{line.label}</span>
            <span>+{formatINR(line.price)}</span>
          </div>
        ))}
        {breakdown.paceLabel && breakdown.paceMultiplier !== 1 ? (
          <div className="flex items-center justify-between text-slate-600">
            <span>{breakdown.paceLabel} Pace</span>
            <span>×{breakdown.paceMultiplier}</span>
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-apex-200 pt-4">
        <span className="text-sm font-semibold uppercase tracking-wide text-slate-900">Total</span>
        <span className="text-2xl font-bold text-slate-900">{formatINR(breakdown.total)}</span>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        This is dynamic pricing based on our configured package data for {pkg.name} — not external hotel/flight API
        pricing. Final availability and pricing will be confirmed by The Apex Voyager team.
      </p>
    </div>
  );
}

export default function PackageBookingModal({ pkg, open, onClose }: PackageBookingModalProps) {
  const [step, setStep] = useState<Step>('config');
  const [travelDate, setTravelDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [stayOptionId, setStayOptionId] = useState(pkg.stayOptions?.[0]?.id ?? '');
  const [transportOptionId, setTransportOptionId] = useState(pkg.transportOptions?.[0]?.id ?? '');
  const [paceId, setPaceId] = useState(defaultPaceId(pkg.pace));
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [customer, setCustomer] = useState<CustomerDetails>(EMPTY_CUSTOMER);
  const [customerErrors, setCustomerErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});
  const [configError, setConfigError] = useState<string | null>(null);
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [, setIsMounted] = useState(false);
  const [minDate, setMinDate] = useState<string | undefined>(undefined);

  // `todayISO()` reads the local clock/timezone, which can differ from the server's
  // — deferring it to a client-only effect keeps the SSR and hydrated markup identical.
  useEffect(() => {
    setIsMounted(true);
    setMinDate(todayISO());
  }, []);

  // Every reopen starts a clean wizard rather than resuming a stale configuration.
  useEffect(() => {
    if (!open) return;
    setStep('config');
    setTravelDate('');
    setAdults(1);
    setChildren(0);
    setStayOptionId(pkg.stayOptions?.[0]?.id ?? '');
    setTransportOptionId(pkg.transportOptions?.[0]?.id ?? '');
    setPaceId(defaultPaceId(pkg.pace));
    setAddOnIds([]);
    setCustomer(EMPTY_CUSTOMER);
    setCustomerErrors({});
    setConfigError(null);
    setBookingReference(null);
    setIsSubmitting(false);
    setSubmitError(null);
  }, [open, pkg]);

  const breakdown = useMemo(
    () => calculateBookingPrice(pkg, { adults, children, stayOptionId, addOnIds, travelDate, transportOptionId, paceId }),
    [pkg, adults, children, stayOptionId, addOnIds, travelDate, transportOptionId, paceId]
  );

  function toggleAddOn(id: string) {
    setAddOnIds((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]));
  }

  function handleContinueFromConfig() {
    if (!travelDate) {
      setConfigError('Please select a travel date to continue.');
      return;
    }
    // The native <input type="date"> `min` only blocks picking a past date from the
    // calendar widget — a typed value bypasses it, so this re-checks the same minDate.
    if (minDate && travelDate < minDate) {
      setConfigError('Please select a date from today onwards.');
      return;
    }
    setConfigError(null);
    setStep('details');
  }

  function handleContinueFromDetails() {
    const errors: Partial<Record<keyof CustomerDetails, string>> = {};
    if (!customer.fullName.trim()) errors.fullName = 'Full name is required.';
    if (!customer.whatsapp.trim() || customer.whatsapp.replace(/\D/g, '').length < 7) {
      errors.whatsapp = 'A valid WhatsApp number is required.';
    }
    setCustomerErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setStep('summary');
  }

  async function handleContinueToWhatsApp() {
    setIsSubmitting(true);
    setSubmitError(null);

    const travelDateLabel = format(parseISODateLocal(travelDate), 'd MMMM yyyy');
    const travelerLabel = `${adults} Adult${adults !== 1 ? 's' : ''}${children > 0 ? ` + ${children} Child${children !== 1 ? 'ren' : ''}` : ''}`;

    try {
      const { referenceId } = await postJSON<{ referenceId: string }>('/api/booking-requests', {
        type: 'journey',
        name: customer.fullName,
        phone: customer.whatsapp,
        email: customer.email || undefined,
        itemName: pkg.name,
        destination: pkg.destination,
        dates: travelDateLabel,
        travelers: travelerLabel,
        details: {
          stayLabel: breakdown.stayLabel,
          transportLabel: breakdown.transportLabel,
          paceLabel: breakdown.paceLabel,
          addOns: breakdown.addOnLines.map((line) => line.label),
          total: breakdown.total,
          pickupLocation: customer.pickupLocation || undefined,
          specialRequest: customer.specialRequest || undefined
        }
      });

      setBookingReference(referenceId);

      const message = buildBookingMessage({
        reference: referenceId,
        pkg,
        travelDateLabel,
        adults,
        children,
        stayLabel: breakdown.stayLabel,
        transportLabel: breakdown.transportLabel,
        paceLabel: breakdown.paceLabel,
        addOnLabels: breakdown.addOnLines.map((line) => line.label),
        total: breakdown.total,
        customer
      });

      const link = buildWhatsAppLink({ messageText: message });
      window.open(link, '_blank', 'noopener,noreferrer');
      setStep('done');
    } catch (error) {
      console.error('Failed to save package booking request', error);
      setSubmitError('Something went wrong saving your request — please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const stepTitles: Record<Step, string> = {
    config: 'Configure Your Trip',
    details: 'Your Details',
    summary: 'Booking Summary',
    done: 'Booking Request Sent'
  };

  return (
    <Modal open={open} onClose={onClose} title={stepTitles[step]} className="max-w-4xl">
      {step === 'config' ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] relative">
            <div className="space-y-5">
              <div>
                <label htmlFor="travel-date" className="mb-2 block text-sm font-semibold text-slate-900">
                  Travel Date
                </label>
                <input
                  id="travel-date"
                  type="date"
                  min={minDate}
                  value={travelDate}
                  onChange={(event) => setTravelDate(event.target.value)}
                  aria-describedby={configError ? 'travel-date-error' : undefined}
                  aria-invalid={configError ? true : undefined}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-apex-400"
                />
                {configError ? (
                  <p id="travel-date-error" role="alert" className="mt-2 text-sm text-rose-400">
                    {configError}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">Travellers</p>
                <Stepper label="Adults" value={adults} min={1} onChange={setAdults} />
                <Stepper label="Children" value={children} min={0} onChange={setChildren} />
              </div>

              {pkg.stayOptions?.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">Stay</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {pkg.stayOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setStayOptionId(option.id)}
                        aria-pressed={stayOptionId === option.id}
                        className={cn(
                          'cursor-hover rounded-xl border px-4 py-3 text-left text-sm transition',
                          stayOptionId === option.id
                            ? 'border-apex-400 bg-apex-50 text-slate-900'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                        )}
                      >
                        <span className="flex items-center justify-between font-semibold">
                          {option.label}
                          {stayOptionId === option.id ? <Check size={14} className="text-apex-600" /> : null}
                        </span>
                        <span className="text-xs text-slate-500">
                          {option.extraPrice > 0 ? `+${formatINR(option.extraPrice)}` : 'Included'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {pkg.transportOptions?.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">Transport</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {pkg.transportOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setTransportOptionId(option.id)}
                        aria-pressed={transportOptionId === option.id}
                        className={cn(
                          'cursor-hover rounded-xl border px-4 py-3 text-left text-sm transition',
                          transportOptionId === option.id
                            ? 'border-apex-400 bg-apex-50 text-slate-900'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                        )}
                      >
                        <span className="flex items-center justify-between font-semibold">
                          {option.label}
                          {transportOptionId === option.id ? <Check size={14} className="text-apex-600" /> : null}
                        </span>
                        <span className="text-xs text-slate-500">
                          {option.extraPrice > 0 ? `+${formatINR(option.extraPrice)}` : 'Included'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {pkg.pace?.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">Pace</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {pkg.pace.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPaceId(option.id)}
                        aria-pressed={paceId === option.id}
                        className={cn(
                          'cursor-hover rounded-xl border px-4 py-3 text-left text-sm transition',
                          paceId === option.id
                            ? 'border-apex-400 bg-apex-50 text-slate-900'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                        )}
                      >
                        <span className="flex items-center justify-between font-semibold">
                          {option.label}
                          {paceId === option.id ? <Check size={14} className="text-apex-600" /> : null}
                        </span>
                        <span className="text-xs text-slate-500">{option.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {pkg.addOns?.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">Add-ons</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {pkg.addOns.map((addOn) => {
                      const selected = addOnIds.includes(addOn.id);
                      return (
                        <button
                          key={addOn.id}
                          type="button"
                          onClick={() => toggleAddOn(addOn.id)}
                          aria-pressed={selected}
                          className={cn(
                            'cursor-hover rounded-xl border px-4 py-3 text-left text-sm transition',
                            selected
                              ? 'border-apex-400 bg-apex-50 text-slate-900'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                          )}
                        >
                          <span className="flex items-center justify-between font-semibold">
                            {addOn.label}
                            {selected ? <Check size={14} className="text-apex-600" /> : null}
                          </span>
                          <span className="text-xs text-slate-500">+{formatINR(addOn.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <PriceBreakdownPanel pkg={pkg} breakdown={breakdown} />
          </div>

          <button
            type="button"
            onClick={handleContinueFromConfig}
            className="cursor-hover flex w-full items-center justify-center gap-2 rounded-full bg-apex-500 px-7 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
          >
            Continue <ArrowRight size={16} />
          </button>
        </div>
      ) : null}

      {step === 'details' ? (
        <div className="space-y-5">
          <div>
            <label htmlFor="full-name" className="mb-2 block text-sm font-semibold text-slate-900">
              Full Name *
            </label>
            <input
              id="full-name"
              type="text"
              value={customer.fullName}
              onChange={(event) => setCustomer((prev) => ({ ...prev, fullName: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-apex-400"
              placeholder="Rahul Sharma"
            />
            {customerErrors.fullName ? <p className="mt-1 text-xs text-rose-500">{customerErrors.fullName}</p> : null}
          </div>

          <div>
            <label htmlFor="whatsapp-number" className="mb-2 block text-sm font-semibold text-slate-900">
              WhatsApp Number *
            </label>
            <input
              id="whatsapp-number"
              type="tel"
              value={customer.whatsapp}
              onChange={(event) => setCustomer((prev) => ({ ...prev, whatsapp: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-apex-400"
              placeholder="+91 98765 43210"
            />
            {customerErrors.whatsapp ? <p className="mt-1 text-xs text-rose-500">{customerErrors.whatsapp}</p> : null}
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-900">
              Email <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="email"
              type="email"
              value={customer.email}
              onChange={(event) => setCustomer((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-apex-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="pickup-location" className="mb-2 block text-sm font-semibold text-slate-900">
              Pickup Location <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="pickup-location"
              type="text"
              value={customer.pickupLocation}
              onChange={(event) => setCustomer((prev) => ({ ...prev, pickupLocation: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-apex-400"
              placeholder="Chandigarh Airport"
            />
          </div>

          <div>
            <label htmlFor="special-request" className="mb-2 block text-sm font-semibold text-slate-900">
              Special Request <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <textarea
              id="special-request"
              value={customer.specialRequest}
              onChange={(event) => setCustomer((prev) => ({ ...prev, specialRequest: event.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-apex-400"
              placeholder="Anniversary trip, vegetarian meals, etc."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('config')}
              className="cursor-hover flex-1 rounded-full border border-slate-200 bg-slate-50 px-7 py-3 text-sm font-semibold text-slate-900 transition-all duration-300 ease-in-out hover:bg-slate-100"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinueFromDetails}
              className="cursor-hover flex flex-1 items-center justify-center gap-2 rounded-full bg-apex-500 px-7 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : null}

      {step === 'summary' ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h4 className="text-lg font-semibold text-slate-900">{pkg.name}</h4>
            <dl className="mt-3 space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <dt>Travel Date</dt>
                <dd className="text-slate-900">{format(parseISODateLocal(travelDate), 'd MMMM yyyy')}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Travellers</dt>
                <dd className="text-slate-900">
                  {adults} Adult{adults !== 1 ? 's' : ''}
                  {children > 0 ? ` + ${children} Child${children !== 1 ? 'ren' : ''}` : ''}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Stay</dt>
                <dd className="text-slate-900">{breakdown.stayLabel}</dd>
              </div>
              {breakdown.addOnLines.length > 0 ? (
                <div className="flex items-start justify-between gap-4">
                  <dt>Add-ons</dt>
                  <dd className="text-right text-slate-900">
                    {breakdown.addOnLines.map((line) => (
                      <span key={line.id} className="block">
                        {line.label}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          <PriceBreakdownPanel pkg={pkg} breakdown={breakdown} />

          {submitError ? <p className="text-sm text-rose-500">{submitError}</p> : null}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('details')}
              disabled={isSubmitting}
              className="cursor-hover flex-1 rounded-full border border-slate-200 bg-slate-50 px-7 py-3 text-sm font-semibold text-slate-900 transition-all duration-300 ease-in-out hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinueToWhatsApp}
              disabled={isSubmitting}
              className="cursor-hover flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#20ba5a] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              <WhatsAppIcon size={16} /> {isSubmitting ? 'Sending…' : 'Continue to WhatsApp'}
            </button>
          </div>
        </div>
      ) : null}

      {step === 'done' ? (
        <div className="space-y-5 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check size={28} />
          </span>
          <div>
            <h4 className="text-xl font-semibold text-slate-900">Booking Request Sent</h4>
            <p className="mt-2 text-sm text-slate-600">
              Your booking reference is <span className="font-semibold text-slate-900">{bookingReference}</span>. We opened
              WhatsApp with your pre-filled request — please send it to complete your enquiry.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            This is an Estimated Trip Price, not a confirmed booking. Final availability and pricing will be confirmed
            by The Apex Voyager team.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="cursor-hover w-full rounded-full border border-slate-200 bg-slate-50 px-7 py-3 text-sm font-semibold text-slate-900 transition-all duration-300 ease-in-out hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      ) : null}
    </Modal>
  );
}