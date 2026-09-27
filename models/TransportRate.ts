import mongoose, { Schema, type Document, type Types } from 'mongoose';

const { model, models } = mongoose;

/**
 * The genuine Transport supplier-rate ledger — introduced in TP2 to fill the gap TP1's
 * forensic audit found: TransportPartner (models/TransportPartner.ts) is a lead-intake
 * record, not a rate table, and none of TransportVehicle.estimatedFromPrice /
 * TransportRoute.startingFare / Journey transportOptions[].extraPrice / Trip Planner
 * TRANSPORT_MODES[].perDayRate are backed by a real, identifiable supplier — TP1
 * classified every one of those as SEED/DEMO or HARDCODED/UNVERIFIED. This collection
 * must start, and stay, empty until a real supplier rate is entered through
 * services/pricing/transportPricing.service.ts's createTransportRate — never seeded,
 * never migrated from any of the values above (TP2 Section 29, an absolute gate).
 *
 * supplierCost here is what the transport supplier charges Apex Voyager, NOT the
 * customer-facing selling price — that separation is deliberate (TP1 Section 18 /
 * TP2 Section 6). A future Journey pricing phase applies a controlled markup on top;
 * this model does not store or compute one.
 */

// Mirrors models/TransportVehicle.ts's TransportVehicleCategory values exactly, kept as
// an independent literal list rather than importing that model's enum so this file never
// has to modify TransportVehicle.ts to add a pricing concept to it. Keep the two lists in
// sync if a vehicle category is ever added/removed there.
export const TRANSPORT_RATE_VEHICLE_CATEGORIES = [
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
] as const;
export type TransportRateVehicleCategory = (typeof TRANSPORT_RATE_VEHICLE_CATEGORIES)[number];

// Limited to what TP1 justified from real Journey itinerary data — no speculative rate
// types (e.g. per-km-only, reconstructed-circuit) added until a real need is shown.
export const TRANSPORT_RATE_TYPES = ['POINT_TO_POINT', 'ROUND_TRIP', 'CIRCUIT_FIXED'] as const;
export type TransportRateType = (typeof TRANSPORT_RATE_TYPES)[number];

export interface TransportRateInclusions {
  fuelIncluded?: boolean;
  driverAllowanceIncluded?: boolean;
  tollParkingIncluded?: boolean;
  stateTaxIncluded?: boolean;
  permitIncluded?: boolean;
  nightChargeIncluded?: boolean;
}

export interface TransportRateDocument extends Document {
  /** The real, identifiable supplier this rate belongs to — see TP2 Section 14's
   *  partner-eligibility rule, enforced in the pricing service, not here. */
  partnerId: Types.ObjectId;
  vehicleCategory: TransportRateVehicleCategory;
  rateType: TransportRateType;
  /** Set only for a route-specific POINT_TO_POINT/ROUND_TRIP rate. Left unset means a
   *  generic category-wide rate — that distinction is what lets the pricing service tell
   *  EXACT (route-specific match) from ESTIMATED (generic match only) apart. Never set
   *  for CIRCUIT_FIXED, which uses `circuitKey` instead. */
  routeId?: Types.ObjectId;
  /** Required for CIRCUIT_FIXED — a stable, human-assigned identifier for one multi-day
   *  itinerary (e.g. "spiti-circuit-shimla-manali"), never a TransportRoute id. A free
   *  string rather than a structured stop list or a required Journey link (TP2 Section
   *  13's "smallest safe circuit-identity design" decision) — see
   *  services/pricing/transportPricing.service.ts for the rationale. */
  circuitKey?: string;
  /** Optional metadata only, for the rate-collection priority matrix (TP1 Section 31) —
   *  never read by the pricing service's matching logic, so no Journey slug ever gates or
   *  filters which rates are eligible; a rate is reusable across Journeys by design. */
  journeySlug?: string;

  currency: 'INR';
  /** What the supplier charges Apex Voyager, in paise (integer) — never rupees-as-float.
   *  Mirrors models/Booking.ts's BookingMoneySnapshot minor-units convention, the
   *  existing money-safety precedent already proven in this repo (TP2 Section 21). This
   *  is supplier cost, not the customer-facing selling price — see this file's top-of-
   *  file note. */
  supplierCostMinorUnits: number;

  /** Kilometres included in supplierCostMinorUnits before extraKmRateMinorUnits applies. */
  includedKm?: number;
  /** Floor distance the extra-km calculation is measured against, even on a shorter
   *  actual trip (TP1's symbolic per-km formula: max(minimumKm, actualKm)). */
  minimumKm?: number;
  extraKmRateMinorUnits?: number;
  driverAllowanceMinorUnits?: number;
  nightChargeMinorUnits?: number;

  /** Explicit per-flag booleans, left `undefined` when genuinely unknown — never
   *  defaulted to false, which would silently assert an exclusion nobody confirmed
   *  (TP2 Section 10's "missing means unknown, not ₹0/excluded" rule). */
  inclusions?: TransportRateInclusions;

  /** Inclusive on both ends; checked against the customer's actual travel date, never
   *  server "today" alone (TP2 Section 7 — a future Journey's rate must be judged against
   *  its own travel date). */
  validFrom: Date;
  validTo: Date;
  active: boolean;

