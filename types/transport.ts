export type VehicleCategory =
  | 'Comfort'
  | 'SUV'
  | 'Tempo Traveller'
  | 'Premium'
  | 'Coach'
  | 'Mini Bus'
  | '4x4'
  | 'Hatchback'
  | 'Sedan'
  | 'Compact SUV'
  | 'Premium SUV'
  | 'Luxury'
  | 'Scooty/Scooter'
  | 'Standard Motorcycle'
  | 'Royal Enfield/Bullet'
  | 'Adventure Motorcycle'
  | 'Adventure / ADV'
  | 'Touring'
  | 'Royal Enfield / Classic'
  | 'Cruiser'
  | 'Scrambler'
  | 'Roadster'
  | 'Lightweight Adventure';

export type VehicleServiceType =
  | 'Cab with Driver'
  | 'Local Taxi'
  | 'Group Transport'
  | '4x4 / Mountain Vehicle'
  | 'Self-Drive Car'
  | 'Bike / Motorcycle'
  | 'Local Mobility';

export interface VehicleOption {
  id: string;
  name: string;
  seats: number;
  image: string;
  estimatedFromPrice: number;
  priceNote: string;
  inclusions: string[];
  description: string;
  /** Stable slug for linking/filtering — falls back to `id` for entries seeded before this field existed. */
  slug?: string;
  category?: VehicleCategory;
  images?: string[];
  luggageCapacity?: string;
  acType?: 'AC' | 'Non-AC';
  exclusions?: string[];
  serviceAreas?: string[];
  active?: boolean;
  featured?: boolean;
  /** ObjectId(s) (as strings) of the MongoDB Region documents this vehicle serves — every seeded vehicle covers all regions, see models/TransportVehicle.ts. */
  regionIds?: string[];

  /** Broader grouping than `category` — see config/transportServiceTypes.config.ts. */
  serviceType?: VehicleServiceType;
  /** Present only for destination-specific Local Mobility vehicles. */
  destinationSlugs?: string[];
  /** The TransportPartner (as a string id) operating this vehicle, if any. */
  partnerId?: string;

  // Self-Drive fields
  securityDeposit?: number;
  includedKilometres?: number;
  extraKmCharge?: number;
  fuelPolicy?: string;
  minimumAge?: number;
  drivingLicenceRequired?: string;
  dropOffPolicy?: string;
  transmission?: 'Manual' | 'Automatic';

  // Bike/Motorcycle fields
  helmetAvailable?: boolean;
  engineCategory?: string;
  licenceRequired?: string;
  rentalTerms?: string;

  // 4x4 fields
  withDriver?: boolean;
  mountainSuitable?: boolean;
  remoteRouteSuitable?: boolean;
  pickupLocation?: string;
}

export interface TransportRoute {
  origin: string;
  destination: string;
  routeType?: string;
  estimatedDuration?: string;
  distanceKm?: number;
  supportedVehicleCategories: string[];
  startingFare?: number;
  seasonalStatus?: string;
  active?: boolean;
  featured?: boolean;
  /** ObjectId (as a string) of the MongoDB Region document this route belongs to — see models/Region.ts. */
  regionId?: string;
}
