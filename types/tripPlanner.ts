export type CompanionTypeId = 'solo' | 'couple' | 'family' | 'friends' | 'honeymoon' | 'corporate';

export type TravelStyleId =
  | 'adventure'
  | 'luxury'
  | 'relaxed'
  | 'family'
  | 'romantic'
  | 'nature'
  | 'spiritual'
  | 'offbeat'
  | 'photography'
  | 'wildlife'
  | 'road-trip'
  | 'slow-travel';

export type StayTypeId = 'hotel' | 'resort' | 'homestay' | 'treehouse' | 'camp' | 'cottage' | 'villa' | 'glamping' | 'boutique';

export type ExperienceId =
  | 'trekking'
  | 'snow'
  | 'scenic-drives'
  | 'camping'
  | 'wellness'
  | 'local-food'
  | 'hidden-places'
  | 'photography-walk'
  | 'river-rafting'
  | 'monastery-visit'
  | 'wildlife-safari'
  | 'village-walk';

export type TransportModeId = 'private-suv' | 'tempo-traveller' | 'bike' | 'cab' | 'flight-train';

export type BudgetModeId = 'per-person' | 'total';

export type JourneyTierId = 'smart' | 'comfort' | 'signature';

export interface WizardDestinationState {
  regionIds: string[];
  places: string[];
}

export interface WizardDatesState {
  start: Date | null;
  end: Date | null;
  flexible: boolean;
}

export interface WizardTravellersState {
  companionType: CompanionTypeId | null;
  adults: number;
  children: number;
  rooms: number;
}

export interface WizardStayState {
  typeIds: StayTypeId[];
  amenities: string[];
}

export interface WizardTransportState {
  modeId: TransportModeId | null;
  pickup: string;
  drop: string;
}

export interface WizardBudgetState {
  mode: BudgetModeId;
  bracketId: string | null;
}

export interface TripPlannerWizardState {
  destination: WizardDestinationState;
  dates: WizardDatesState;
  travellers: WizardTravellersState;
  travelStyleIds: TravelStyleId[];
  stay: WizardStayState;
  experienceIds: ExperienceId[];
  transport: WizardTransportState;
  budget: WizardBudgetState;
  /** Optional free text — "Anything else we should know?" — informational only, never priced. */
  notes: string;
}

export interface JourneyPriceLine {
  label: string;
  amount: number;
}

export interface JourneyParams {
  nights: number;
  travellerCount: number;
  rooms: number;
  stayTypeId: StayTypeId;
  transportModeId: TransportModeId;
  experienceIds: ExperienceId[];
  guideIncluded: boolean;
  mealsIncluded: boolean;
  /** Informational planning fields only — never read by priceJourney(), never affect price. */
  pickup?: string;
  drop?: string;
}

export interface JourneyPriceResult {
  breakdown: JourneyPriceLine[];
  subtotal: number;
  total: number;
  perPerson: number;
}

export interface JourneyChoice {
  id: JourneyTierId;
  title: string;
  tagline: string;
  highlights: string[];
  params: JourneyParams;
  price: JourneyPriceResult;
}