  /** Provenance — mandatory (TP2 Section 15). Free text on purpose: the only source this
   *  collection will ever legitimately hold is a genuine supplier-provided rate, so there
   *  is no fixed taxonomy to enumerate; this records *how* it was obtained (e.g. "Phone
   *  call with supplier, confirmed via WhatsApp on 2026-10-02"), not a category. */
  source: string;
  sourceReference?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

function isPositiveFiniteInteger(value: number): boolean {
  return Number.isInteger(value) && Number.isFinite(value) && value > 0;
}

function isNonNegativeFiniteInteger(value: number): boolean {
  return Number.isInteger(value) && Number.isFinite(value) && value >= 0;
}

const TransportRateInclusionsSchema = new Schema<TransportRateInclusions>(
  {
    fuelIncluded: { type: Boolean },
    driverAllowanceIncluded: { type: Boolean },
    tollParkingIncluded: { type: Boolean },
    stateTaxIncluded: { type: Boolean },
    permitIncluded: { type: Boolean },
    nightChargeIncluded: { type: Boolean }
  },
  { _id: false }
);

const TransportRateSchema = new Schema<TransportRateDocument>(
  {
    partnerId: { type: Schema.Types.ObjectId, ref: 'TransportPartner', required: true },
    vehicleCategory: { type: String, enum: TRANSPORT_RATE_VEHICLE_CATEGORIES, required: true },
    rateType: { type: String, enum: TRANSPORT_RATE_TYPES, required: true },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'TransportRoute',
      validate: {
        validator: function (this: TransportRateDocument, value: Types.ObjectId | undefined) {
          // A circuit is identified by circuitKey, never by a single TransportRoute row.
          return !(this.rateType === 'CIRCUIT_FIXED' && value);
        },
        message: 'routeId must not be set on a CIRCUIT_FIXED rate — use circuitKey instead'
      }
    },
    circuitKey: {
      type: String,
      // A plain `validate` callback is skipped by Mongoose when the field is `undefined`
      // — only `required` (itself a validator) is guaranteed to run in that case, so the
      // "must be present for CIRCUIT_FIXED" half has to live here, not in `validate`.
      required: [
        function (this: TransportRateDocument) {
          return this.rateType === 'CIRCUIT_FIXED';
        },
        'circuitKey is required when rateType is CIRCUIT_FIXED'
      ],
      validate: {
        validator: function (this: TransportRateDocument, value: string | undefined) {
          return this.rateType === 'CIRCUIT_FIXED' || !value;
        },
        message: 'circuitKey must be unset unless rateType is CIRCUIT_FIXED'
      }
    },
    journeySlug: { type: String },

    currency: { type: String, enum: ['INR'], required: true, default: 'INR' },
    supplierCostMinorUnits: {
      type: Number,
      required: true,
      validate: { validator: isPositiveFiniteInteger, message: 'supplierCostMinorUnits must be a positive, finite integer (paise) — never zero, negative, NaN or Infinity' }
    },

    includedKm: { type: Number, validate: { validator: isNonNegativeFiniteInteger, message: 'includedKm must be a non-negative integer' } },
    minimumKm: { type: Number, validate: { validator: isNonNegativeFiniteInteger, message: 'minimumKm must be a non-negative integer' } },
    extraKmRateMinorUnits: { type: Number, validate: { validator: isNonNegativeFiniteInteger, message: 'extraKmRateMinorUnits must be a non-negative integer' } },
    driverAllowanceMinorUnits: { type: Number, validate: { validator: isNonNegativeFiniteInteger, message: 'driverAllowanceMinorUnits must be a non-negative integer' } },
    nightChargeMinorUnits: { type: Number, validate: { validator: isNonNegativeFiniteInteger, message: 'nightChargeMinorUnits must be a non-negative integer' } },

    inclusions: { type: TransportRateInclusionsSchema },

    validFrom: { type: Date, required: true },
    validTo: {
      type: Date,
      required: true,
      validate: {
        // `this` is typed `any` here on purpose — same reasoning as models/Booking.ts's
        // balanceMinorUnits validator: Mongoose's own validator function type resolves
        // `this` to a union that includes `Query`, which doesn't expose sibling document
        // fields at all, so no type both satisfies the library's signature and
        // accurately describes what `this` really is at runtime (this
        // TransportRateDocument). Runtime behavior (verified by this file's own tests)
        // is what actually matters here.
        validator: function (this: any, value: Date) {
          return value >= this.validFrom;
        },
        message: 'validTo must be on or after validFrom'
      }
    },
    active: { type: Boolean, required: true, default: true },

    source: { type: String, required: true },
    sourceReference: { type: String },
    verifiedAt: { type: Date },
    verifiedBy: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

// Lookup index for the pricing service's route-specific and generic-rate queries.
TransportRateSchema.index({ vehicleCategory: 1, rateType: 1, routeId: 1, active: 1 });
// Lookup index for circuit-fixed queries.
TransportRateSchema.index({ circuitKey: 1, active: 1 });
// Supports listing a partner's own rates.
TransportRateSchema.index({ partnerId: 1 });
// Supports validity-window queries and the overlap-protection check
// (services/pricing/transportPricing.service.ts's findOverlappingActiveRate) —
// deliberately NOT a unique index: a legitimate seasonal replacement rate for the same
// identity but a different, non-overlapping window must remain insertable (TP2 Section
// 30). Overlap prevention is enforced in that service function instead, not by Mongo.
TransportRateSchema.index({ validFrom: 1, validTo: 1 });

// `models.TransportRate` survives Next.js dev hot-reloads — without this guard,
// re-running this module would call `model()` on an already-registered name and throw.
export const TransportRate = models.TransportRate ?? model<TransportRateDocument>('TransportRate', TransportRateSchema);
