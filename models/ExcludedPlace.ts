import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

// Only 'google' exists today (Google Places is the only externally-sourced property
// provider in this codebase) — kept as an enum, not hardcoded, so a future provider
// (Booking.com, etc.) can be added without a schema migration, same reasoning as
// services/pricing/stayPricing.types.ts's StayPricingProviderId.
export const EXCLUDED_PLACE_PROVIDERS = ['google'] as const;
export type ExcludedPlaceProvider = (typeof EXCLUDED_PLACE_PROVIDERS)[number];

/**
 * A property-owner opt-out/takedown request — deliberately its own collection, never a
 * field on models/PlaceCache.ts: PlaceCache is a disposable, 30-day-TTL Google Places
 * cache that Google's own data can silently repopulate (see lib/stays.ts's
 * fetchAndCacheStayType), while an exclusion must survive that TTL expiring and being
 * refetched — this collection is the durable, authoritative record that a refresh must
 * never be allowed to override. Matched by `providerPlaceId` (a stable Google Place ID),
 * never by property name — see services/properties/propertyExclusion.service.ts.
 *
 * Deliberately minimal: no requester email/phone/address is modeled — `requestedBy` is
 * a free-text field for whatever the admin adding the exclusion chooses to note (e.g. a
 * name or "front desk call 2026-09-30"), not a structured contact-details store.
 */
export interface ExcludedPlaceDocument extends Document {
  provider: ExcludedPlaceProvider;
  providerPlaceId: string;
  propertyName?: string;
  reason?: string;
  requestedBy?: string;
  requestDate?: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExcludedPlaceSchema = new Schema<ExcludedPlaceDocument>(
  {
    provider: { type: String, enum: EXCLUDED_PLACE_PROVIDERS, required: true },
    providerPlaceId: { type: String, required: true },
    propertyName: { type: String },
    reason: { type: String },
    requestedBy: { type: String },
    requestDate: { type: Date },
    notes: { type: String },
    isActive: { type: Boolean, required: true, default: true }
  },
  { timestamps: true }
);

// DB-level backstop (not just application logic) against two ACTIVE exclusion rows ever
// existing for the same (provider, providerPlaceId) — mirrors
// models/HotelProviderMapping.ts's partial-unique-on-status idiom exactly. A
// `partialFilterExpression` means a deactivated row is explicitly allowed to coexist
// with a later, newly-created active one for the same place (re-excluding after an
// earlier opt-out was withdrawn) — only one ACTIVE row per place at a time.
ExcludedPlaceSchema.index({ provider: 1, providerPlaceId: 1 }, { unique: true, partialFilterExpression: { isActive: true } });
// Supports the central exclusion-check query (services/properties/
// propertyExclusion.service.ts's getActiveExclusionSet) and the admin listing.
ExcludedPlaceSchema.index({ provider: 1, isActive: 1 });

// `models.ExcludedPlace` survives Next.js dev hot-reloads — without this guard,
// re-running this module would call `model()` on an already-registered name and throw.
export const ExcludedPlace = models.ExcludedPlace ?? model<ExcludedPlaceDocument>('ExcludedPlace', ExcludedPlaceSchema);
