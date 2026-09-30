import mongoose, { Schema, type Document, type Types } from 'mongoose';

const { model, models } = mongoose;

export interface JourneyItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface JourneyStayOption {
  id: string;
  label: string;
  extraPrice: number;
}

export interface JourneyAddOn {
  id: string;
  label: string;
  price: number;
}

export interface JourneySeasonalRate {
  label: string;
  startDate: string;
  endDate: string;
  price: number;
}

export interface JourneyPace {
  id: string;
  label: string;
  description: string;
  priceMultiplier: number;
}

export interface JourneySignatureMoment {
  title: string;
  description: string;
  time?: string;
}

export interface JourneyPick {
  title: string;
  description: string;
}

export interface JourneyApexPicks {
  view?: JourneyPick;
  stay?: JourneyPick;
  experience?: JourneyPick;
  taste?: JourneyPick;
  moment?: JourneyPick;
}

export interface JourneyFaq {
  question: string;
  answer: string;
}

export interface JourneyDocument extends Document {
  slug: string;
  name: string;
  destination: string;
  destinationSlugs?: string[];
  /** Same convention as models/Region.ts — a draft Journey is real, in-progress content
   *  that must never appear on any public discovery surface (listing, homepage,
   *  destination page, sitemap, structured data) or resolve at its own public URL. See
   *  lib/packages.ts (every public query filters `status: 'published'`) and proxy.ts
   *  (the existence check gating /journeys/[slug] against soft-404s uses the same
   *  filter, so a draft slug gets a genuine 404, not a leaked 200). Required, defaults
   *  to 'draft' — a new Journey is never accidentally public the moment it's created. */
  status: 'draft' | 'published';
  image?: string;
  duration: string;
  /** Required once `status` is 'published' — see the pre-validate hook below. Never
   *  fabricate a placeholder value here for a draft; leave it unset instead. */
  price?: number;
  category: string;
  shortDescription: string;
  highlights: string[];
  itinerary: JourneyItineraryDay[];
  /** Required (non-empty) once `status` is 'published' — see the pre-validate hook
   *  below. A draft may leave this `[]` until real, commercially-approved copy exists —
   *  never fabricated content just to satisfy validation. */
  inclusions: string[];
  /** Same rule as `inclusions` above. */
  exclusions: string[];
  stayOptions: JourneyStayOption[];
  addOns: JourneyAddOn[];
  seasonalPricing?: JourneySeasonalRate[];
  featured?: boolean;
  transportOptions?: JourneyStayOption[];
  pace?: JourneyPace[];
  signatureMoments?: JourneySignatureMoment[];
  apexPicks?: JourneyApexPicks;
  faqs?: JourneyFaq[];
  /** Backfilled by scripts/backfillRegionRefs.ts from `destinationSlugs` — see models/Region.ts. */
  regionId?: Types.ObjectId;
  // --- AI-readable content fields (Phase 1 foundation, added 2026-09) ---
  // All optional and deliberately unfilled on the existing 6 journeys — see
  // AGENTS.md/the Phase 1 audit: "do not fabricate values for existing packages."
  // A future journey (or a backfill once real copy is written) can populate any of
  // these; the template only ever renders one when it's actually present.
  /** Free-text town/city the itinerary begins from, e.g. "Chandigarh". */
  startingCity?: string;
  /** Free-text town/city the itinerary ends at, e.g. "Manali". */
  endingCity?: string;
  /** How `price` should be read, e.g. "per person (twin sharing)", "per couple". */
  priceBasis?: string;
  /** Real, descriptive hotel-tier copy distinct from `stayOptions`' bare price labels. */
  hotelCategoryDescription?: string;
  /** Who this journey is genuinely built for, e.g. "Couples and honeymooners". */
  idealTraveller?: string;
  /** Real seasonal guidance, e.g. "March–June and September–November". */
  bestTimeToVisit?: string;
  /** Caveats that don't belong in inclusions/exclusions (altitude, road closures, permits). */
  importantNotes?: string[];
  /** Plain-language description of how booking actually works end to end. */
  bookingProcess?: string;
  // --- Commercial-readiness fields (Phase 2C) — all optional, all deliberately unset on
  // every current Journey (the 6 live packages carry this info only as hand-authored
  // prose in app/journeys/[slug]/page.tsx's JOURNEY_SEO_OVERRIDES; backfilling that onto
  // these structured fields is a separate, not-yet-done exercise). See
  // lib/journeyCommercialReadiness.ts, which reads these to report publish blockers —
  // never enforced by the pre-validate hook below, specifically so the 6 live packages
  // (which lack all of them) remain valid, backward-compatible published documents. */
  /** Real, free-text pickup point(s)/instructions, e.g. "Chandigarh Airport, Chandigarh
   *  Railway Station, or ISBT Sector 43" — the same content shape as the live packages'
   *  hand-authored `pickupNote`, promoted to a real field. */
  pickupInfo?: string;
  /** Same shape as `pickupInfo`, for the drop leg. */
  dropInfo?: string;
  /** Real, free-text meal-plan description, e.g. "Daily breakfast only (CP)" or "All
   *  meals included (AP)" — never inferred from `inclusions` text. */
  mealPlan?: string;
  /** Real, free-text transport description, e.g. "Private SUV throughout" — distinct
   *  from `transportOptions`' priced tier list; this is the plain-language summary. */
  transportType?: string;
  /** The minimum group size this package's costing/itinerary assumes — an owner/costing
   *  assumption, never a marketing claim about availability. */
  minTravellers?: number;
  /** The number of hotel rooms the costing assumes for `minTravellers` (e.g. 2 travellers
   *  / 1 room = double occupancy) — paired with `minTravellers` to describe the
   *  occupancy basis a price was actually calculated against. */
  roomsIncluded?: number;
  /** True ONLY when this Journey's cancellation/refund terms are genuinely covered by
   *  the real, live, publicly-accessible general site policy at /cancellation-policy
   *  (components/modules/CancellationPolicyContent.tsx — case-by-case, no fixed
   *  percentages, explicitly covers "journeys"). This is a statement of fact, never a
   *  bypass: `lib/journeyCommercialReadiness.ts`'s `getCommercialBlockers()` only clears
   *  `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED` when this is `true`, and it must only
   *  ever be set `true` after that page has actually been confirmed live and public (see
   *  docs/phase-4b-final-commercial-approval.md's verification) — never merely because an
   *  owner approved using it, and never to fabricate a package-specific percentage this
   *  field does not and cannot represent. */
  usesGeneralCancellationPolicy?: boolean;
  // Populated automatically by `{ timestamps: true }` below — declared here only so
  // lib/packages.ts can read doc.updatedAt with type safety.
  createdAt: Date;
  updatedAt: Date;
}

