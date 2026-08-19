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
  category?: 'Comfort' | 'SUV' | 'Tempo Traveller' | 'Premium' | 'Coach';
  images?: string[];
  luggageCapacity?: string;
  acType?: 'AC' | 'Non-AC';
  exclusions?: string[];
  serviceAreas?: string[];
  active?: boolean;
  featured?: boolean;
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
}
