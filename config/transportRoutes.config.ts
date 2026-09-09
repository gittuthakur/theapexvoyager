import type { TransportRoute } from '@/types/transport';

/**
 * Demo popular-routes catalog — seeded into the TransportRoute collection by scripts/seed.ts
 * and used as lib/transport.ts's fallback when the DB is empty/unreachable. Fares are
 * illustrative starting figures, not live/externally-sourced rates.
 */
export const transportRoutes: TransportRoute[] = [
  {
    origin: 'Chandigarh',
    destination: 'Shimla',
    routeType: 'Intercity Transfer',
    estimatedDuration: '3-4 hours',
    distanceKm: 115,
    supportedVehicleCategories: ['Comfort', 'SUV', 'Premium'],
    startingFare: 4500,
    seasonalStatus: 'Year-round',
    active: true,
    featured: true
  },
  {
    origin: 'Delhi',
    destination: 'Manali',
    routeType: 'Intercity Transfer',
    estimatedDuration: '12-14 hours',
    distanceKm: 540,
    supportedVehicleCategories: ['SUV', 'Tempo Traveller', 'Premium'],
    startingFare: 9500,
    seasonalStatus: 'Year-round',
    active: true,
    featured: true
  },
  {
    origin: 'Shimla',
    destination: 'Manali',
    routeType: 'Intercity Transfer',
    estimatedDuration: '7-8 hours',
    distanceKm: 250,
    supportedVehicleCategories: ['Comfort', 'SUV', 'Tempo Traveller'],
    startingFare: 6500,
    seasonalStatus: 'Year-round',
    active: true,
    featured: true
  },
  {
    origin: 'Manali',
    destination: 'Spiti Valley',
    routeType: 'Remote Himalayan Transfer',
    estimatedDuration: '8-9 hours',
    distanceKm: 200,
    supportedVehicleCategories: ['SUV', 'Premium'],
    startingFare: 9500,
    seasonalStatus: 'Seasonal (May-Oct)',
    active: true,
    featured: true
  },
  {
    origin: 'Shimla',
    destination: 'Kinnaur',
    routeType: 'Remote Himalayan Transfer',
    estimatedDuration: '6-7 hours',
    distanceKm: 235,
    supportedVehicleCategories: ['SUV', 'Premium'],
    startingFare: 8500,
    seasonalStatus: 'Seasonal (Mar-Nov)',
    active: true,
    featured: true
  },
  {
    origin: 'Chandigarh',
    destination: 'Dharamshala',
    routeType: 'Intercity Transfer',
    estimatedDuration: '6-7 hours',
    distanceKm: 240,
    supportedVehicleCategories: ['Comfort', 'SUV', 'Tempo Traveller'],
    startingFare: 6000,
    seasonalStatus: 'Year-round',
    active: true,
    featured: true
  },
  {
    origin: 'Srinagar Airport',
    destination: 'Srinagar',
    routeType: 'Airport Transfer',
    estimatedDuration: '30-40 minutes',
    distanceKm: 14,
    supportedVehicleCategories: ['Comfort', 'SUV', 'Premium'],
    startingFare: 1200,
    seasonalStatus: 'Year-round',
    active: true,
    featured: true
  },
  {
    origin: 'Srinagar',
    destination: 'Gulmarg',
    routeType: 'Intercity Transfer',
    estimatedDuration: '1.5-2 hours',
    distanceKm: 51,
    supportedVehicleCategories: ['Comfort', 'SUV', 'Premium'],
    startingFare: 3500,
    seasonalStatus: 'Year-round',
    active: true,
    featured: true
  },
  {
    origin: 'Srinagar',
    destination: 'Pahalgam',
    routeType: 'Intercity Transfer',
    estimatedDuration: '2-3 hours',
    distanceKm: 95,
    supportedVehicleCategories: ['SUV', 'Premium', 'Tempo Traveller'],
    startingFare: 4500,
    seasonalStatus: 'Year-round',
    active: true,
    featured: true
  },
  {
    origin: 'Srinagar',
    destination: 'Sonamarg',
    routeType: 'Intercity Transfer',
    estimatedDuration: '2-3 hours',
    distanceKm: 80,
    supportedVehicleCategories: ['SUV', 'Premium'],
    startingFare: 4200,
    seasonalStatus: 'Seasonal (Apr-Nov)',
    active: true,
    featured: true
  },
  {
    origin: 'Dehradun Airport',
    destination: 'Dehradun',
    routeType: 'Airport Transfer',
    estimatedDuration: '40-50 minutes',
    distanceKm: 25,
    supportedVehicleCategories: ['Comfort', 'SUV', 'Premium'],
    startingFare: 1600,
    seasonalStatus: 'Year-round',
    active: true,
    featured: true
  },
  {
    origin: 'Dehradun',
    destination: 'Mussoorie',
    routeType: 'Intercity Transfer',
    estimatedDuration: '1.5 hours',
    distanceKm: 36,
    supportedVehicleCategories: ['Comfort', 'SUV', 'Premium'],
    startingFare: 2200,
    seasonalStatus: 'Year-round',
    active: true,
    featured: true
  },
  {
    origin: 'Dehradun',
    destination: 'Rishikesh',
    routeType: 'Intercity Transfer',
    estimatedDuration: '1-1.5 hours',
    distanceKm: 43,
    supportedVehicleCategories: ['Comfort', 'SUV'],
    startingFare: 1900,
    seasonalStatus: 'Year-round',
    active: true,
    featured: true
  },
  {
    origin: 'Rishikesh',
    destination: 'Joshimath',
    routeType: 'Remote Himalayan Transfer',
    estimatedDuration: '8-10 hours',
    distanceKm: 254,
    supportedVehicleCategories: ['SUV', 'Premium'],
    startingFare: 13500,
    seasonalStatus: 'Seasonal (Apr-Nov)',
    active: true,
    featured: true
  },
  {
    origin: 'Joshimath',
    destination: 'Auli',
    routeType: 'Intercity Transfer',
    estimatedDuration: '30-40 minutes',
    distanceKm: 13,
    supportedVehicleCategories: ['Comfort', 'SUV'],
    startingFare: 1200,
    seasonalStatus: 'Year-round',
    active: true,
    featured: true
  },
  {
    origin: 'Rishikesh',
    destination: 'Chopta',
    routeType: 'Remote Himalayan Transfer',
    estimatedDuration: '6-7 hours',
    distanceKm: 165,
    supportedVehicleCategories: ['SUV', 'Premium'],
    startingFare: 9500,
    seasonalStatus: 'Seasonal (Apr-Nov)',
    active: true,
    featured: true
  },
  {
    origin: 'Dehradun',
    destination: 'Lansdowne',
    routeType: 'Intercity Transfer',
    estimatedDuration: '4 hours',
    distanceKm: 155,
    supportedVehicleCategories: ['Comfort', 'SUV', 'Premium'],
    startingFare: 7000,
    seasonalStatus: 'Year-round',
    active: true,
    featured: true
  }
];
