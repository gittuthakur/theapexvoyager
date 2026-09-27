import mongoose, { Schema, type Document } from 'mongoose';
import { regions } from '@/config/regions.config';
import { TRANSPORT_RATE_VEHICLE_CATEGORIES, type TransportRateVehicleCategory } from './TransportRate';

const { model, models } = mongoose;

/**
 * TP3B — owner-approved formula-based transport estimation rules. This is a deliberately
 * separate collection from TransportRate (models/TransportRate.ts): TransportRate holds a
 * genuine, identifiable supplier's quoted cost; this collection holds a business-approved
 * calculation formula (₹/km + a small set of explicitly-applicable components) used only
 * when no genuine supplier rate exists. Neither collection may produce the other's result
 * status — see services/pricing/combinedTransportPricing.service.ts for how the two are
 * composed with supplier pricing always taking precedence.
 *
 * This collection is expected to start, and may remain, empty after TP3B ships (TP3B
 * Section 29) — an absolute gate, same spirit as TransportRate's own Section 29. No
 * monetary value in this file is a real rate; every one is owner-supplied at import time
 * via scripts/importTransportEstimateRules.ts.
 */

// Reuses TransportRate's vehicle-category list directly (rather than an independent copy,
// TransportRate's own approach for TransportVehicle) since both collections describe the
// same real fleet and must never drift into two different "known category" answers.
export { TRANSPORT_RATE_VEHICLE_CATEGORIES as TRANSPORT_ESTIMATE_VEHICLE_CATEGORIES };

// The one canonical region list (config/regions.config.ts) — not `as const`, so this is a
// runtime-derived string[] rather than a literal union; validated as an enum at the schema
// level and re-checked at read time (services/pricing/transportEstimate.service.ts),
// exactly like every other "reuse the canonical list" case in this repo.
export const TRANSPORT_ESTIMATE_SERVICE_REGIONS: string[] = regions.map((region) => region.id);
export type TransportEstimateServiceRegion = string;

// Full storable taxonomy (TP3B Section 5). Only the first three are ever calculated in
// TP3B — the rest exist so a future phase can store/approve a rule for them without a
// schema migration, but the calculator refuses to compute any of them until separately
// approved (services/pricing/transportEstimate.service.ts checks this before ever
// querying a rule).
export const TRANSPORT_ESTIMATE_TRIP_TYPES = [
  'ONE_WAY',
  'AIRPORT_TRANSFER',
  'RAILWAY_TRANSFER',
  'ROUND_TRIP',
  'LOCAL',
  'MULTI_DAY',
  'CIRCUIT',
  '4X4_SPECIAL'
] as const;
export type TransportEstimateTripType = (typeof TRANSPORT_ESTIMATE_TRIP_TYPES)[number];

export const SUPPORTED_ESTIMATE_TRIP_TYPES = ['ONE_WAY', 'AIRPORT_TRANSFER', 'RAILWAY_TRANSFER'] as const;
export type SupportedEstimateTripType = (typeof SUPPORTED_ESTIMATE_TRIP_TYPES)[number];

// Only PER_KM is implemented in TP3B (Section 6 — "do not prematurely implement a large
// pricing DSL"). A future PER_DAY/FIXED basis is a new enum member and a new calculator
// branch, added only once genuinely needed — never guessed at here.
export const TRANSPORT_ESTIMATE_RATE_BASIS = ['PER_KM'] as const;
export type TransportEstimateRateBasis = (typeof TRANSPORT_ESTIMATE_RATE_BASIS)[number];

// Strict on purpose (TP3B Section 4) — SUPPLIER is deliberately absent. A genuine
// supplier-backed number belongs in TransportRate, never here, however "market
// reference"-flavored it might look.
export const TRANSPORT_ESTIMATE_SOURCE_TYPES = ['MARKET_REFERENCE', 'BUSINESS_APPROVED_ESTIMATE'] as const;
export type TransportEstimateSourceType = (typeof TRANSPORT_ESTIMATE_SOURCE_TYPES)[number];

// Shared component-disclosure vocabulary (TP3B Section 20) — used for toll/parking/state
// tax/permit, none of which TP3B ever calculates an amount for. UNKNOWN is the default:
// never silently treated as ₹0/included.
export const TRANSPORT_ESTIMATE_COMPONENT_STATUSES = ['INCLUDED', 'EXCLUDED', 'AT_ACTUALS', 'UNKNOWN', 'CONFIRMATION_REQUIRED'] as const;
export type TransportEstimateComponentStatus = (typeof TRANSPORT_ESTIMATE_COMPONENT_STATUSES)[number];

export interface TransportEstimateDriverAllowance {
  /** Whether a driver-allowance concept applies to this rule at all. Absent/false means
   *  "not invented" — the calculator adds nothing and reports the component excluded. */
  applicable: boolean;
  /** true = already folded into perKmRateMinorUnits (add nothing separately, but still
   *  report the component included). false = add perDayAmountMinorUnits on top. Only
   *  meaningful when applicable is true. */
  includedInBaseFare: boolean;
  /** Required when applicable && !includedInBaseFare; must be unset otherwise, so the
   *  amount can never be silently double-counted. */
  perDayAmountMinorUnits?: number;
}

export interface TransportEstimateRuleDocument extends Document {
  vehicleCategory: TransportRateVehicleCategory;
  serviceRegion: string;
  tripType: TransportEstimateTripType;
  rateBasis: TransportEstimateRateBasis;

