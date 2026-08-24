import { images } from '@/config/images.config';
import type { VehicleOption } from '@/types/transport';

/**
 * Demo transport catalog — seeded into the TransportVehicle collection by scripts/seed.ts
 * and used as lib/transport.ts's fallback when the DB is empty/unreachable. Prices are
 * illustrative "Estimated from" starting figures for this demo, not live/externally-sourced
 * rates — final pricing is confirmed by The Apex Voyager team over WhatsApp.
 */
export const SERVICE_AREAS = ['Himachal Pradesh', 'Jammu & Kashmir', 'Uttarakhand', 'Chandigarh', 'Delhi'];

export const vehicleOptions: VehicleOption[] = [
  {
    id: 'sedan',
    slug: 'sedan',
    name: 'Sedan',
    category: 'Comfort',
    serviceType: 'Cab with Driver',
    seats: 4,
    image: images.destinations.shimla,
    images: [images.destinations.shimla],
    estimatedFromPrice: 4500,
    priceNote: 'per day, inclusive of driver & fuel within Himachal/Kashmir/Uttarakhand',
    inclusions: ['Driver allowance', 'Fuel included', 'Toll & parking extra'],
    exclusions: ['Interstate permits', 'Night driving allowance'],
    luggageCapacity: '2 medium bags',
    acType: 'AC',
    serviceAreas: SERVICE_AREAS,
    active: true,
    description: 'An economical, city-friendly ride for couples or small groups touring plains and low-altitude routes.'
  },
  {
    id: 'suv',
    slug: 'suv',
    name: 'SUV',
    category: 'SUV',
    serviceType: 'Cab with Driver',
    seats: 6,
    image: images.toursHero,
    images: [images.toursHero],
    estimatedFromPrice: 6500,
    priceNote: 'per day, inclusive of driver & fuel within Himachal/Kashmir/Uttarakhand',
    inclusions: ['Driver allowance', 'Fuel included', 'Toll & parking extra', 'Luggage carrier'],
    exclusions: ['Interstate permits', 'Night driving allowance'],
    luggageCapacity: '4 large bags',
    acType: 'AC',
    serviceAreas: SERVICE_AREAS,
    active: true,
    featured: true,
    description: 'A comfortable, sure-footed choice for mountain roads — ideal for small families or groups of friends.'
  },
  {
    id: 'tempo-traveller',
    slug: 'tempo-traveller',
    name: 'Tempo Traveller',
    category: 'Tempo Traveller',
    serviceType: 'Group Transport',
    seats: 14,
    image: images.destinations.manali,
    images: [images.destinations.manali],
    estimatedFromPrice: 9500,
    priceNote: 'per day, inclusive of driver & fuel within Himachal/Kashmir/Uttarakhand',
    inclusions: ['Driver allowance', 'Fuel included', 'Toll & parking extra', 'Luggage carrier'],
    exclusions: ['Interstate permits', 'Night driving allowance'],
    luggageCapacity: '8+ large bags',
    acType: 'AC',
    serviceAreas: SERVICE_AREAS,
    active: true,
    description: 'A spacious option built for larger groups and family reunions travelling together across the Himalayas.'
  },
  {
    id: 'premium-suv',
    slug: 'premium-suv',
    name: 'Premium SUV',
    category: 'Premium',
    serviceType: 'Cab with Driver',
    seats: 6,
    image: images.destinations.dharamshala,
    images: [images.destinations.dharamshala],
    estimatedFromPrice: 12000,
    priceNote: 'per day, inclusive of driver & fuel within Himachal/Kashmir/Uttarakhand',
    inclusions: ['Driver allowance', 'Fuel included', 'Toll & parking extra', 'Luggage carrier', 'Premium interiors'],
    exclusions: ['Interstate permits', 'Night driving allowance'],
    luggageCapacity: '4 large bags',
    acType: 'AC',
    serviceAreas: SERVICE_AREAS,
    active: true,
    description: 'A refined, top-spec vehicle for special occasions and travellers who want an extra layer of comfort.'
  },
  {
    id: 'coach',
    slug: 'coach',
    name: 'Coach / Mini Bus',
    category: 'Coach',
    serviceType: 'Group Transport',
    seats: 32,
    image: images.destinations.kinnaur,
    images: [images.destinations.kinnaur],
    estimatedFromPrice: 18000,
    priceNote: 'per day, inclusive of driver & fuel within Himachal/Kashmir/Uttarakhand',
    inclusions: ['Driver allowance', 'Fuel included', 'Toll & parking extra', 'Luggage hold'],
    exclusions: ['Interstate permits', 'Night driving allowance'],
    luggageCapacity: 'Full luggage hold',
    acType: 'AC',
    serviceAreas: SERVICE_AREAS,
    active: true,
    description: 'Built for corporate groups, large tours and events travelling together in one vehicle.'
  }
];
