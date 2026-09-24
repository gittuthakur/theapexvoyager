import mongoose, { Schema, type Document } from 'mongoose';
import crypto from 'node:crypto';

const { model, models } = mongoose;

/**
 * A confirmed-or-in-progress PAID Journey reservation — deliberately a separate model
 * from models/BookingRequest.ts (the existing WhatsApp-lead-capture record) and from
 * models/Inquiry.ts/Enquiry.ts. Those represent "customer interest, no money moved,
 * staff follows up manually"; this represents "money captured or a payment attempt is
 * in flight" — a fundamentally different trust/legal state (see the Phase 9 audit's
 * Section D). Nothing here migrates or overloads those models; this phase creates no
 * documents of this type at all — it only defines the schema ahead of a future
 * booking-creation flow that doesn't exist yet (Phase 9C is quote + schema only).
 */

export const BOOKING_STATUSES = ['PENDING_PAYMENT', 'PAID', 'SUPPLIER_PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED', 'EXPIRED'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = ['NOT_INITIATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// 'SUPPLIER_PENDING' deliberately appears in both BOOKING_STATUSES and
// FULFILMENT_STATUSES — they are independent lifecycles (overall booking state vs.
// the operational supplier-confirmation sub-process), not a typo.
export const FULFILMENT_STATUSES = ['NOT_STARTED', 'SUPPLIER_PENDING', 'SUPPLIER_CONFIRMED', 'SUPPLIER_DECLINED', 'COMPLETED'] as const;
export type FulfilmentStatus = (typeof FULFILMENT_STATUSES)[number];

export const PAYMENT_MODES = ['FULL', 'DEPOSIT'] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const CANCELLED_BY_VALUES = ['customer', 'admin', 'system'] as const;
export type CancelledBy = (typeof CANCELLED_BY_VALUES)[number];

export const REFUND_STATUSES = ['NOT_APPLICABLE', 'PENDING', 'PROCESSED', 'DENIED'] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

/**
 * SHA-256 hex digest of a signed Journey quote token (services/booking/
 * journeyQuote.service.ts) — never the token itself. The token is a bearer credential:
 * anyone holding it can redeem its frozen price until expiry, so persisting it verbatim
 * in MongoDB would mean a database read alone could reproduce a still-valid quote. A
 * one-way fingerprint lets a future booking flow record *which* quote produced a given
 * Booking (for audit/correlation — e.g. "was this exact quote already used once")
 * without ever being able to reconstruct or replay the token from the stored value.
 */
export function computeQuoteFingerprint(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export interface BookingCustomerSnapshot {
  name: string;
  phone: string;
  email?: string;
}

/** Immutable — captured once at booking creation from the quote's own snapshot
 *  (services/booking/quote.types.ts's JourneyQuoteSnapshot), never re-read from the
 *  live Journey document afterward. A later edit to the Journey's name/inclusions/etc.
 *  must never retroactively change what a customer was told they booked. */
export interface BookingJourneySnapshot {
  name: string;
  destination: string;
  duration: string;
  stayOptionLabel?: string;
  transportOptionLabel?: string;
  paceLabel?: string;
  addOnLabels: string[];
}

export interface BookingMoneySnapshot {
  currency: 'INR';
  totalMinorUnits: number;
  payableNowMinorUnits: number;
  balanceMinorUnits: number;
  paymentMode: PaymentMode;
}

export interface BookingCancellation {
  cancelledAt: Date;
  cancelledBy: CancelledBy;
  reason?: string;
  refundAmountMinorUnits?: number;
  refundStatus?: RefundStatus;
  refundedAt?: Date;
}

export interface BookingDocument extends Document {
  bookingReference: string;
  /** Client-generated per checkout attempt — the DB-level unique index is what actually
   *  prevents a retried/duplicated payment request from ever creating two Booking
   *  documents, not application logic alone. */
  idempotencyKey: string;
  customer: BookingCustomerSnapshot;
  journeySlug: string;
  journeySnapshot: BookingJourneySnapshot;
  /** ISO `YYYY-MM-DD` — same convention as the quote snapshot and lib/dateValidation.ts. */
  travelDate: string;
  adults: number;
  children: number;
  money: BookingMoneySnapshot;
  quoteFingerprint: string;
  quoteIssuedAt: Date;
  quoteExpiresAt: Date;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  fulfilmentStatus: FulfilmentStatus;
  /** Reference identifiers only — e.g. a Razorpay order/payment id. Never a webhook
   *  secret, API key, or any provider authentication material. */
  paymentProvider?: string;
  paymentProviderOrderId?: string;
  paymentProviderPaymentId?: string;
  cancellation?: BookingCancellation;
  createdAt: Date;
  updatedAt: Date;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

const BookingCustomerSchema = new Schema<BookingCustomerSnapshot>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String }
  },
  { _id: false }
);

const BookingJourneySnapshotSchema = new Schema<BookingJourneySnapshot>(
  {
    name: { type: String, required: true },
    destination: { type: String, required: true },
    duration: { type: String, required: true },
    stayOptionLabel: { type: String },
    transportOptionLabel: { type: String },
    paceLabel: { type: String },
    addOnLabels: { type: [String], required: true, default: [] }
  },
  { _id: false }
);

const BookingMoneySchema = new Schema<BookingMoneySnapshot>(
  {
    currency: { type: String, enum: ['INR'], required: true, default: 'INR' },
    totalMinorUnits: { type: Number, required: true, validate: { validator: isNonNegativeInteger, message: 'totalMinorUnits must be a non-negative integer' } },
    payableNowMinorUnits: {
      type: Number,
      required: true,
      validate: { validator: isNonNegativeInteger, message: 'payableNowMinorUnits must be a non-negative integer' }
    },
    // The cross-field invariant (payableNow + balance === total) is enforced as a
    // second validator directly on this field, using the standard-Mongoose `this`
    // binding to its sibling fields — not a `pre('validate')` hook, which runs before
    // Mongoose's own field validators on a subdocument and does not reliably persist an
    // `invalidate()` call through to the final validation result. This form is enforced
    // at the schema layer regardless of which future code path ever constructs a
    // Booking.
    balanceMinorUnits: {
      type: Number,
      required: true,
      validate: {
        // `this` is typed `any` here on purpose — Mongoose's own validator function
        // type resolves `this` to a union that includes `Query`, which doesn't expose
        // sibling subdocument fields at all, so there is no type that both satisfies
        // the library's signature and accurately describes what `this` really is at
        // runtime (the BookingMoneySnapshot subdocument). Runtime behavior (verified by
        // this file's own tests) is what actually matters here.
        validator: function (this: any, value: number) {
          if (!isNonNegativeInteger(value)) return false;
          return this.payableNowMinorUnits + value === this.totalMinorUnits;
        },
        message: 'balanceMinorUnits must be a non-negative integer, and payableNowMinorUnits + balanceMinorUnits must equal totalMinorUnits'
      }
    },
    paymentMode: { type: String, enum: PAYMENT_MODES, required: true }
  },
  { _id: false }
);

const BookingCancellationSchema = new Schema<BookingCancellation>(
  {
    cancelledAt: { type: Date, required: true },
    cancelledBy: { type: String, enum: CANCELLED_BY_VALUES, required: true },
    reason: { type: String },
    refundAmountMinorUnits: {
      type: Number,
      validate: { validator: (value: number | undefined) => value === undefined || isNonNegativeInteger(value), message: 'refundAmountMinorUnits must be a non-negative integer' }
    },
    refundStatus: { type: String, enum: REFUND_STATUSES },
    refundedAt: { type: Date }
  },
  { _id: false }
);

const BookingSchema = new Schema<BookingDocument>(
  {
    bookingReference: { type: String, required: true, unique: true },
    idempotencyKey: { type: String, required: true, unique: true },
    customer: { type: BookingCustomerSchema, required: true },
    journeySlug: { type: String, required: true },
    journeySnapshot: { type: BookingJourneySnapshotSchema, required: true },
    travelDate: { type: String, required: true },
    adults: { type: Number, required: true, validate: { validator: (value: number) => Number.isInteger(value) && value >= 1, message: 'adults must be a positive integer' } },
    children: {
      type: Number,
      required: true,
      default: 0,
      validate: { validator: (value: number) => Number.isInteger(value) && value >= 0, message: 'children must be a non-negative integer' }
    },
    money: { type: BookingMoneySchema, required: true },
    quoteFingerprint: { type: String, required: true },
    quoteIssuedAt: { type: Date, required: true },
    quoteExpiresAt: { type: Date, required: true },
    status: { type: String, enum: BOOKING_STATUSES, required: true, default: 'PENDING_PAYMENT' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, required: true, default: 'NOT_INITIATED' },
    fulfilmentStatus: { type: String, enum: FULFILMENT_STATUSES, required: true, default: 'NOT_STARTED' },
    paymentProvider: { type: String },
    paymentProviderOrderId: { type: String },
    paymentProviderPaymentId: { type: String },
    cancellation: { type: BookingCancellationSchema }
  },
  { timestamps: true }
);

// Supports a future "My Bookings" lookup by phone — no customer auth system exists yet
// (see the Phase 9 audit's Section H), so phone is the only practical lookup key today.
BookingSchema.index({ 'customer.phone': 1 });
// Supports an ops/admin listing filtered by lifecycle state.
BookingSchema.index({ status: 1 });
// Supports a per-journey, per-date operational view (e.g. "who's travelling on this date").
BookingSchema.index({ journeySlug: 1, travelDate: 1 });
// Compound on (paymentProvider, paymentProviderOrderId) — never a standalone unique
// index on paymentProviderOrderId alone. The schema is explicitly designed to support
// multiple payment providers (paymentProvider is a free string, not yet constrained to
// a single value), and different providers' order-ID spaces are independent: e.g. a
// Razorpay order id and a future second provider's order id could coincidentally be the
// identical string without referring to the same real payment. A standalone unique
// index on paymentProviderOrderId would incorrectly treat that coincidence as a
// collision. Sparse — most Bookings won't have a provider order id until a payment
// attempt has actually started, and (provider, orderId) must never collide across those
// Bookings that don't have one yet.
BookingSchema.index({ paymentProvider: 1, paymentProviderOrderId: 1 }, { unique: true, sparse: true });

// `models.Booking` survives Next.js dev hot-reloads — without this guard, re-running
// this module would call `model()` on an already-registered name and throw.
export const Booking = models.Booking ?? model<BookingDocument>('Booking', BookingSchema);
