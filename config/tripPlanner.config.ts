import {
  Backpack,
  Bike,
  Binoculars,
  Briefcase,
  Building2,
  Camera,
  Car,
  Compass,
  Flower2,
  Gem,
  Heart,
  Home,
  Landmark,
  MapPinned,
  Mountain,
  PartyPopper,
  Plane,
  Route,
  Snowflake,
  Sparkles,
  Tent,
  TreePine,
  Trees,
  Users,
  Utensils,
  Warehouse,
  Waves,
  type LucideIcon
} from 'lucide-react';
import type {
  BudgetModeId,
  CompanionTypeId,
  ExperienceId,
  StayTypeId,
  TransportModeId,
  TravelStyleId
} from '@/types/tripPlanner';

export interface PlannerRegion {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

// Same three primary regions as config/search.config.ts's regionCategories, but with a
// stable `id` (search.config.ts only carries the display name) so wizard state can
// persist a region selection independently of any future label changes.
export const PLANNER_REGIONS: PlannerRegion[] = [
  { id: 'himachal-pradesh', name: 'Himachal Pradesh', description: 'Manali, Shimla & Spiti Valley', icon: Mountain },
  { id: 'kashmir', name: 'Kashmir', description: 'Gulmarg, Srinagar & alpine valleys', icon: Snowflake },
  { id: 'uttarakhand', name: 'Uttarakhand', description: 'Rishikesh, Haridwar & the Himalayas', icon: Trees }
];

export const PLANNER_POPULAR_PLACES: string[] = [
  'Manali',
  'Spiti Valley',
  'Shimla',
  'Dharamshala',
  'McLeod Ganj',
  'Kasol',
  'Kullu',
  'Dalhousie',
  'Gulmarg',
  'Srinagar',
  'Pahalgam',
  'Sonmarg',
  'Leh-Ladakh',
  'Rishikesh',
  'Nainital',
  'Mussoorie',
  'Auli',
  'Chopta',
  'Kedarnath',
  'Valley of Flowers'
];

export interface PlannerCompanionType {
  id: CompanionTypeId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const COMPANION_TYPES: PlannerCompanionType[] = [
  { id: 'solo', label: 'Solo', description: 'Just me, exploring at my own pace', icon: Backpack },
  { id: 'couple', label: 'Couple', description: 'A romantic getaway for two', icon: Heart },
  { id: 'family', label: 'Family', description: 'Travelling with kids or parents', icon: Users },
  { id: 'friends', label: 'Friends', description: 'A group trip with your crew', icon: PartyPopper },
  { id: 'honeymoon', label: 'Honeymoon', description: 'Celebrating your new chapter together', icon: Gem },
  { id: 'corporate', label: 'Corporate', description: 'Offsite, incentive or team travel', icon: Briefcase }
];

export interface PlannerTravelStyle {
  id: TravelStyleId;
  label: string;
  icon: LucideIcon;
}

export const TRAVEL_STYLES: PlannerTravelStyle[] = [
  { id: 'adventure', label: 'Adventure', icon: Compass },
  { id: 'luxury', label: 'Luxury', icon: Gem },
  { id: 'relaxed', label: 'Relaxed', icon: Waves },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'romantic', label: 'Romantic', icon: Heart },
  { id: 'nature', label: 'Nature', icon: Trees },
  { id: 'spiritual', label: 'Spiritual', icon: Flower2 },
  { id: 'offbeat', label: 'Offbeat', icon: MapPinned },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'wildlife', label: 'Wildlife', icon: Binoculars },
  { id: 'road-trip', label: 'Road Trip', icon: Route },
  { id: 'slow-travel', label: 'Slow Travel', icon: TreePine }
];

export interface PlannerStayType {
  id: StayTypeId;
  label: string;
  icon: LucideIcon;
  /** 1 = budget-friendly, 2 = mid-range, 3 = premium — drives the Comfort/Signature upgrade path in the pricing engine. */
  tier: 1 | 2 | 3;
  pricePerNight: number;
}

export const STAY_TYPE_OPTIONS: PlannerStayType[] = [
  { id: 'homestay', label: 'Homestays', icon: Home, tier: 1, pricePerNight: 2200 },
  { id: 'camp', label: 'Camps', icon: Tent, tier: 1, pricePerNight: 2800 },
  { id: 'hotel', label: 'Hotels', icon: Building2, tier: 2, pricePerNight: 4200 },
  { id: 'cottage', label: 'Cottages', icon: Warehouse, tier: 2, pricePerNight: 4800 },
  { id: 'glamping', label: 'Glamping', icon: Sparkles, tier: 2, pricePerNight: 5200 },
  { id: 'treehouse', label: 'Treehouses', icon: TreePine, tier: 2, pricePerNight: 5600 },
  { id: 'resort', label: 'Resorts', icon: Waves, tier: 3, pricePerNight: 8500 },
  { id: 'boutique', label: 'Boutique Stays', icon: Gem, tier: 3, pricePerNight: 9500 },
  { id: 'villa', label: 'Villas', icon: Landmark, tier: 3, pricePerNight: 12000 }
];

export const STAY_AMENITIES: string[] = [
  'Mountain View',
  'Balcony',
  'Bonfire',
  'Private Pool',
  'Pet Friendly',
  'Room Service',
  'Spa Access',
  'Rooftop Cafe',
  'Riverside',
  'Bathtub'
];

