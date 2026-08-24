import mongoose, { Schema, type Document } from 'mongoose';

const { model, models } = mongoose;

export interface RegionHero {
  eyebrow: string;
  title: string;
  highlightedText?: string;
  subtitle: string;
  image: string;
  mobileImage?: string;
}

export interface RegionOverview {
  description: string;
  bestSeason: string;
  idealDuration: string;
  startingPoint: string;
  climate: string;
}

export interface RegionTravelGuide {
  bestTime: string;
  howToReach: string;
  weather: string;
  localTransport: string;
  permits?: string;
  responsibleTravel?: string;
}

export interface RegionSeo {
  title: string;
  description: string;
  image?: string;
}

export interface RegionDocument extends Document {
  name: string;
  slug: string;
  shortDescription: string;
  cardImage: string;
  showOnHomeHero: boolean;
  hero: RegionHero;
  overview: RegionOverview;
  travelGuide: RegionTravelGuide;
  seo: RegionSeo;
  featured?: boolean;
  sortOrder: number;
  status: 'draft' | 'published';
}

const HeroSchema = {
  eyebrow: { type: String, required: true },
  title: { type: String, required: true },
  highlightedText: { type: String },
  subtitle: { type: String, required: true },
  image: { type: String, required: true },
  mobileImage: { type: String }
};

const OverviewSchema = {
  description: { type: String, required: true },
  bestSeason: { type: String, required: true },
  idealDuration: { type: String, required: true },
  startingPoint: { type: String, required: true },
  climate: { type: String, required: true }
};

const TravelGuideSchema = {
  bestTime: { type: String, required: true },
  howToReach: { type: String, required: true },
  weather: { type: String, required: true },
  localTransport: { type: String, required: true },
  permits: { type: String },
  responsibleTravel: { type: String }
};

const SeoSchema = {
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String }
};

const RegionSchema = new Schema<RegionDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: { type: String, required: true },
    cardImage: { type: String, required: true },
    showOnHomeHero: { type: Boolean, required: true, default: false },
    hero: { type: HeroSchema, required: true },
    overview: { type: OverviewSchema, required: true },
    travelGuide: { type: TravelGuideSchema, required: true },
    seo: { type: SeoSchema, required: true },
    featured: { type: Boolean },
    sortOrder: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['draft', 'published'], required: true, default: 'draft' }
  },
  { timestamps: true }
);

// Supports getHomeHeroRegions()'s published+home-hero listing, sorted for free.
RegionSchema.index({ status: 1, showOnHomeHero: 1, sortOrder: 1 });

// `models.Region` survives Next.js dev hot-reloads — without this guard, re-running this
// module would call `model()` on an already-registered name and throw.
export const Region = models.Region ?? model<RegionDocument>('Region', RegionSchema);
