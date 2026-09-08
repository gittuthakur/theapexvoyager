import { EXPERIENCE_OPTIONS, STAY_TYPE_OPTIONS, TRANSPORT_MODES } from '@/config/tripPlanner.config';
import type {
  ExperienceId,
  JourneyChoice,
  JourneyParams,
  JourneyPriceResult,
  StayTypeId,
  TransportModeId,
  TripPlannerWizardState
} from '@/types/tripPlanner';

const SERVICE_FEE_RATE = 0.07;
const MEALS_PER_PERSON_PER_NIGHT = 900;
const GUIDE_FLAT_PER_NIGHT = 2500;
const DEFAULT_NIGHTS = 5;
// No planner-specific maximum existed before this — chosen from the longest duration
// The Apex Voyager already sells (config/tours.config.ts's longest itinerary is
// "10 Days / 9 Nights"), not invented from scratch. Enforced both here (client-side
// preview pricing) and again in app/api/booking-requests/route.ts (server-authoritative).
export const MAX_NIGHTS = 9;

/** Single source of truth for turning a component selection into a transparent, line-itemized total — every tier card and the customize panel call this instead of computing their own numbers. */
export function priceJourney(params: JourneyParams): JourneyPriceResult {
  const stay = STAY_TYPE_OPTIONS.find((option) => option.id === params.stayTypeId) ?? STAY_TYPE_OPTIONS[0];
  const transport = TRANSPORT_MODES.find((option) => option.id === params.transportModeId) ?? TRANSPORT_MODES[0];
  const nights = Math.min(MAX_NIGHTS, Math.max(1, params.nights));
  const travellers = Math.max(1, params.travellerCount);
  const rooms = Math.max(1, params.rooms);

  const stayTotal = stay.pricePerNight * nights * rooms;
  // +1 day covers the pickup/drop legs on top of the nights spent in-destination.
  const transportTotal = transport.perDayRate * (nights + 1);
  const experiencesTotal = params.experienceIds.reduce((sum, id) => {
    const experience = EXPERIENCE_OPTIONS.find((option) => option.id === id);
    return sum + (experience ? experience.pricePerPerson * travellers : 0);
  }, 0);
  const guideTotal = params.guideIncluded ? GUIDE_FLAT_PER_NIGHT * nights : 0;
  const mealsTotal = params.mealsIncluded ? MEALS_PER_PERSON_PER_NIGHT * nights * travellers : 0;

  const subtotal = stayTotal + transportTotal + experiencesTotal + guideTotal + mealsTotal;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + serviceFee;

  const breakdown = [
    { label: 'Stay', amount: stayTotal },
    { label: 'Transport', amount: transportTotal },
    { label: 'Experiences', amount: experiencesTotal },
    { label: 'Guide', amount: guideTotal },
    { label: 'Meals', amount: mealsTotal },
    { label: 'Service Fee', amount: serviceFee }
  ].filter((line) => line.amount > 0);

  return { breakdown, subtotal, total, perPerson: Math.round(total / travellers) };
}

export function computeNights(state: TripPlannerWizardState): number {
  const { start, end } = state.dates;
  if (start && end) {
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 0) return diff;
  }
  return DEFAULT_NIGHTS;
}

export function computeTravellerCount(state: TripPlannerWizardState): number {
  return Math.max(1, state.travellers.adults + state.travellers.children);
}

/** Cheapest selected stay type at-or-above a tier, falling back to the cheapest catalog option at that tier when nothing selected qualifies — keeps Comfort/Signature at least as expensive as Smart even when the visitor only ticked budget stay types. */
function pickStayForTier(selectedIds: StayTypeId[], minTier: 1 | 2 | 3): StayTypeId {
  const candidates = STAY_TYPE_OPTIONS.filter((option) => option.tier >= minTier);
  const selectedMatch = candidates
    .filter((option) => selectedIds.includes(option.id))
    .sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
  if (selectedMatch) return selectedMatch.id;

  if (minTier === 1) {
    const cheapestSelected = STAY_TYPE_OPTIONS.filter((option) => selectedIds.includes(option.id)).sort(
      (a, b) => a.pricePerNight - b.pricePerNight
    )[0];
    if (cheapestSelected) return cheapestSelected.id;
  }

  return candidates.sort((a, b) => a.pricePerNight - b.pricePerNight)[0].id;
}

