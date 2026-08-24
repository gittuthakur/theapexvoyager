import { images } from '@/config/images.config';
import { SERVICE_AREAS } from '@/config/transport.config';
import type { VehicleOption } from '@/types/transport';

/**
 * Modest starter catalog for the new rental service types — same "demo transport
 * catalog" convention as config/transport.config.ts (seeded into TransportVehicle by
 * scripts/seed.ts), kept in a sibling file so that file's diff for the 5 pre-existing
 * vehicles stays a one-field (`serviceType`) addition per entry. Region-wide
 * (serviceAreas, no destinationSlugs/partnerId) — these are regular fleet additions,
 * distinct from Local Mobility, which intentionally ships with zero seeded content.
 * Prices are illustrative "Estimated from" starting figures, not live/externally-sourced.
 */
export const rentalVehicleOptions: VehicleOption[] = [
  {
    id: 'self-drive-hatchback',
    slug: 'self-drive-hatchback',
    name: 'Self-Drive Hatchback',
    category: 'Hatchback',
    serviceType: 'Self-Drive Car',
    seats: 4,
    image: images.destinations.kasol,
    images: [images.destinations.kasol],
    estimatedFromPrice: 1800,
    priceNote: 'per day, self-drive, 100 km included',
    inclusions: ['100 km/day included', 'Basic insurance'],
    exclusions: ['Fuel', 'Tolls & parking'],
    acType: 'AC',
    serviceAreas: SERVICE_AREAS,
    active: true,
    description: 'A compact, easy-to-drive hatchback for exploring towns and low-altitude routes at your own pace.',
    securityDeposit: 5000,
    includedKilometres: 100,
    extraKmCharge: 10,
    fuelPolicy: 'Same-to-same — return with the same fuel level as pickup.',
    minimumAge: 21,
    drivingLicenceRequired: 'Valid Indian driving licence held for 1+ year.',
    dropOffPolicy: 'Same-city drop-off only, unless agreed in advance.',
    transmission: 'Manual'
  },
  {
    id: 'self-drive-suv',
    slug: 'self-drive-suv',
    name: 'Self-Drive SUV',
    category: 'SUV',
    serviceType: 'Self-Drive Car',
    seats: 6,
    image: images.destinations.spitiValley,
    images: [images.destinations.spitiValley],
    estimatedFromPrice: 3200,
    priceNote: 'per day, self-drive, 100 km included',
    inclusions: ['100 km/day included', 'Basic insurance', 'Luggage carrier'],
    exclusions: ['Fuel', 'Tolls & parking'],
    acType: 'AC',
    serviceAreas: SERVICE_AREAS,
    active: true,
    description: 'A sure-footed self-drive SUV for small groups who want the freedom to set their own itinerary.',
    securityDeposit: 10000,
    includedKilometres: 100,
    extraKmCharge: 15,
    fuelPolicy: 'Same-to-same — return with the same fuel level as pickup.',
    minimumAge: 23,
    drivingLicenceRequired: 'Valid Indian driving licence held for 2+ years.',
    dropOffPolicy: 'Same-city drop-off only, unless agreed in advance.',
    transmission: 'Automatic'
  },
  {
    id: 'royal-enfield-bullet-350',
    slug: 'royal-enfield-bullet-350',
    name: 'Royal Enfield Bullet 350 (or similar)',
    category: 'Royal Enfield/Bullet',
    serviceType: 'Bike / Motorcycle',
    seats: 2,
    image: images.tours.manaliLehHighway,
    images: [images.tours.manaliLehHighway],
    estimatedFromPrice: 1500,
    priceNote: 'per day, self-ride',
    inclusions: ['Helmet provided', 'Basic insurance'],
    exclusions: ['Fuel', 'Tolls & permits'],
    serviceAreas: SERVICE_AREAS,
    active: true,
    featured: true,
    description: 'A classic touring motorcycle for riders who want the Himalayan roads to themselves.',
    securityDeposit: 5000,
    engineCategory: '350cc',
    helmetAvailable: true,
    licenceRequired: 'Valid motorcycle licence (gear/non-gear as applicable).',
    rentalTerms: 'Minimum 1-day rental. Late return charged per hour.'
  },
  {
    id: 'royal-enfield-himalayan',
    slug: 'royal-enfield-himalayan',
    name: 'Royal Enfield Himalayan (or similar)',
    category: 'Adventure / ADV',
    serviceType: 'Bike / Motorcycle',
    seats: 2,
    image: images.tours.spitiCircuit,
    images: [images.tours.spitiCircuit],
    estimatedFromPrice: 2200,
    priceNote: 'per day, self-ride',
    inclusions: ['Helmet provided', 'Basic insurance'],
    exclusions: ['Fuel', 'Tolls & permits'],
    serviceAreas: SERVICE_AREAS,
    active: true,
    featured: true,
    description: 'A rugged adventure motorcycle built for high-altitude Himalayan passes and long touring days.',
    securityDeposit: 6000,
    engineCategory: '411cc',
    helmetAvailable: true,
    licenceRequired: 'Valid motorcycle licence (gear).',
    rentalTerms: 'Minimum 1-day rental. Late return charged per hour.'
  },
  {
    // Kept inactive rather than deleted — "Two Wheels. Endless Roads." is a Himalayan
    // touring-motorcycle marketplace, not generic local two-wheeler mobility, so a
    // scooter no longer belongs in this section's live inventory. The category still
    // exists in the schema (models/TransportVehicle.ts) and this record is left intact
    // so a future, separate Local Transport/local-rentals scooter offering can reuse it
    // (flip `active` back on and move `serviceType` to 'Local Mobility' with real
    // `destinationSlugs` when that capability is actually built).
    id: 'scooty-scooter',
    slug: 'scooty-scooter',
    name: 'Scooty / Scooter (or similar)',
    category: 'Scooty/Scooter',
    serviceType: 'Bike / Motorcycle',
    seats: 2,
    image: images.tours.dharamshalaRetreat,
    images: [images.tours.dharamshalaRetreat],
    estimatedFromPrice: 500,
    priceNote: 'per day, self-ride',
    inclusions: ['Helmet provided', 'Basic insurance'],
    exclusions: ['Fuel'],
    serviceAreas: SERVICE_AREAS,
    active: false,
    description: 'A light, easy-to-handle scooter for getting around town and nearby sights.',
    securityDeposit: 2000,
    engineCategory: '110-125cc',
    helmetAvailable: true,
    licenceRequired: 'Valid two-wheeler licence.',
    rentalTerms: 'Minimum 1-day rental. Late return charged per hour.'
  },
  {
    id: '4x4-with-driver',
    slug: '4x4-with-driver',
    name: '4x4 With Driver',
    category: '4x4',
    serviceType: '4x4 / Mountain Vehicle',
    seats: 5,
    image: images.experiences.kinnaurTrek,
    images: [images.experiences.kinnaurTrek],
    estimatedFromPrice: 7500,
    priceNote: 'per day, inclusive of driver & fuel within Himachal/Kashmir/Uttarakhand',
    inclusions: ['Driver allowance', 'Fuel included', 'Mountain-rated tyres'],
    exclusions: ['Interstate permits', 'Night driving allowance'],
    acType: 'AC',
    serviceAreas: SERVICE_AREAS,
    active: true,
    featured: true,
    description: 'A mountain-ready 4x4 with an experienced driver, built for remote and high-altitude Himalayan routes.',
    withDriver: true,
    mountainSuitable: true,
    remoteRouteSuitable: true
  }
];