  /** Integer minor units (paise) per approved-distance kilometre — never a float, never a
   *  rupee value stored directly (mirrors TransportRate.supplierCostMinorUnits). */
  perKmRateMinorUnits: number;
  /** Floor distance (km) the calculation is measured against, even on a shorter approved
   *  road distance. Omitted means "no floor — use the actual approved distance" (TP3B
   *  Section 17), never an invented minimum. */
  minimumKmPerDay?: number;

  driverAllowance?: TransportEstimateDriverAllowance;

  /** Stored for a future overnight/multi-day trip type only — TP3B's own supported trip
   *  types (ONE_WAY/AIRPORT_TRANSFER/RAILWAY_TRANSFER) are same-day transfers and the
   *  calculator never reads this field (TP3B Section 19). */
  nightHaltChargeMinorUnits?: number;

  tollStatus: TransportEstimateComponentStatus;
  parkingStatus: TransportEstimateComponentStatus;
  stateTaxStatus: TransportEstimateComponentStatus;
  permitStatus: TransportEstimateComponentStatus;

  validFrom: Date;
  validTo: Date;
  active: boolean;

  sourceType: TransportEstimateSourceType;
  sourceName?: string;
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

const TransportEstimateDriverAllowanceSchema = new Schema<TransportEstimateDriverAllowance>(
  {
    applicable: { type: Boolean, required: true, default: false },
    includedInBaseFare: { type: Boolean, required: true, default: false },
    perDayAmountMinorUnits: {
      type: Number,
      // A plain `validate` callback is skipped by Mongoose when the field is `undefined`
      // (same reasoning as models/TransportRate.ts's circuitKey field) — the "must be
      // present when applicable and not included in the base fare" half has to live in
      // `required`, which is guaranteed to run even when the value is absent.
      required: [
        function (this: any) {
          return Boolean(this.applicable) && !this.includedInBaseFare;
        },
        'perDayAmountMinorUnits is required when applicable is true and includedInBaseFare is false'
      ],
      validate: {
        validator: function (this: any, value: number | undefined) {
          if (!this.applicable || this.includedInBaseFare) return value === undefined;
          return isPositiveFiniteInteger(value as number);
        },
        message:
          'perDayAmountMinorUnits must be a positive integer only when applicable is true and includedInBaseFare is false, and must be unset otherwise'
      }
    }
  },
  { _id: false }
);

const TransportEstimateRuleSchema = new Schema<TransportEstimateRuleDocument>(
  {
    vehicleCategory: { type: String, enum: TRANSPORT_RATE_VEHICLE_CATEGORIES, required: true },
    serviceRegion: { type: String, enum: TRANSPORT_ESTIMATE_SERVICE_REGIONS, required: true },
    tripType: { type: String, enum: TRANSPORT_ESTIMATE_TRIP_TYPES, required: true },
    rateBasis: { type: String, enum: TRANSPORT_ESTIMATE_RATE_BASIS, required: true },

    perKmRateMinorUnits: {
      type: Number,
      required: true,
      validate: { validator: isPositiveFiniteInteger, message: 'perKmRateMinorUnits must be a positive, finite integer (paise) — never zero, negative, NaN or Infinity' }
    },
    minimumKmPerDay: { type: Number, validate: { validator: isNonNegativeFiniteInteger, message: 'minimumKmPerDay must be a non-negative integer' } },

    driverAllowance: { type: TransportEstimateDriverAllowanceSchema },

    nightHaltChargeMinorUnits: { type: Number, validate: { validator: isNonNegativeFiniteInteger, message: 'nightHaltChargeMinorUnits must be a non-negative integer' } },

    tollStatus: { type: String, enum: TRANSPORT_ESTIMATE_COMPONENT_STATUSES, required: true, default: 'UNKNOWN' },
    parkingStatus: { type: String, enum: TRANSPORT_ESTIMATE_COMPONENT_STATUSES, required: true, default: 'UNKNOWN' },
    stateTaxStatus: { type: String, enum: TRANSPORT_ESTIMATE_COMPONENT_STATUSES, required: true, default: 'UNKNOWN' },
    permitStatus: { type: String, enum: TRANSPORT_ESTIMATE_COMPONENT_STATUSES, required: true, default: 'UNKNOWN' },

    validFrom: { type: Date, required: true },
    validTo: {
      type: Date,
      required: true,
      validate: {
        // Same `this: any` rationale as models/TransportRate.ts's validTo validator —
        // Mongoose's validator-function `this` type doesn't expose sibling fields.
        validator: function (this: any, value: Date) {
          return value >= this.validFrom;
        },
        message: 'validTo must be on or after validFrom'
      }
    },
    active: { type: Boolean, required: true, default: true },

    sourceType: { type: String, enum: TRANSPORT_ESTIMATE_SOURCE_TYPES, required: true },
    sourceName: { type: String },
    sourceReference: { type: String },
    verifiedAt: { type: Date },
    verifiedBy: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

// Lookup index for the calculator's business-key query (services/pricing/transportEstimate.service.ts).
TransportEstimateRuleSchema.index({ vehicleCategory: 1, serviceRegion: 1, tripType: 1, rateBasis: 1, active: 1 });
// Supports validity-window queries and the overlap-protection check — deliberately NOT a
// unique index, same reasoning as TransportRate.ts: a genuine seasonal replacement rule
// for the same identity but a non-overlapping window must remain insertable.
TransportEstimateRuleSchema.index({ validFrom: 1, validTo: 1 });

// `models.TransportEstimateRule` survives Next.js dev hot-reloads — without this guard,
// re-running this module would call `model()` on an already-registered name and throw.
export const TransportEstimateRule =
  models.TransportEstimateRule ?? model<TransportEstimateRuleDocument>('TransportEstimateRule', TransportEstimateRuleSchema);