const PickSchema = { title: String, description: String };

const JourneySchema = new Schema<JourneyDocument>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    destination: { type: String, required: true },
    destinationSlugs: { type: [String] },
    status: { type: String, enum: ['draft', 'published'], required: true, default: 'draft' },
    image: { type: String },
    duration: { type: String, required: true },
    price: { type: Number },
    category: { type: String, required: true },
    shortDescription: { type: String, required: true },
    highlights: { type: [String], required: true },
    itinerary: [{ day: Number, title: String, description: String }],
    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    stayOptions: [{ id: String, label: String, extraPrice: Number }],
    addOns: [{ id: String, label: String, price: Number }],
    seasonalPricing: [{ label: String, startDate: String, endDate: String, price: Number }],
    featured: { type: Boolean },
    transportOptions: [{ id: String, label: String, extraPrice: Number }],
    pace: [{ id: String, label: String, description: String, priceMultiplier: Number }],
    signatureMoments: [{ title: String, description: String, time: String }],
    apexPicks: {
      view: PickSchema,
      stay: PickSchema,
      experience: PickSchema,
      taste: PickSchema,
      moment: PickSchema
    },
    faqs: [{ question: String, answer: String }],
    regionId: { type: Schema.Types.ObjectId, ref: 'Region' },
    startingCity: { type: String },
    endingCity: { type: String },
    priceBasis: { type: String },
    hotelCategoryDescription: { type: String },
    idealTraveller: { type: String },
    bestTimeToVisit: { type: String },
    importantNotes: { type: [String] },
    bookingProcess: { type: String },
    pickupInfo: { type: String },
    dropInfo: { type: String },
    mealPlan: { type: String },
    transportType: { type: String },
    minTravellers: { type: Number },
    roomsIncluded: { type: Number },
    usesGeneralCancellationPolicy: { type: Boolean }
  },
  { timestamps: true }
);

// A published Journey is a real, commercially-live product page — enforced here, not
// just at the UI layer, so no code path (a future admin tool, a script, a typo in a
// migration) can ever flip status to 'published' without these actually being set.
// Never runs for a draft: a draft is explicitly allowed to have none of these yet (see
// each field's own doc comment above) — this is what makes "draft-safe incomplete
// commercial fields" an enforced guarantee rather than just a convention.
JourneySchema.pre('validate', function () {
  if (this.status === 'published') {
    if (typeof this.price !== 'number' || !Number.isFinite(this.price) || this.price <= 0) {
      throw new Error('A published Journey must have a real, positive price — see models/Journey.ts.');
    }
    if (!this.inclusions || this.inclusions.length === 0) {
      throw new Error('A published Journey must have at least one real inclusion — see models/Journey.ts.');
    }
    if (!this.exclusions || this.exclusions.length === 0) {
      throw new Error('A published Journey must have at least one real exclusion — see models/Journey.ts.');
    }
    if (!this.image) {
      throw new Error('A published Journey must have a real image — see models/Journey.ts.');
    }
  }
});

// Matches getFeaturedPackages()'s default sort so an unfiltered listing reads
// straight off the index instead of an in-memory sort of the full collection.
JourneySchema.index({ featured: -1, createdAt: 1 });
// Supports getPackagesByDestinationSlug()'s lookup.
JourneySchema.index({ destinationSlugs: 1 });
// Supports the Region Hub's per-region journeys listing.
JourneySchema.index({ regionId: 1, featured: -1, createdAt: 1 });
// Supports every public query (lib/packages.ts, app/sitemap.ts, proxy.ts) — all of them
// filter on `status` first; this lets that filter read straight off an index rather than
// scanning the whole collection, exactly mirroring models/Region.ts's own compound index.
JourneySchema.index({ status: 1, featured: -1, createdAt: 1 });

// `models.Journey` survives Next.js dev hot-reloads — without this guard, re-running this
// module would call `model()` on an already-registered name and throw.
export const Journey = models.Journey ?? model<JourneyDocument>('Journey', JourneySchema);