function upgradeTransport(currentId: TransportModeId | null, travellerCount: number): TransportModeId {
  if (currentId === 'private-suv' || currentId === 'tempo-traveller') return currentId;
  return travellerCount > 6 ? 'tempo-traveller' : 'private-suv';
}

function premiumTransport(travellerCount: number): TransportModeId {
  return travellerCount > 6 ? 'tempo-traveller' : 'private-suv';
}

function tierTitle(id: 'smart' | 'comfort' | 'signature') {
  if (id === 'smart') return 'Smart Choice';
  if (id === 'comfort') return 'Comfort';
  return 'Signature';
}

function stayLabel(id: StayTypeId) {
  return STAY_TYPE_OPTIONS.find((option) => option.id === id)?.label ?? id;
}

function transportLabel(id: TransportModeId) {
  return TRANSPORT_MODES.find((option) => option.id === id)?.label ?? id;
}

function experienceLabels(ids: ExperienceId[]) {
  return ids.map((id) => EXPERIENCE_OPTIONS.find((option) => option.id === id)?.label ?? id);
}

/**
 * Turns one set of wizard answers into three distinct, ready-to-book choices instead
 * of a flat list of packages — Smart Choice keeps the visitor's exact picks, Comfort
 * upgrades stay/transport and adds a private guide, Signature goes premium end-to-end
 * with a couple of curated bonus experiences layered on top.
 */
export function computeJourneyChoices(state: TripPlannerWizardState): JourneyChoice[] {
  const nights = computeNights(state);
  const travellerCount = computeTravellerCount(state);
  const rooms = Math.max(1, state.travellers.rooms);
  const selectedExperiences = state.experienceIds.length > 0 ? state.experienceIds : (['scenic-drives', 'local-food'] as ExperienceId[]);

  const smartStay = pickStayForTier(state.stay.typeIds, 1);
  const comfortStay = pickStayForTier(state.stay.typeIds, 2);
  const signatureStay = pickStayForTier(state.stay.typeIds, 3);

  const smartTransport = state.transport.modeId ?? 'cab';
  const comfortTransport = upgradeTransport(smartTransport, travellerCount);
  const signatureTransport = premiumTransport(travellerCount);

  const bonusExperiences = EXPERIENCE_OPTIONS.filter((option) => !selectedExperiences.includes(option.id))
    .slice(0, 2)
    .map((option) => option.id);
  const signatureExperiences = [...selectedExperiences, ...bonusExperiences];

  const pickup = state.transport.pickup.trim() || undefined;
  const drop = state.transport.drop.trim() || undefined;

  const smartParams: JourneyParams = {
    nights,
    travellerCount,
    rooms,
    stayTypeId: smartStay,
    transportModeId: smartTransport,
    experienceIds: selectedExperiences,
    guideIncluded: false,
    mealsIncluded: true,
    pickup,
    drop
  };
  const comfortParams: JourneyParams = {
    ...smartParams,
    stayTypeId: comfortStay,
    transportModeId: comfortTransport,
    guideIncluded: true
  };
  const signatureParams: JourneyParams = {
    ...smartParams,
    stayTypeId: signatureStay,
    transportModeId: signatureTransport,
    experienceIds: signatureExperiences,
    guideIncluded: true
  };

  const tiers: { id: 'smart' | 'comfort' | 'signature'; params: JourneyParams; tagline: string; highlights: string[] }[] = [
    {
      id: 'smart',
      params: smartParams,
      tagline: 'Balanced stay, transport & experiences — everything you picked, priced sensibly.',
      highlights: [stayLabel(smartStay), transportLabel(smartTransport), ...experienceLabels(selectedExperiences)].slice(0, 4)
    },
    {
      id: 'comfort',
      params: comfortParams,
      tagline: 'Better stays and a private guide-led experience, upgraded from your picks.',
      highlights: [stayLabel(comfortStay), transportLabel(comfortTransport), 'Private guide', ...experienceLabels(selectedExperiences)].slice(0, 4)
    },
    {
      id: 'signature',
      params: signatureParams,
      tagline: 'Premium stays, a dedicated private guide, and curated paths beyond your list.',
      highlights: [
        stayLabel(signatureStay),
        transportLabel(signatureTransport),
        'Private guide',
        ...experienceLabels(signatureExperiences)
      ].slice(0, 5)
    }
  ];

  return tiers.map((tier) => ({
    id: tier.id,
    title: tierTitle(tier.id),
    tagline: tier.tagline,
    highlights: tier.highlights,
    params: tier.params,
    price: priceJourney(tier.params)
  }));
}
