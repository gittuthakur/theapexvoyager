import mongoose, { Schema, type Document } from 'mongoose';
import crypto from 'node:crypto';

const { model, models } = mongoose;

/** Generates the random, unguessable token a voucher link is keyed on — see
 *  HbxBookingDocument.voucherAccessToken's own doc comment for why this exists. */
export function generateVoucherAccessToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * A genuine Hotelbeds reservation this codebase itself created — deliberately a
 * SEPARATE model from models/HotelProviderMapping.ts (which only ever records a
 * hotel *identity* mapping, never booking state) and from models/Booking.ts (the
 * app's own internal enquiry/booking-request record, which has no HBX/rateKey concept
 * at all — see that model's own test asserting so). Stores only the minimum needed for
 * voucher generation/retrieval — never API credentials, never a full raw HBX response.
 */

export interface HbxBookingPaxRecord {
  roomId: number;
  type: 'AD' | 'CH';
  age?: number;
  name?: string;
  surname?: string;
}

export interface HbxBookingCancellationPolicyRecord {
  chargeAmount: string;
  chargeFrom: string;
}

export interface HbxBookingRoomRecord {
  code?: string;
  name?: string;
  rateKey?: string;
  boardCode?: string;
  boardName?: string;
  netAmount?: string;
  paxes: HbxBookingPaxRecord[];
  cancellationPolicies: HbxBookingCancellationPolicyRecord[];
  /** See services/providers/hbx/hbx.types.ts's HbxRate doc comment — preserved verbatim,
   *  never resolved from one field to the other and never invented. */
  rateCommentsId?: string;
  rateComments?: string;
}

export interface HbxBookingDocument extends Document {
  /** The real Hotelbeds booking reference — the only real-world identifier for this
   *  reservation, used for retrieval and cancellation. */
  reference: string;
  /** Present only once cancelled. */
  cancellationReference?: string;
  /** This codebase's own idempotency-style reference sent as Hotelbeds' clientReference —
   *  confirmed against a real Hotelbeds validation error that this must be 1-20
   *  characters (2026-09-28 certification-readiness verification). */
  clientReference: string;
  status: string;
  /** Which HBX environment produced this booking — stamped from
   *  services/providers/hbx/hbx.client.ts's getHbxEnvironment() at creation time, exactly
   *  the same fail-closed classification the pricing safety gate relies on. A 'test'
   *  booking must never be mistaken for a real, production reservation. */
  environment: 'test' | 'unknown' | 'production';
  providerHotelId: string;
  hotelName?: string;
  /** Best-effort content-detail enrichment (services/providers/hbx/hbxHotels.service.ts's
   *  getHotelContentDetail) — the Booking Confirmation response itself never carries
   *  these, so they're filled in separately, at persist time, and left undefined (never
   *  invented) if that lookup fails. Needed for a voucher's mandatory "hotel address"
   *  field. */
  hotelAddress?: string;
  hotelCity?: string;
  hotelPostalCode?: string;
  hotelCategoryDescription?: string;
  hotelPhone?: string;
  destinationName?: string;
  /** A random, unguessable secret generated once at persist time — never sent to
   *  Hotelbeds, never derived from `reference` (which is a real, guessable/enumerable
   *  Hotelbeds identifier). The voucher page requires an exact match on BOTH `reference`
   *  and this token before rendering anything, which is what makes arbitrary
   *  booking-reference enumeration impossible without also knowing this value. */
  voucherAccessToken: string;
  currency: string;
  checkIn?: string;
  checkOut?: string;
  holderName: string;
  holderSurname: string;
  rooms: HbxBookingRoomRecord[];
  totalNetAmount?: string;
  /** The genuine, identifiable supplier fulfilling this booking — required for a
   *  voucher; never invented when Hotelbeds doesn't return it. */
  supplierName?: string;
  supplierVatNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HbxBookingPaxSchema = new Schema<HbxBookingPaxRecord>(
  {
    roomId: { type: Number, required: true },
    type: { type: String, enum: ['AD', 'CH'], required: true },
    age: { type: Number },
    name: { type: String },
    surname: { type: String }
  },
  { _id: false }
);

const HbxBookingCancellationPolicySchema = new Schema<HbxBookingCancellationPolicyRecord>(
  {
    chargeAmount: { type: String, required: true },
    chargeFrom: { type: String, required: true }
  },
  { _id: false }
);

const HbxBookingRoomSchema = new Schema<HbxBookingRoomRecord>(
  {
    code: { type: String },
    name: { type: String },
    rateKey: { type: String },
    boardCode: { type: String },
    boardName: { type: String },
    netAmount: { type: String },
    paxes: { type: [HbxBookingPaxSchema], default: [] },
    cancellationPolicies: { type: [HbxBookingCancellationPolicySchema], default: [] },
    rateCommentsId: { type: String },
    rateComments: { type: String }
  },
  { _id: false }
);

const HbxBookingSchema = new Schema<HbxBookingDocument>(
  {
    reference: { type: String, required: true, unique: true },
    cancellationReference: { type: String },
    clientReference: { type: String, required: true },
    status: { type: String, required: true },
    environment: { type: String, enum: ['test', 'unknown', 'production'], required: true },
    providerHotelId: { type: String, required: true },
    hotelName: { type: String },
    hotelAddress: { type: String },
    hotelCity: { type: String },
    hotelPostalCode: { type: String },
    hotelCategoryDescription: { type: String },
    hotelPhone: { type: String },
    destinationName: { type: String },
    voucherAccessToken: { type: String, required: true, unique: true },
    currency: { type: String, required: true },
    checkIn: { type: String },
    checkOut: { type: String },
    holderName: { type: String, required: true },
    holderSurname: { type: String, required: true },
    rooms: { type: [HbxBookingRoomSchema], default: [] },
    totalNetAmount: { type: String },
    supplierName: { type: String },
    supplierVatNumber: { type: String }
  },
  { timestamps: true }
);

HbxBookingSchema.index({ providerHotelId: 1, checkIn: 1, checkOut: 1 });

// `models.HbxBooking` survives Next.js dev hot-reloads — without this guard, re-running
// this module would call `model()` on an already-registered name and throw.
export const HbxBooking = models.HbxBooking ?? model<HbxBookingDocument>('HbxBooking', HbxBookingSchema);
