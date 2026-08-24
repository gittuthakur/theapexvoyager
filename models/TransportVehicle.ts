import mongoose, { Schema, type Document, type Types } from 'mongoose';

const { model, models } = mongoose;

export type TransportVehicleCategory =
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

export type TransportServiceType =
  | 'Cab with Driver'
  | 'Local Taxi'
  | 'Group Transport'
  | '4x4 / Mountain Vehicle'
  | 'Self-Drive Car'
  | 'Bike / Motorcycle'
  | 'Local Mobility';

export interface TransportVehicleDocument extends Document {
  slug: string;
  name: string;
  category: TransportVehicleCategory;
  images: string[];
  seats: number;
  luggageCapacity?: string;
  acType?: 'AC' | 'Non-AC';
  inclusions: string[];
  exclusions?: string[];
  serviceAreas: string[];
  estimatedFromPrice: number;
  priceNote?: string;
  description: string;
  active: boolean;
  featured?: boolean;
  /** Backfilled by scripts/backfillRegionRefs.ts from `serviceAreas` — an array (not a
   *  single regionId) because every seeded vehicle's serviceAreas already lists all
   *  three region names directly (see config/transport.config.ts's SERVICE_AREAS), so a
   *  vehicle genuinely covers more than one region, unlike Hotel/Journey/Tour. */
  regionIds?: Types.ObjectId[];

  /** Broader grouping than `category` — drives the search field's dependent Vehicle
   *  Type dropdown (see config/transportServiceTypes.config.ts). Required; existing
   *  vehicles get it via config/transport.config.ts + scripts/backfillTransportServiceType.ts. */
  serviceType: TransportServiceType;
  /** Present only for destination-specific Local Mobility vehicles — mirrors
   *  Journey.destinationSlugs. Absent (all 5 pre-existing vehicles) = today's
   *  region-wide behavior, unchanged. */
  destinationSlugs?: string[];
  /** Links a Local Mobility vehicle to the partner that operates it. */
  partnerId?: Types.ObjectId;

  // --- Self-Drive fields (all optional; estimatedFromPrice/priceNote are reused as the
  //     daily rental rate — no duplicate price field) ---
  securityDeposit?: number;
  includedKilometres?: number;
  extraKmCharge?: number;
  fuelPolicy?: string;
  minimumAge?: number;
  drivingLicenceRequired?: string;
  dropOffPolicy?: string;
  transmission?: 'Manual' | 'Automatic';

  // --- Bike/Motorcycle fields (optional) ---
  helmetAvailable?: boolean;
  engineCategory?: string;
  licenceRequired?: string;
  rentalTerms?: string;

  // --- 4x4 fields (optional) ---
  withDriver?: boolean;
  mountainSuitable?: boolean;
  remoteRouteSuitable?: boolean;
  pickupLocation?: string;
}

const TransportVehicleSchema = new Schema<TransportVehicleDocument>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'Comfort',
        'SUV',
        'Tempo Traveller',
        'Premium',
        'Coach',
        'Mini Bus',
        '4x4',
        'Hatchback',
        'Sedan',
        'Compact SUV',
        'Premium SUV',
        'Luxury',
        'Scooty/Scooter',
        'Standard Motorcycle',
        'Royal Enfield/Bullet',
        'Adventure Motorcycle',
        'Adventure / ADV',
        'Touring',
        'Royal Enfield / Classic',
        'Cruiser',
        'Scrambler',
        'Roadster',
        'Lightweight Adventure'
      ],
      required: true
    },
    images: { type: [String], required: true },
    seats: { type: Number, required: true },
    luggageCapacity: { type: String },
    acType: { type: String, enum: ['AC', 'Non-AC'] },
    inclusions: { type: [String], required: true },
    exclusions: { type: [String] },
    serviceAreas: { type: [String], required: true },
    estimatedFromPrice: { type: Number, required: true },
    priceNote: { type: String },
    description: { type: String, required: true },
    active: { type: Boolean, required: true, default: true },
    featured: { type: Boolean },
    regionIds: { type: [Schema.Types.ObjectId], ref: 'Region' },
    serviceType: {
      type: String,
      enum: [
        'Cab with Driver',
        'Local Taxi',
        'Group Transport',
        '4x4 / Mountain Vehicle',
        'Self-Drive Car',
        'Bike / Motorcycle',
        'Local Mobility'
      ],
      required: true
    },
    destinationSlugs: { type: [String] },
    partnerId: { type: Schema.Types.ObjectId, ref: 'TransportPartner' },
    securityDeposit: { type: Number },
    includedKilometres: { type: Number },
    extraKmCharge: { type: Number },
    fuelPolicy: { type: String },
    minimumAge: { type: Number },
    drivingLicenceRequired: { type: String },
    dropOffPolicy: { type: String },
    transmission: { type: String, enum: ['Manual', 'Automatic'] },
    helmetAvailable: { type: Boolean },
    engineCategory: { type: String },
    licenceRequired: { type: String },
    rentalTerms: { type: String },
    withDriver: { type: Boolean },
    mountainSuitable: { type: Boolean },
    remoteRouteSuitable: { type: Boolean },
    pickupLocation: { type: String }
  },
  { timestamps: true }
);

// Matches getVehicles()'s default sort (lib/transport.ts) so an unfiltered listing reads
// straight off the index instead of an in-memory sort of the full collection.
TransportVehicleSchema.index({ featured: -1, createdAt: 1 });
// Supports the `category` filter in getVehicles().
TransportVehicleSchema.index({ category: 1 });
// Supports the Region Hub's per-region transport listing.
TransportVehicleSchema.index({ regionIds: 1, active: 1, featured: -1 });
// Supports the new Service Type search filter and the Self-Drive/Bike rental sections.
TransportVehicleSchema.index({ serviceType: 1, active: 1, featured: -1 });
// Supports the Local Mobility section's per-destination lookup.
TransportVehicleSchema.index({ destinationSlugs: 1 });
// Supports listing a partner's vehicles.
TransportVehicleSchema.index({ partnerId: 1 });

// `models.TransportVehicle` survives Next.js dev hot-reloads — without this guard, re-running
// this module would call `model()` on an already-registered name and throw.
export const TransportVehicle =
  models.TransportVehicle ?? model<TransportVehicleDocument>('TransportVehicle', TransportVehicleSchema);
