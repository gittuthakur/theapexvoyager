import mongoose, { Schema, type Document } from 'mongoose';
import type { StayPricingProviderId } from '@/services/pricing/stayPricing.types';

const { model, models } = mongoose;

export const HOTEL_MAPPING_STATUSES = ['PENDING_REVIEW', 'CONFIRMED', 'REJECTED', 'DISABLED'] as const;
export type HotelMappingStatus = (typeof HOTEL_MAPPING_STATUSES)[number];

/** A single Google Place <-> supplier-hotel link, always starting life as
 *  PENDING_REVIEW (see services/pricing/hotelMappingRegistry.service.ts — a fuzzy
 *  matching algorithm is never allowed to write CONFIRMED directly). Deliberately its
 *  own collection, never a field on models/PlaceCache.ts: PlaceCache is a disposable,
 *  30-day-TTL Google Places cache (see its own doc comment), while a confirmed supplier
 *  mapping is exactly the kind of durable, human-reviewed fact that must survive a
 *  PlaceCache row expiring and being refetched. */
export interface HotelProviderMappingDocument extends Document {
  googlePlaceId: string;
  destinationSlug: string;
  /** Extensible — see services/pricing/stayPricing.types.ts's StayPricingProviderId.
   *  Never designed exclusively around HBX. */
  provider: StayPricingProviderId;
  providerHotelId: string;
  providerDestinationCode: string;
  googleHotelName: string;
  providerHotelName: string;
  googleLatitude?: number;
  googleLongitude?: number;
  providerLatitude?: number;
  providerLongitude?: number;
  nameSimilarity: number;
  distanceMeters?: number;
  /** Persisted independently of `status` so confirmMapping() can always refuse a
   *  coordinate-anomaly-flagged row (see services/pricing/hotelMapping.service.ts's
   *  'coordinate_anomaly_suspected' flag) as a defense-in-depth check — regardless of
   *  which code path originally created the document, never relying solely on the
   *  automatic candidate-generation flow having filtered it out upstream. */
  hasCoordinateAnomaly: boolean;
  status: HotelMappingStatus;
  /** Who ran the explicit review action — an operator identifier, never populated by
   *  algorithmic candidate generation itself. */
  confirmedBy?: string;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HotelProviderMappingSchema = new Schema<HotelProviderMappingDocument>(
  {
    googlePlaceId: { type: String, required: true },
    destinationSlug: { type: String, required: true },
    provider: { type: String, required: true },
    providerHotelId: { type: String, required: true },
    providerDestinationCode: { type: String, required: true },
    googleHotelName: { type: String, required: true },
    providerHotelName: { type: String, required: true },
    googleLatitude: { type: Number },
    googleLongitude: { type: Number },
    providerLatitude: { type: Number },
    providerLongitude: { type: Number },
    nameSimilarity: { type: Number, required: true },
    distanceMeters: { type: Number },
    hasCoordinateAnomaly: { type: Boolean, required: true, default: false },
    status: { type: String, enum: HOTEL_MAPPING_STATUSES, required: true, default: 'PENDING_REVIEW' },
    confirmedBy: { type: String },
    confirmedAt: { type: Date }
  },
  { timestamps: true }
);

// DB-level backstop (not just application logic) against two CONFIRMED rows ever
// existing for the same (googlePlaceId, provider) — a Google property must never
// silently resolve to two different supplier hotels for the same supplier. A
// `partialFilterExpression` means PENDING_REVIEW/REJECTED/DISABLED rows for the same
// pair (e.g. rejected candidates, or a fresh candidate regenerated after the old one
// was disabled) are explicitly allowed to coexist — only CONFIRMED is exclusive.
HotelProviderMappingSchema.index({ googlePlaceId: 1, provider: 1 }, { unique: true, partialFilterExpression: { status: 'CONFIRMED' } });
// Same backstop in the other direction — a supplier's hotel must never silently be
// claimed as the confirmed match for two different Google properties within the same
// destination.
HotelProviderMappingSchema.index(
  { provider: 1, providerHotelId: 1, destinationSlug: 1 },
  { unique: true, partialFilterExpression: { status: 'CONFIRMED' } }
);
// Supports createPendingCandidate's own-row dedupe lookup (services/pricing/
// hotelMappingRegistry.service.ts) — deliberately NOT unique: re-running candidate
// generation must be able to find and refresh its own prior PENDING_REVIEW row for the
// same (googlePlaceId, provider, providerHotelId) triple without colliding with it.
HotelProviderMappingSchema.index({ googlePlaceId: 1, provider: 1, providerHotelId: 1 });
// Supports the review-queue listing (getMappingCandidates).
HotelProviderMappingSchema.index({ status: 1, destinationSlug: 1 });

export const HotelProviderMapping = models.HotelProviderMapping ?? model<HotelProviderMappingDocument>('HotelProviderMapping', HotelProviderMappingSchema);