export const STAY_BUDGET_RANGE = { min: 1000, max: 20000, step: 500 };

export interface PlannerExperience {
  id: ExperienceId;
  label: string;
  description: string;
  icon: LucideIcon;
  pricePerPerson: number;
}

export const EXPERIENCE_OPTIONS: PlannerExperience[] = [
  { id: 'trekking', label: 'Trekking & Hiking', description: 'Guided trails through forests and high passes', icon: Backpack, pricePerPerson: 1500 },
  { id: 'snow', label: 'Snow Experiences', description: 'Skiing, snowshoeing and snowball fun', icon: Snowflake, pricePerPerson: 1200 },
  { id: 'scenic-drives', label: 'Scenic Drives', description: 'Winding mountain roads and viewpoints', icon: Car, pricePerPerson: 800 },
  { id: 'camping', label: 'Camping Under Stars', description: 'Riverside or high-altitude camps', icon: Tent, pricePerPerson: 1400 },
  { id: 'wellness', label: 'Wellness & Spa', description: 'Yoga, spa and slow mornings', icon: Flower2, pricePerPerson: 2200 },
  { id: 'local-food', label: 'Local Food Trails', description: 'Home-style Himachali/Kashmiri meals', icon: Utensils, pricePerPerson: 900 },
  { id: 'hidden-places', label: 'Hidden Places', description: 'Offbeat villages away from the crowds', icon: MapPinned, pricePerPerson: 1000 },
  { id: 'photography-walk', label: 'Photography Walks', description: 'Golden-hour shoots with a local guide', icon: Camera, pricePerPerson: 1100 },
  { id: 'river-rafting', label: 'River Rafting', description: 'White-water rafting on the Beas/Zanskar', icon: Waves, pricePerPerson: 1800 },
  { id: 'monastery-visit', label: 'Monastery Visits', description: 'Buddhist monasteries and prayer wheels', icon: Landmark, pricePerPerson: 700 },
  { id: 'wildlife-safari', label: 'Wildlife Safari', description: 'National park safaris and birdwatching', icon: Binoculars, pricePerPerson: 2000 },
  { id: 'village-walk', label: 'Village Walks', description: 'Meet local communities and artisans', icon: Home, pricePerPerson: 600 }
];

export interface PlannerTransportMode {
  id: TransportModeId;
  label: string;
  description: string;
  icon: LucideIcon;
  perDayRate: number;
}

export const TRANSPORT_MODES: PlannerTransportMode[] = [
  { id: 'private-suv', label: 'Private SUV', description: '6-seater, driver & fuel included', icon: Car, perDayRate: 6500 },
  { id: 'tempo-traveller', label: 'Tempo Traveller', description: 'For larger groups of 8+', icon: Route, perDayRate: 9500 },
  { id: 'bike', label: 'Self-Ride Bike', description: 'Royal Enfield or similar, fuel extra', icon: Bike, perDayRate: 2200 },
  { id: 'cab', label: 'Shared Cab', description: 'Budget-friendly sedan cab', icon: Car, perDayRate: 3500 },
  { id: 'flight-train', label: 'Flights/Trains + Transfer', description: 'Air/rail to the base city + local transfer', icon: Plane, perDayRate: 4000 }
];

export interface PlannerBudgetBracket {
  id: string;
  label: string;
  range: string;
  min: number;
  max: number;
}

export const BUDGET_BRACKETS: PlannerBudgetBracket[] = [
  { id: 'budget', label: 'Budget', range: '₹15,000 – ₹30,000', min: 15000, max: 30000 },
  { id: 'value', label: 'Value', range: '₹30,000 – ₹50,000', min: 30000, max: 50000 },
  { id: 'comfort', label: 'Comfort', range: '₹50,000 – ₹80,000', min: 50000, max: 80000 },
  { id: 'premium', label: 'Premium', range: '₹80,000 – ₹1,50,000', min: 80000, max: 150000 },
  { id: 'luxury', label: 'Luxury', range: '₹1,50,000+', min: 150000, max: 300000 }
];

export const BUDGET_MODES: { id: BudgetModeId; label: string }[] = [
  { id: 'total', label: 'Total trip budget' },
  { id: 'per-person', label: 'Per person' }
];

// config/regions.config.ts's region ids ('himachal-pradesh', 'jammu-kashmir', 'uttarakhand')
// don't quite match this file's own PLANNER_REGIONS ids above ('himachal-pradesh',
// 'kashmir', 'uttarakhand') — see that constant's header comment for why the two lists
// were kept separate. This is the one bridge between them, shared by the wizard's own
// destination/region query-param prefill (PlanMyJourneyWizard.tsx) and the booking-context
// resolver (lib/bookingContext.ts) — do not add a second, parallel mapping elsewhere.
export const REGION_ID_TO_PLANNER_REGION_ID: Record<string, string> = {
  'himachal-pradesh': 'himachal-pradesh',
  'jammu-kashmir': 'kashmir',
  uttarakhand: 'uttarakhand'
};

export function getPlannerRegionId(regionId: string): string | undefined {
  return REGION_ID_TO_PLANNER_REGION_ID[regionId];
}

export const WIZARD_STEP_LABELS = [
  'Destination',
  'Dates',
  'Travellers',
  'Travel Style',
  'Stay Preference',
  'Experiences',
  'Transport',
  'Budget'
] as const;
