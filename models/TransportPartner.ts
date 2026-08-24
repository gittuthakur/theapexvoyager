import mongoose, { Schema, type Document, type Types } from 'mongoose';

const { model, models } = mongoose;

export type TransportPartnerType =
  | 'Cab Operator'
  | 'Tempo / Fleet Operator'
  | 'Self-Drive Rental'
  | '4x4 Operator'
  | 'Bike Rental'
  | 'Local Transport Provider';

export type TransportPartnerStatus = 'pending' | 'verified' | 'active' | 'suspended';

export interface TransportPartnerDocument extends Document {
  businessName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  state: string;
  city: string;
  serviceAreas: string[];
  /** A partner can genuinely offer more than one business (e.g. a Manali operator
   *  running Cab + 4x4 + Bike) — never forced into a single category. */
  partnerTypes: TransportPartnerType[];
  vehicleTypes: string[];
  numberOfVehicles?: number;
  operatingRoutes?: string[];
  withDriver: boolean;
  selfDrive: boolean;
  basicPricingInfo?: string;
  /** Free-text notes on documents the partner can provide — not a file upload; no
   *  document storage/verification infrastructure exists elsewhere in the codebase. */
  documentsNote?: string;
  status: TransportPartnerStatus;
  /** Backfilled by scripts/backfillRegionRefs.ts from `serviceAreas` — same derivation
   *  already used for TransportVehicle.regionIds. Empty until a real partner exists. */
  regionIds?: Types.ObjectId[];
}

const TransportPartnerSchema = new Schema<TransportPartnerDocument>(
  {
    businessName: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String },
    email: { type: String },
    state: { type: String, required: true },
    city: { type: String, required: true },
    serviceAreas: { type: [String], required: true },
    partnerTypes: {
      type: [String],
      enum: ['Cab Operator', 'Tempo / Fleet Operator', 'Self-Drive Rental', '4x4 Operator', 'Bike Rental', 'Local Transport Provider'],
      required: true
    },
    vehicleTypes: { type: [String], required: true },
    numberOfVehicles: { type: Number },
    operatingRoutes: { type: [String] },
    withDriver: { type: Boolean, required: true, default: false },
    selfDrive: { type: Boolean, required: true, default: false },
    basicPricingInfo: { type: String },
    documentsNote: { type: String },
    status: { type: String, enum: ['pending', 'verified', 'active', 'suspended'], required: true, default: 'pending' },
    regionIds: { type: [Schema.Types.ObjectId], ref: 'Region' }
  },
  { timestamps: true }
);

TransportPartnerSchema.index({ status: 1 });
// Supports "verified/active partners in region X" (Local Mobility).
TransportPartnerSchema.index({ regionIds: 1, status: 1 });
// Free-text fallback before regionIds is backfilled for a new partner.
TransportPartnerSchema.index({ serviceAreas: 1 });

// `models.TransportPartner` survives Next.js dev hot-reloads — without this guard,
// re-running this module would call `model()` on an already-registered name and throw.
export const TransportPartner =
  models.TransportPartner ?? model<TransportPartnerDocument>('TransportPartner', TransportPartnerSchema);
