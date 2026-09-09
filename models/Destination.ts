import mongoose, { Schema, type Document, type Types } from 'mongoose';

const { model, models } = mongoose;

export interface DestinationPick {
  title: string;
  description: string;
}

export interface DestinationApexPicks {
  view?: DestinationPick;
  stay?: DestinationPick;
  experience?: DestinationPick;
  taste?: DestinationPick;
  moment?: DestinationPick;
}

export interface DestinationMatchScores {
  adventure: number;
  nature: number;
  luxury: number;
  crowds: number;
  slowTravel: number;
}

export type DestinationAccessType = 'road' | 'trek-gated' | 'trek-and-helicopter';

export interface DestinationRegistrationInfo {
  required: boolean;
  url: string;
  note?: string;
}

export interface DestinationDocument extends Document {
  id?: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  toursCount: number;
  image: string;
  link?: string;
  region?: string;
  state?: string;
  regionId?: Types.ObjectId;
  editorialDescription?: string;
  bestTime?: string;
  idealDuration?: string;
  altitude?: string;
  travelStyles?: string[];
  seasons?: string[];
  highlights?: Array<{ title: string; description: string }>;
  places?: Array<{ title: string; description: string }>;
  experiences?: string[];
  relatedSlugs?: string[];
  seo?: { title: string; description: string };
  isPopular?: boolean;
  priority?: number;
  personality?: string;
  badge?: string;
  popularityScore?: number;
  apexScore?: number;
  apexPicks?: DestinationApexPicks;
  hiddenGems?: Array<{ title: string; description: string }>;
  travelTips?: string[];
  matchScores?: DestinationMatchScores;
  seasonalNotes?: Record<string, string>;
  bestFor?: string[];
  coordinates?: { lat: number; lng: number };
  accessType?: DestinationAccessType;
  registrationInfo?: DestinationRegistrationInfo;
  officialAdvisoryUrl?: string;
  // Google Places enrichment (see types/destination.ts's GooglePlaceEnrichment) —
  // mirrored here so a curated Destination can carry it, never used for the
  // Google-Places-backed live search path in lib/destinations.ts, which stays config-only.
  placeId?: string;
  formattedAddress?: string;
  photos?: string[];
  rating?: number;
  userRatingCount?: number;
  lastSyncedAt?: string;
  source?: 'google-places' | 'cache' | 'mock';
}

const PickSchema = { title: String, description: String };

const DestinationSchema = new Schema<DestinationDocument>(
  {
    id: { type: String },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    toursCount: { type: Number, required: true, default: 0 },
    image: { type: String, required: true },
    link: { type: String },
    region: { type: String },
    state: { type: String },
    regionId: { type: Schema.Types.ObjectId, ref: 'Region' },
    editorialDescription: { type: String },
    bestTime: { type: String },
    idealDuration: { type: String },
    altitude: { type: String },
    travelStyles: { type: [String] },
    seasons: { type: [String] },
    highlights: [{ title: String, description: String }],
    places: [{ title: String, description: String }],
    experiences: { type: [String] },
    relatedSlugs: { type: [String] },
    seo: { title: String, description: String },
    isPopular: { type: Boolean },
    priority: { type: Number },
    personality: { type: String },
    badge: { type: String },
    popularityScore: { type: Number },
    apexScore: { type: Number },
    apexPicks: {
      view: PickSchema,
      stay: PickSchema,
      experience: PickSchema,
      taste: PickSchema,
      moment: PickSchema
    },
    hiddenGems: [{ title: String, description: String }],
    travelTips: { type: [String] },
    matchScores: {
      adventure: Number,
      nature: Number,
      luxury: Number,
      crowds: Number,
      slowTravel: Number
    },
    seasonalNotes: { type: Schema.Types.Mixed },
    bestFor: { type: [String] },
    coordinates: { lat: Number, lng: Number },
    accessType: { type: String, enum: ['road', 'trek-gated', 'trek-and-helicopter'] },
    registrationInfo: {
      required: Boolean,
      url: String,
      note: String
    },
    officialAdvisoryUrl: { type: String },
    placeId: { type: String },
    formattedAddress: { type: String },
    photos: { type: [String] },
    rating: { type: Number },
    userRatingCount: { type: Number },
    lastSyncedAt: { type: String },
    source: { type: String, enum: ['google-places', 'cache', 'mock'] }
  },
  { timestamps: true }
);

// Supports the Region Hub's per-region destination listing.
DestinationSchema.index({ regionId: 1 });

// `models.Destination` survives Next.js dev hot-reloads — without this guard, re-running
// this module would call `model()` on an already-registered name and throw.
export const Destination = models.Destination ?? model<DestinationDocument>('Destination', DestinationSchema);
