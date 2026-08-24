import { vehicleOptions } from '@/config/transport.config';
import type { TransportRoute } from '@/types/transport';

/**
 * Single source of truth for the "Service Type" search field and its dependent
 * "Vehicle Type" options — shared by components/modules/transport/TransportHeroSearch.tsx
 * (client, for the dropdown UI) and lib/transport.ts (for route service-type
 * recommendation). Vehicle Type entries are REAL `TransportVehicle.category` enum
 * values (models/TransportVehicle.ts), not display labels — e.g. the existing "Sedan"
 * vehicle's category is `'Comfort'`, so `'Comfort'` is what appears here, otherwise
 * filtering by a label that doesn't exist as a category would silently return nothing.
 */
export const SERVICE_TYPES = [
  'Cab with Driver',
  'Local Taxi',
  'Group Transport',
  '4x4 / Mountain Vehicle',
  'Self-Drive Car',
  'Bike / Motorcycle',
  'Local Mobility'
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export const VEHICLE_TYPES_BY_SERVICE_TYPE: Record<ServiceType, string[]> = {
  'Cab with Driver': ['Comfort', 'SUV', 'Premium'],
  'Local Taxi': [],
  'Group Transport': ['Tempo Traveller', 'Mini Bus', 'Coach'],
  '4x4 / Mountain Vehicle': ['4x4'],
  'Self-Drive Car': ['Hatchback', 'Sedan', 'Compact SUV', 'SUV', 'Premium SUV', '4x4', 'Premium', 'Luxury'],
  // Himalayan touring/adventure motorcycle categories only — "Two Wheels. Endless
  // Roads." is a road-trip riding marketplace, not generic local two-wheeler mobility,
  // so Scooty/Scooter is deliberately excluded here even though the category still
  // exists in the schema (models/TransportVehicle.ts) for a future, separate Local
  // Transport/local-rentals scooter offering. 'Standard Motorcycle'/'Adventure
  // Motorcycle' were too vague to be useful business categories; the schema keeps them
  // for backward compatibility but new inventory should use the specific categories below.
  'Bike / Motorcycle': ['Royal Enfield/Bullet', 'Royal Enfield / Classic', 'Adventure / ADV', 'Touring', 'Cruiser', 'Scrambler', 'Roadster', 'Lightweight Adventure'],
  'Local Mobility': []
};

// Derived once at module load — a vehicle-type value maps to more than one service type
// only for '4x4' (both "4x4 / Mountain Vehicle" and "Self-Drive Car" list it).
export const SERVICE_TYPE_BY_VEHICLE_TYPE: Record<string, ServiceType[]> = Object.entries(
  VEHICLE_TYPES_BY_SERVICE_TYPE
).reduce<Record<string, ServiceType[]>>((acc, [serviceType, vehicleTypes]) => {
  for (const vehicleType of vehicleTypes) {
    acc[vehicleType] = [...(acc[vehicleType] ?? []), serviceType as ServiceType];
  }
  return acc;
}, {});

function isServiceType(value: string): value is ServiceType {
  return (SERVICE_TYPES as readonly string[]).includes(value);
}

/** Computed on read from the existing `supportedVehicleCategories` field — never a
 *  separate stored field, so it can't drift out of sync with it. Lives here (rather
 *  than lib/transport.ts, which pulls in mongoose) so client components — e.g. the
 *  Route Booking Popup's ride-style step — can call it without bundling a DB driver. */
export function getRecommendedServiceTypesForRoute(route: TransportRoute): ServiceType[] {
  return Array.from(new Set(route.supportedVehicleCategories.flatMap((category) => SERVICE_TYPE_BY_VEHICLE_TYPE[category] ?? [])));
}

/** Safe lookup for a plain `string` (e.g. search-field state, a query param) rather
 *  than the narrower `ServiceType` union — returns `undefined` for an unrecognized value. */
export function getVehicleTypesForServiceType(serviceType: string): string[] | undefined {
  return isServiceType(serviceType) ? VEHICLE_TYPES_BY_SERVICE_TYPE[serviceType] : undefined;
}

/**
 * The 6 brief-facing services for the "How do you want to travel?" selector and the
 * "Choose Your Ride Style" section — deliberately excludes 'Local Taxi' (zero seeded
 * vehicles, not part of the requested 6-option restructuring; stays a valid, unsurfaced
 * enum value, the same treatment 'Local Mobility' had before it gained real UI surface).
 * `urlSlug` is the public `?service=` value (Local Mobility called out in that field
 * as "Local Transport" to match the brief's user-facing language).
 */
export interface ServiceTypeUiEntry {
  value: ServiceType;
  label: string;
  urlSlug: string;
  description: string;
}

export const SERVICE_TYPE_UI: ServiceTypeUiEntry[] = [
  { value: 'Cab with Driver', label: 'Cab with Driver', urlSlug: 'cab', description: 'Relax while a local driver handles the route.' },
  { value: 'Self-Drive Car', label: 'Self-Drive', urlSlug: 'self-drive', description: 'Take the wheel and explore at your own pace.' },
  { value: 'Group Transport', label: 'Tempo / Group', urlSlug: 'group', description: 'Tempo Travellers, minibuses and coaches for larger groups.' },
  { value: '4x4 / Mountain Vehicle', label: '4x4', urlSlug: '4x4', description: 'For remote and demanding Himalayan routes.' },
  { value: 'Bike / Motorcycle', label: 'Bike Rental', urlSlug: 'bike', description: 'Flexible two-wheel rentals for independent travel.' },
  { value: 'Local Mobility', label: 'Local Transport', urlSlug: 'local', description: 'Destination-specific local transport options.' }
];

export const DEFAULT_SERVICE_TYPE: ServiceType = 'Cab with Driver';

/** Maps a `?service=` slug to a canonical ServiceType — falls back to the default for
 *  anything missing/unrecognized so a page load never fails to resolve a service. */
export function serviceTypeFromUrlSlug(slug?: string): ServiceType {
  return SERVICE_TYPE_UI.find((entry) => entry.urlSlug === slug)?.value ?? DEFAULT_SERVICE_TYPE;
}

export function urlSlugFromServiceType(serviceType: ServiceType): string {
  return SERVICE_TYPE_UI.find((entry) => entry.value === serviceType)?.urlSlug ?? DEFAULT_SERVICE_TYPE;
}

export interface VehicleTypeOption {
  label: string;
  value: string;
}

/**
 * Dropdown options for a service's "Vehicle Type"-style field. For 'Cab with Driver'
 * and 'Group Transport', derives {label: real vehicle name, value: real category} pairs
 * directly from the seeded catalog (config/transport.config.ts) — the brief's own
 * illustrative labels ("Sedan", "Premium SUV", "Mini Bus") don't all match real vehicle
 * names/categories (no "Mini Bus" vehicle is seeded; "Sedan"/"Premium SUV" are vehicle
 * *names*, not their real category values `Comfort`/`Premium`), so deriving from the
 * catalog guarantees every visible option returns real results. Every other service's
 * category values already read fine as generic type labels (Hatchback, SUV, 4x4,
 * Scooty/Scooter, ...), so those reuse VEHICLE_TYPES_BY_SERVICE_TYPE directly.
 */
export function getVehicleTypeOptionsForService(serviceType: ServiceType): VehicleTypeOption[] {
  if (serviceType === 'Cab with Driver' || serviceType === 'Group Transport') {
    return vehicleOptions
      .filter((vehicle) => vehicle.serviceType === serviceType)
      .map((vehicle) => ({ label: vehicle.name, value: vehicle.category ?? vehicle.name }));
  }
  return VEHICLE_TYPES_BY_SERVICE_TYPE[serviceType].map((value) => ({ label: value, value }));
}

/** Search-time trip framing for Cab with Driver — not a stored vehicle field, purely
 *  how the customer describes the trip they need. */
export const TRIP_TYPE_OPTIONS = ['One Way', 'Round Trip', 'Multi-Day', 'Local'];

/** Search-time trip length for 4x4 — alongside Drive Mode, not replacing it. */
export const TRIP_DURATION_OPTIONS = ['Half Day', 'Full Day', 'Multi-Day'];

/**
 * "We Don't Just Arrange a Vehicle" trip-purpose cards (transport discovery). Each
 * purpose configures the Hero's service (and, where meaningful, its Trip Type) rather
 * than representing a stored vehicle field — Remote Himalayan Transfers deliberately
 * maps to 4x4, a real seeded service, rather than fabricating a suitability claim.
 */
export type TripPurpose = 'airport-transfer' | 'local-sightseeing' | 'intercity' | 'multi-day' | 'remote-himalayan' | 'group-travel';

export interface TripPurposeUiEntry {
  value: TripPurpose;
  label: string;
  service: ServiceType;
  tripType?: string;
}

export const TRIP_PURPOSE_UI: TripPurposeUiEntry[] = [
  { value: 'airport-transfer', label: 'Airport & Railway Transfers', service: 'Cab with Driver', tripType: 'One Way' },
  { value: 'local-sightseeing', label: 'Local Sightseeing', service: 'Cab with Driver', tripType: 'Local' },
  { value: 'intercity', label: 'Intercity Transfers', service: 'Cab with Driver', tripType: 'One Way' },
  { value: 'multi-day', label: 'Multi-Day Private Vehicle', service: 'Cab with Driver', tripType: 'Multi-Day' },
  { value: 'remote-himalayan', label: 'Remote Himalayan Transfers', service: '4x4 / Mountain Vehicle' },
  { value: 'group-travel', label: 'Group Travel', service: 'Group Transport' }
];

function isTripPurpose(value: string): value is TripPurpose {
  return TRIP_PURPOSE_UI.some((entry) => entry.value === value);
}

/** Safe lookup for a `?purpose=` query param — returns `undefined` for anything
 *  missing/unrecognized rather than falling back to a default (unlike service, trip
 *  purpose has no meaningful default; simply absent is a valid state). */
export function tripPurposeFromUrlParam(value?: string): TripPurpose | undefined {
  return value && isTripPurpose(value) ? value : undefined;
}

export function labelForTripPurpose(purpose: TripPurpose): string {
  return TRIP_PURPOSE_UI.find((entry) => entry.value === purpose)?.label ?? purpose;
}

/** Converts an incoming query-param vehicle *value* (e.g. "SUV", "Comfort") into the
 *  display *label* (e.g. "SUV", "Sedan") the Vehicle Type field's TravelStyleField
 *  compares against — falls back to the raw value when unrecognized. */
export function vehicleLabelFromValue(serviceType: ServiceType, value: string): string {
  if (!value) return '';
  return getVehicleTypeOptionsForService(serviceType).find((o) => o.value === value)?.label ?? value;
}

/** Converts a Vehicle Type field's display label back into the real category value
 *  used for filtering/query params — falls back to the raw label when unrecognized. */
export function vehicleValueFromLabel(serviceType: ServiceType, label: string): string {
  if (!label) return '';
  return getVehicleTypeOptionsForService(serviceType).find((o) => o.label === label)?.value ?? label;
}

/**
 * "Two Wheels. Endless Roads." motorcycle-TYPE cards — the customer-facing layer
 * above the raw `category` enum (same relationship TRIP_PURPOSE_UI has to
 * service/tripType). Most types map to exactly one real category value, but
 * "Classic / Retro Bikes" legitimately spans two (Royal Enfield/Bullet and Royal
 * Enfield / Classic) — hence `categories: string[]` rather than a single value, and
 * `getVehicles`'s `categoryIn` filter rather than merging those two real enum values.
 */
export interface MotorcycleTypeUiEntry {
  value: string;
  label: string;
  description: string;
  categories: string[];
}

export const MOTORCYCLE_TYPE_UI: MotorcycleTypeUiEntry[] = [
  {
    value: 'adventure-adv',
    label: 'Adventure / ADV Bikes',
    description: 'Built for long mountain journeys and changing road conditions.',
    categories: ['Adventure / ADV']
  },
  {
    value: 'touring',
    label: 'Touring Bikes',
    description: 'Comfortable, stable machines built for covering long highway and hill distances.',
    categories: ['Touring']
  },
  {
    value: 'classic-retro',
    label: 'Classic / Retro Bikes',
    description: 'The timeless thump of a Royal Enfield on a Himalayan road trip.',
    categories: ['Royal Enfield/Bullet', 'Royal Enfield / Classic']
  },
  {
    value: 'cruiser',
    label: 'Cruiser Bikes',
    description: 'Relaxed, low-seat riding built for easy highway stretches.',
    categories: ['Cruiser']
  },
  {
    value: 'scrambler',
    label: 'Scrambler Bikes',
    description: 'A do-it-all ride for mixed tarmac and light off-road stretches.',
    categories: ['Scrambler']
  },
  {
    value: 'lightweight-adventure',
    label: 'Lightweight Adventure Bikes',
    description: 'Agile, easy-to-handle bikes for first-time mountain riders.',
    categories: ['Lightweight Adventure']
  },
  {
    value: 'roadster',
    label: 'Roadster / Street Touring Bikes',
    description: 'Naked-street performance for riders who want a livelier ride.',
    categories: ['Roadster']
  }
];

function isMotorcycleTypeValue(value: string): boolean {
  return MOTORCYCLE_TYPE_UI.some((entry) => entry.value === value);
}

/** Safe lookup for a `?bikeType=` query param — returns `undefined` for anything
 *  missing/unrecognized. */
export function motorcycleTypeFromUrlParam(value?: string): string | undefined {
  return value && isMotorcycleTypeValue(value) ? value : undefined;
}

/** Returns the real category values a motorcycle type covers, or `undefined` when
 *  `value` isn't a recognized type — callers should fall back to no category filter
 *  in that case rather than an empty (always-zero-results) `categoryIn`. */
export function categoriesForMotorcycleType(value?: string): string[] | undefined {
  return MOTORCYCLE_TYPE_UI.find((entry) => entry.value === value)?.categories;
}

/**
 * "Drive the Himalayas Your Way" self-drive CAR-TYPE cards — the customer-facing
 * discovery layer above the raw `category` enum. Unlike motorcycle types, every
 * self-drive type maps to exactly one real category value (no "Classic/Retro"-style
 * span), so this deliberately reuses the existing `?vehicle=`/`category` filter
 * directly rather than introducing a second categoryIn-style mechanism — `category`
 * IS the value clicking a card writes to the URL and IS what `getVehicles` filters on.
 */
export interface SelfDriveCarTypeUiEntry {
  /** Real `TransportVehicle.category` value — also the `?vehicle=` value a card click writes. */
  category: string;
  label: string;
  tagline: string;
  description: string;
  ctaLabel: string;
  /** Discovery popup header — e.g. "Self-Drive Sedans" — opened in-place by a card
   *  click rather than a full-page navigation. */
  popupTitle: string;
}

export const SELF_DRIVE_CAR_TYPE_UI: SelfDriveCarTypeUiEntry[] = [
  {
    category: 'Hatchback',
    label: 'Hatchback',
    tagline: 'Easy & Economical',
    description: 'Best for towns, short routes and budget self-drive trips.',
    ctaLabel: 'Explore Hatchbacks',
    popupTitle: 'Self-Drive Hatchbacks'
  },
  {
    category: 'Sedan',
    label: 'Sedan',
    tagline: 'Comfort for Longer Drives',
    description: 'Suitable for highway journeys and comfortable intercity travel.',
    ctaLabel: 'Explore Sedans',
    popupTitle: 'Self-Drive Sedans'
  },
  {
    category: 'Compact SUV',
    label: 'Compact SUV',
    tagline: 'Versatile Hill Explorer',
    description: 'Extra road presence and practicality for Himalayan road trips.',
    ctaLabel: 'Explore Compact SUVs',
    popupTitle: 'Self-Drive Compact SUVs'
  },
  {
    category: 'SUV',
    label: 'SUV',
    tagline: 'Space for Mountain Journeys',
    description: 'Suitable for families, luggage and longer hill journeys.',
    ctaLabel: 'Explore SUVs',
    popupTitle: 'Self-Drive SUVs'
  },
  {
    category: 'Premium SUV',
    label: 'Premium SUV',
    tagline: 'Elevated Road-Trip Comfort',
    description: 'A premium self-drive category for travellers wanting additional comfort.',
    ctaLabel: 'Explore Premium SUVs',
    popupTitle: 'Self-Drive Premium SUVs'
  },
  {
    category: '4x4',
    label: '4x4 / AWD',
    tagline: 'For Demanding Routes',
    description: 'Only where a genuine self-drive 4x4/AWD vehicle is actually available for this route.',
    ctaLabel: 'Explore 4x4 / AWD',
    popupTitle: 'Self-Drive 4x4 / AWD'
  }
];

/** Safe lookup for a self-drive car-type popup's UI entry, or `undefined` when
 *  `category` isn't one of the 6 canonical discovery types (e.g. no popup entry). */
export function selfDriveCarTypeEntry(category: string): SelfDriveCarTypeUiEntry | undefined {
  return SELF_DRIVE_CAR_TYPE_UI.find((entry) => entry.category === category);
}

/**
 * "4x4 Himalayan Vehicles" discovery cards — exactly 3 customer-facing entry points,
 * each opening a guided journey popup rather than a plain filter. All 3 stay within
 * the single `'4x4 / Mountain Vehicle'` serviceType (never mixed with `'Self-Drive
 * Car'`): "With Driver" and "Self-Drive" are split by the real `withDriver` boolean
 * already on TransportVehicle, and "Expeditions" is real `withDriver: true` inventory
 * additionally flagged `mountainSuitable`/`remoteRouteSuitable` — no fabricated
 * expedition/package data model.
 */
export type FourByFourVariant = 'with-driver' | 'self-drive' | 'expedition';

export interface FourByFourTypeUiEntry {
  value: FourByFourVariant;
  label: string;
  tagline: string;
  description: string;
  ctaLabel: string;
  /** Discovery popup header. */
  popupTitle: string;
  /** Honest empty-state copy — shown only when this variant's real, filtered
   *  inventory is empty; never a fabricated availability claim. */
  emptyStateMessage: string;
  /** Empty-state / no-exact-match CTA — always hands off to the existing
   *  BookingRequestModal, never a dead end. */
  requestLabel: string;
}

export const FOUR_BY_FOUR_TYPE_UI: FourByFourTypeUiEntry[] = [
  {
    value: 'with-driver',
    label: '4x4 With Driver',
    tagline: 'Chauffeur-Driven Mountain Travel',
    description: 'Chauffeur-driven 4x4 transport for Himalayan journeys, with an experienced local driver.',
    ctaLabel: 'Plan Your 4x4 Journey',
    popupTitle: 'Plan Your 4x4 Journey',
    emptyStateMessage: "We don't currently have a listed 4x4 matching this journey.",
    requestLabel: 'Request a Custom 4x4'
  },
  {
    value: 'self-drive',
    label: 'Self-Drive 4x4',
    tagline: 'Take the Wheel',
    description: 'Rent a 4x4 and drive it yourself — only where a genuine self-drive 4x4 is actually available.',
    ctaLabel: 'Plan Your Rental',
    popupTitle: 'Plan Your Self-Drive 4x4',
    emptyStateMessage: 'No Self-Drive 4x4 is currently listed for your trip.',
    requestLabel: 'Request a Self-Drive 4x4'
  },
  {
    value: 'expedition',
    label: '4x4 Expeditions',
    tagline: 'A Planned Himalayan Journey',
    description: 'A guided, multi-day 4x4 route through remote and high-altitude Himalayan terrain.',
    ctaLabel: 'Plan a 4x4 Expedition',
    popupTitle: 'Plan a 4x4 Expedition',
    emptyStateMessage: 'Tell us your expedition plan and our team will help source the right 4x4 and route plan.',
    requestLabel: 'Request Expedition Plan'
  }
];

/** Safe lookup for a 4x4 discovery card's UI entry, or `undefined` when `value` isn't
 *  one of the 3 canonical variants. */
export function fourByFourTypeEntry(value?: string): FourByFourTypeUiEntry | undefined {
  return FOUR_BY_FOUR_TYPE_UI.find((entry) => entry.value === value);
}
