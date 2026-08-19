'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2, MapPin } from 'lucide-react';
import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import TalkToTravelTeamButton from '@/components/modules/TalkToTravelTeamButton';
import { destinations } from '@/config/destinations.config';
import { postJSON } from '@/lib/api';
import { buildExpertRequestMessage } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';
import type { TravelExpert } from '@/types/expert';

const travellerTypes = ['Couple', 'Family', 'Friends', 'Group', 'Solo', 'Corporate'];
const tripTypes = ['Relaxed', 'Adventure', 'Luxury', 'Budget-conscious', 'Balanced', 'Custom'];
const budgetRanges = ['Under ₹15,000 per person', '₹15,000 – ₹30,000 per person', '₹30,000 – ₹50,000 per person', '₹50,000+ per person', 'Not sure yet'];
const needHelpOptions = ['Complete trip', 'Transport', 'Stay', 'Experiences', 'Itinerary', 'Everything'];

// Rule-based guess only (spec §11 explicitly forbids claiming AI matching) — feeds
// the same `travelStyle` field the /api/travel-experts/match route scores against.
function guessTravelStyle(travellerType: string, tripType: string): string | undefined {
  if (tripType === 'Adventure') return 'Adventure';
  if (tripType === 'Luxury') return 'Luxury';
  if (travellerType === 'Couple') return 'Couple';
  if (travellerType === 'Family') return 'Family';
  if (travellerType === 'Group' || travellerType === 'Friends') return 'Group';
  return undefined;
}

type MatchStatus = 'idle' | 'loading' | 'done' | 'error';

export interface ExpertTripPlannerProps {
  /** Pre-fills "What do you need help with?" when arriving via an ExpertHelpOptions chip (spec §5) — read from the page's own searchParams, not a client-side useSearchParams() call. */
  initialNeedHelpWith?: string;
}

export default function ExpertTripPlanner({ initialNeedHelpWith }: ExpertTripPlannerProps) {
  const { openBookingRequest } = useBookingRequest();

  const [destinationSlug, setDestinationSlug] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [travelers, setTravelers] = useState('');
  const [travellerType, setTravellerType] = useState(travellerTypes[0]);
  const [tripType, setTripType] = useState(tripTypes[0]);
  const [budget, setBudget] = useState(budgetRanges[0]);
  const [needHelpWith, setNeedHelpWith] = useState(
    initialNeedHelpWith && needHelpOptions.includes(initialNeedHelpWith) ? initialNeedHelpWith : needHelpOptions[0]
  );
  const [requirements, setRequirements] = useState('');

  const [status, setStatus] = useState<MatchStatus>('idle');
  const [matchedExpert, setMatchedExpert] = useState<TravelExpert | null>(null);
  const [error, setError] = useState('');

  const selectedDestination = destinations.find((destination) => destination.slug === destinationSlug);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!destinationSlug) {
      setError('Please select where you want to go.');
      return;
    }

    setError('');
    setStatus('loading');

    try {
      const { expert } = await postJSON<{ expert: TravelExpert | null }>('/api/travel-experts/match', {
        destinationSlug,
        travelStyle: guessTravelStyle(travellerType, tripType),
        tripType,
        needHelpWith
      });
      setMatchedExpert(expert);
      setStatus('done');
    } catch (err) {
      console.error('Failed to match a travel expert', err);
      setStatus('error');
    }
  }

  function talkToMatchedExpert() {
    if (!matchedExpert) return;
    openBookingRequest({
      type: 'expert',
      itemName: matchedExpert.name,
      destination: selectedDestination?.title,
      dates: travelDate || undefined,
      travelers: travelers || undefined,
      details: { travellerType, tripType, budget, needHelpWith, requirements },
      buildWhatsAppMessage: (referenceId) =>
        buildExpertRequestMessage({
          referenceId,
          expertName: matchedExpert.name,
          destination: selectedDestination?.title ?? destinationSlug,
          travelDate: travelDate || undefined,
          travelers: travelers || undefined,
          travellerType,
          tripType,
          needHelpWith,
          requirements: requirements || undefined
        })
    });
  }

  return (
    <section id="plan-my-trip" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16 sm:px-10 lg:px-16">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-glow sm:p-10">
        <p className="text-sm uppercase tracking-[0.32em] text-apex-600">Personal trip planner</p>
        <h2 className="mt-4 text-2xl font-semibold text-slate-900 sm:text-3xl">Tell Us About Your Journey</h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Share a few details and we&apos;ll point you to the specialist best placed to help — no long forms, no commitment.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-6 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Where do you want to go?</span>
            <select
              value={destinationSlug}
              onChange={(event) => setDestinationSlug(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-apex-400"
            >
              <option value="">Select a destination</option>
              {destinations.map((destination) => (
                <option key={destination.slug} value={destination.slug}>
                  {destination.title} — {destination.state}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="font-semibold text-slate-700">When are you travelling?</span>
            <input
              type="text"
              value={travelDate}
              onChange={(event) => setTravelDate(event.target.value)}
              placeholder="e.g. September 2026, or flexible"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-apex-400"
            />
          </label>

          <label className="block text-sm">
            <span className="font-semibold text-slate-700">How many travellers?</span>
            <input
              type="number"
              min={1}
              value={travelers}
              onChange={(event) => setTravelers(event.target.value)}
              placeholder="e.g. 4"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-apex-400"
            />
          </label>

          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Who are you travelling with?</span>
            <select
              value={travellerType}
              onChange={(event) => setTravellerType(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-apex-400"
            >
              {travellerTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="font-semibold text-slate-700">What kind of trip do you want?</span>
            <select
              value={tripType}
              onChange={(event) => setTripType(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-apex-400"
            >
              {tripTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="font-semibold text-slate-700">Approximate budget</span>
            <select
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-apex-400"
            >
              {budgetRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold text-slate-700">What do you need help with?</span>
            <select
              value={needHelpWith}
              onChange={(event) => setNeedHelpWith(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-apex-400"
            >
              {needHelpOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold text-slate-700">Additional requirements (optional)</span>
            <textarea
              value={requirements}
              onChange={(event) => setRequirements(event.target.value)}
              rows={3}
              placeholder="Anything else your specialist should know?"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-apex-400"
            />
          </label>

          {error ? <p className="text-sm text-red-500 sm:col-span-2">{error}</p> : null}
          {status === 'error' ? (
            <p className="text-sm text-red-500 sm:col-span-2">
              Something went wrong finding a match — please try again, or message us directly on WhatsApp.
            </p>
          ) : null}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'loading' ? 'Finding your expert…' : 'Get My Travel Plan'}
            </button>
          </div>
        </form>

        {status === 'done' ? (
          <div className="mt-10 border-t border-slate-200 pt-8">
            {matchedExpert ? (
              <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-apex-600">
                    <CheckCircle2 size={16} /> We found the right expert for your journey
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">{matchedExpert.name}</h3>
                  <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={14} className="text-apex-600" /> {matchedExpert.expertise.join(' • ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={talkToMatchedExpert}
                  className={cn(
                    'cursor-hover inline-flex items-center justify-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400'
                  )}
                >
                  Talk to {matchedExpert.name.split(' ')[0]}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 p-6 text-center">
                <p className="font-semibold text-slate-900">We don&apos;t have a specialist for this exact combination yet.</p>
                <p className="mt-2 text-sm text-slate-600">Our travel team can still help you plan this trip.</p>
                <div className="mt-4 flex justify-center">
                  <TalkToTravelTeamButton destination={selectedDestination?.title} />
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
